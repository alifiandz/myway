/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const ADMIN_ACCOUNT_IDS = new Set(["11111111-1111-4111-8111-111111111111"]);
const FEEDBACK_STATUSES = new Set(["new", "reviewing", "resolved"]);

function isAdmin(request: Request): boolean {
  const accountId = request.headers.get("oai-authenticated-user-id");
  return Boolean(accountId && ADMIN_ACCOUNT_IDS.has(accountId));
}

function adminOnly(): Response {
  return Response.json({ error: "Admin access is required." }, { status: 403 });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/admin/feedback" && request.method === "GET") {
      if (!isAdmin(request)) return adminOnly();
      try {
        const category = url.searchParams.get("category") ?? "all";
        const status = url.searchParams.get("status") ?? "all";
        const search = (url.searchParams.get("search") ?? "").trim().slice(0, 200);
        const conditions: string[] = [];
        const bindings: string[] = [];
        if (["bug", "incorrect", "suggestion"].includes(category)) {
          conditions.push("category = ?");
          bindings.push(category);
        }
        if (FEEDBACK_STATUSES.has(status)) {
          conditions.push("status = ?");
          bindings.push(status);
        }
        if (search) {
          conditions.push("(details LIKE ? OR university LIKE ? OR programme LIKE ? OR page_url LIKE ? OR name LIKE ? OR email LIKE ?)");
          const term = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
          bindings.push(term, term, term, term, term, term);
        }
        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const query = `SELECT id, category, details, expected, page_feature AS pageFeature,
          information_category AS informationCategory, review_request AS reviewRequest,
          source_url AS sourceUrl, name, email, may_contact AS mayContact,
          page_url AS pageUrl, university, programme, locale, user_agent AS userAgent,
          viewport, screenshot_key AS screenshotKey, screenshot_name AS screenshotName,
          status, internal_notes AS internalNotes, updated_at AS updatedAt, created_at AS createdAt
          FROM feedback_submissions ${where} ORDER BY created_at DESC LIMIT 250`;
        const result = await env.DB.prepare(query).bind(...bindings).all();
        return Response.json({ submissions: result.results });
      } catch (error) {
        console.error("Feedback inbox failed", error);
        return Response.json({ error: "The feedback inbox could not be loaded." }, { status: 500 });
      }
    }

    const adminFeedbackMatch = url.pathname.match(/^\/api\/admin\/feedback\/([^/]+)$/);
    if (adminFeedbackMatch && request.method === "PATCH") {
      if (!isAdmin(request)) return adminOnly();
      try {
        const id = decodeURIComponent(adminFeedbackMatch[1]);
        const body = await request.json() as { status?: string; internalNotes?: string };
        const status = String(body.status ?? "");
        const internalNotes = String(body.internalNotes ?? "").trim().slice(0, 8000);
        if (!FEEDBACK_STATUSES.has(status)) {
          return Response.json({ error: "Invalid feedback status." }, { status: 400 });
        }
        const updatedAt = new Date().toISOString();
        const result = await env.DB.prepare("UPDATE feedback_submissions SET status = ?, internal_notes = ?, updated_at = ? WHERE id = ?")
          .bind(status, internalNotes || null, updatedAt, id).run();
        if (!result.meta.changes) return Response.json({ error: "Feedback was not found." }, { status: 404 });
        return Response.json({ ok: true, updatedAt });
      } catch (error) {
        console.error("Feedback update failed", error);
        return Response.json({ error: "The feedback could not be updated." }, { status: 500 });
      }
    }

    const adminScreenshotMatch = url.pathname.match(/^\/api\/admin\/feedback\/([^/]+)\/screenshot$/);
    if (adminScreenshotMatch && request.method === "GET") {
      if (!isAdmin(request)) return adminOnly();
      try {
        const id = decodeURIComponent(adminScreenshotMatch[1]);
        const row = await env.DB.prepare("SELECT screenshot_key, screenshot_name FROM feedback_submissions WHERE id = ?").bind(id).first<{ screenshot_key: string | null; screenshot_name: string | null }>();
        if (!row?.screenshot_key) return new Response("Screenshot not found", { status: 404 });
        const object = await env.BUCKET.get(row.screenshot_key);
        if (!object) return new Response("Screenshot not found", { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("Cache-Control", "private, no-store");
        headers.set("Content-Disposition", `inline; filename="${(row.screenshot_name ?? "feedback-screenshot").replaceAll('"', '')}"`);
        return new Response(object.body, { headers });
      } catch (error) {
        console.error("Feedback screenshot failed", error);
        return new Response("Screenshot could not be loaded", { status: 500 });
      }
    }

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      try {
        const form = await request.formData();
        const read = (key: string, limit = 4000) => String(form.get(key) ?? "").trim().slice(0, limit);
        const category = read("category", 40);
        const details = read("details");
        if (!["bug", "incorrect", "suggestion"].includes(category) || !details) {
          return Response.json({ error: "Please complete the required feedback fields." }, { status: 400 });
        }
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const screenshot = form.get("screenshot");
        let screenshotKey: string | null = null;
        let screenshotName: string | null = null;
        if (screenshot instanceof File && screenshot.size > 0) {
          if (!screenshot.type.startsWith("image/") || screenshot.size > 8 * 1024 * 1024) {
            return Response.json({ error: "The screenshot must be an image smaller than 8 MB." }, { status: 400 });
          }
          screenshotKey = `feedback/${createdAt.slice(0, 10)}/${id}`;
          screenshotName = screenshot.name.slice(0, 240);
          await env.BUCKET.put(screenshotKey, screenshot.stream(), { httpMetadata: { contentType: screenshot.type }, customMetadata: { originalName: screenshotName } });
        }
        await env.DB.prepare(`INSERT INTO feedback_submissions
          (id, category, details, expected, page_feature, information_category, review_request, source_url, name, email, may_contact, page_url, university, programme, locale, user_agent, viewport, screenshot_key, screenshot_name, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`)
          .bind(id, category, details, read("expected") || null, read("pageFeature", 500) || null, read("informationCategory", 100) || null, read("reviewRequest") || null, read("sourceUrl", 1000) || null, read("name", 200) || null, read("email", 320) || null, read("mayContact", 10) === "true" ? 1 : 0, read("pageUrl", 1200), read("university", 300) || null, read("programme", 500) || null, read("locale", 20) || null, read("userAgent", 1000) || null, read("viewport", 100) || null, screenshotKey, screenshotName, createdAt).run();
        return Response.json({ ok: true, id });
      } catch (error) {
        console.error("Feedback submission failed", error);
        return Response.json({ error: "Feedback could not be submitted. Please try again." }, { status: 500 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
