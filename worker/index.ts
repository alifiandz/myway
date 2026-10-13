/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { healthResponse } from "./health";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  MYWAY_ADMIN_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_GOOGLE_ENABLED?: string;
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
const ADMIN_ORIGIN = "https://admin.example.com";

function isAdmin(request: Request): boolean {
  const accountId = request.headers.get("oai-authenticated-user-id");
  return Boolean(accountId && ADMIN_ACCOUNT_IDS.has(accountId));
}

function isAdminRequest(request: Request, env: Env): boolean {
  const supplied = request.headers.get("x-myway-admin-key");
  return isAdmin(request) || Boolean(env.MYWAY_ADMIN_SECRET && supplied === env.MYWAY_ADMIN_SECRET);
}

async function isSupabaseAdmin(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ") || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return false;
  try {
    const headers = { Authorization: authorization, apikey: env.SUPABASE_PUBLISHABLE_KEY };
    const signal = AbortSignal.timeout(10_000);
    const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers, signal });
    if (!userResponse.ok) return false;
    const user = await userResponse.json() as { id?: string };
    if (!user.id) return false;
    const profileResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${encodeURIComponent(user.id)}&select=role`, { headers, signal });
    if (!profileResponse.ok) return false;
    const profiles = await profileResponse.json() as Array<{ role?: string }>;
    return profiles[0]?.role === "admin";
  } catch { return false; }
}

function adminCors(response: Response): Response {
  const next = new Response(response.body, response);
  next.headers.set("Access-Control-Allow-Origin", ADMIN_ORIGIN);
  next.headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  next.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-MyWay-Admin-Key");
  next.headers.set("Vary", "Origin");
  return next;
}

function adminOnly(): Response {
  return Response.json({ error: "Admin access is required." }, { status: 403 });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
async function validScreenshotBytes(bytes: Uint8Array, type: string): Promise<boolean> {
  if (type === "image/png") return [137,80,78,71,13,10,26,10].every((byte,index) => bytes[index] === byte);
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
      return healthResponse(env);
    }

    if (url.pathname === "/api/auth-config" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return Response.json({ error: "MyWay accounts are not configured." }, { status: 503 });
      return Response.json({ url: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY, googleEnabled: env.SUPABASE_GOOGLE_ENABLED === "true" }, { headers: { "Cache-Control": "public, max-age=300" } });
    }

    if (url.pathname === "/api/admin-visibility" && request.method === "GET") {
      return Response.json({ authorized: isAdmin(request) }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (url.pathname.startsWith("/api/admin/feedback") && request.method === "OPTIONS") {
      return adminCors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/api/admin/feedback" && request.method === "GET") {
      if (!isAdminRequest(request, env) && !await isSupabaseAdmin(request, env)) return adminCors(adminOnly());
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
        return adminCors(Response.json({ submissions: result.results }));
      } catch (error) {
        console.error("Feedback inbox failed", error);
        return adminCors(Response.json({ error: "The feedback inbox could not be loaded." }, { status: 500 }));
      }
    }

    const adminFeedbackMatch = url.pathname.match(/^\/api\/admin\/feedback\/([^/]+)$/);
    if (adminFeedbackMatch && request.method === "PATCH") {
      if (!isAdminRequest(request, env) && !await isSupabaseAdmin(request, env)) return adminCors(adminOnly());
      try {
        const id = decodeURIComponent(adminFeedbackMatch[1]);
        const body = await request.json() as { status?: string; internalNotes?: string };
        const status = String(body.status ?? "");
        const internalNotes = String(body.internalNotes ?? "").trim().slice(0, 8000);
        if (!FEEDBACK_STATUSES.has(status)) {
          return adminCors(Response.json({ error: "Invalid feedback status." }, { status: 400 }));
        }
        const updatedAt = new Date().toISOString();
        const result = await env.DB.prepare("UPDATE feedback_submissions SET status = ?, internal_notes = ?, updated_at = ? WHERE id = ?")
          .bind(status, internalNotes || null, updatedAt, id).run();
        if (!result.meta.changes) return adminCors(Response.json({ error: "Feedback was not found." }, { status: 404 }));
        return adminCors(Response.json({ ok: true, updatedAt }));
      } catch (error) {
        console.error("Feedback update failed", error);
        return adminCors(Response.json({ error: "The feedback could not be updated." }, { status: 500 }));
      }
    }

    const adminScreenshotMatch = url.pathname.match(/^\/api\/admin\/feedback\/([^/]+)\/screenshot$/);
    if (adminScreenshotMatch && request.method === "GET") {
      if (!isAdminRequest(request, env) && !await isSupabaseAdmin(request, env)) return adminCors(adminOnly());
      try {
        const id = decodeURIComponent(adminScreenshotMatch[1]);
        const row = await env.DB.prepare("SELECT screenshot_key, screenshot_name FROM feedback_submissions WHERE id = ?").bind(id).first<{ screenshot_key: string | null; screenshot_name: string | null }>();
        if (!row?.screenshot_key) return adminCors(new Response("Screenshot not found", { status: 404 }));
        const object = await env.BUCKET.get(row.screenshot_key);
        if (!object) return adminCors(new Response("Screenshot not found", { status: 404 }));
        const type = object.httpMetadata?.contentType ?? "";
        if (!SCREENSHOT_TYPES.has(type) || object.size > 8 * 1024 * 1024) return adminCors(new Response("Unsupported screenshot", { status: 415 }));
        const bytes = new Uint8Array(await object.arrayBuffer());
        if (!await validScreenshotBytes(bytes, type)) return adminCors(new Response("Unsupported screenshot", { status: 415 }));
        const headers = new Headers({ "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" });
        const extension = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
        headers.set("Content-Disposition", `attachment; filename="feedback-screenshot.${extension}"`);
        return adminCors(new Response(bytes, { headers }));
      } catch (error) {
        console.error("Feedback screenshot failed", error);
        return adminCors(new Response("Screenshot could not be loaded", { status: 500 }));
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
        let safePageUrl = "";
        try { const page = new URL(read("pageUrl", 1200)); if (["http:", "https:"].includes(page.protocol)) safePageUrl = page.origin + page.pathname; } catch { /* Optional page URL. */ }
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const screenshot = form.get("screenshot");
        let screenshotKey: string | null = null;
        let screenshotName: string | null = null;
        if (screenshot instanceof File && screenshot.size > 0) {
          if (!SCREENSHOT_TYPES.has(screenshot.type) || screenshot.size > 8 * 1024 * 1024) {
            return Response.json({ error: "The screenshot must be PNG, JPG or WebP smaller than 8 MB." }, { status: 400 });
          }
          const bytes = new Uint8Array(await screenshot.arrayBuffer());
          if (!await validScreenshotBytes(bytes, screenshot.type)) return Response.json({ error: "Screenshot contents do not match PNG, JPG or WebP." }, { status: 400 });
          screenshotKey = `feedback/${createdAt.slice(0, 10)}/${id}`;
          screenshotName = screenshot.name.slice(0, 240);
          await env.BUCKET.put(screenshotKey, bytes, { httpMetadata: { contentType: screenshot.type }, customMetadata: { originalName: screenshotName } });
        }
        await env.DB.prepare(`INSERT INTO feedback_submissions
          (id, category, details, expected, page_feature, information_category, review_request, source_url, name, email, may_contact, page_url, university, programme, locale, user_agent, viewport, screenshot_key, screenshot_name, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`)
          .bind(id, category, details, read("expected") || null, read("pageFeature", 500) || null, read("informationCategory", 100) || null, read("reviewRequest") || null, read("sourceUrl", 1000) || null, read("name", 200) || null, read("email", 320) || null, read("mayContact", 10) === "true" ? 1 : 0, safePageUrl, read("university", 300) || null, read("programme", 500) || null, read("locale", 20) || null, read("userAgent", 1000) || null, read("viewport", 100) || null, screenshotKey, screenshotName, createdAt).run();
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
