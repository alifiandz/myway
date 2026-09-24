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

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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
          (id, category, details, expected, page_feature, information_category, review_request, source_url, name, email, may_contact, page_url, university, programme, locale, user_agent, viewport, screenshot_key, screenshot_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
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
