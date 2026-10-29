import sharp from "sharp";
import { createHash } from "node:crypto";
import { IMAGE_HOSTS, IMAGE_WIDTHS } from "../lib/image-url";

const MAX_BYTES = 12_000_000;
const MAX_CACHE_BYTES = 32_000_000;
sharp.concurrency(1);
sharp.cache({ memory: 16, files: 0, items: 32 });
const cache = new Map<string, { body: Uint8Array; etag: string; until: number }>();
const pending = new Map<string, Promise<{ body: Uint8Array; etag: string; until: number }>>();
let cachedBytes = 0;

function allowed(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !IMAGE_HOSTS.has(url.hostname)) throw new Error("Unsupported image host");
  return url;
}

async function transform(source: string, width: number, fetcher: typeof fetch) {
  let url = allowed(source);
  let response: Response | undefined;
  for (let redirects = 0; redirects < 3; redirects++) {
    response = await fetcher(url, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { Accept: "image/avif,image/webp,image/*" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get("location");
      await response.body?.cancel();
      if (!next) throw new Error("Missing image redirect");
      url = allowed(new URL(next, url).href);
    } else break;
  }
  if (!response?.ok || !/^image\/(jpeg|png|webp|avif)(?:;|$)/i.test(response.headers.get("content-type") ?? "")) {
    await response?.body?.cancel();
    throw new Error("Unsupported image response");
  }
  if (Number(response.headers.get("content-length")) > MAX_BYTES || !response.body) {
    await response.body?.cancel();
    throw new Error("Image too large");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error("Image too large"); }
    chunks.push(value);
  }
  const body = await sharp(Buffer.concat(chunks), { limitInputPixels: 30_000_000, animated: false })
    .rotate().resize({ width, height: width * 2, fit: "inside", withoutEnlargement: true }).webp({ quality: 84, effort: 3 }).toBuffer();
  return { body, etag: `"${createHash("sha256").update(body).digest("hex").slice(0, 32)}"`, until: Date.now() + 86400000 };
}

/** A bounded thumbnail cache. Failed transformations leave the original image usable. */
export async function optimizeImage(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const source = params.get("src") ?? "";
  const width = Number(params.get("w"));
  try { allowed(source); } catch { return new Response("Unsupported image URL", { status: 400 }); }
  if (!(IMAGE_WIDTHS as readonly number[]).includes(width)) return new Response("Unsupported image size", { status: 400 });
  const key = `${source}:${width}`;
  let image = cache.get(key);
  if (image && image.until < Date.now()) { cachedBytes -= image.body.byteLength; cache.delete(key); image = undefined; }
  if (!image) {
    if (!pending.has(key)) {
      if (pending.size >= 4) return new Response("Image service busy", { status: 503, headers: { "Retry-After": "2" } });
      pending.set(key, transform(source, width, fetcher));
    }
    try {
      image = await pending.get(key)!;
      if (!cache.has(key) && image.body.byteLength <= MAX_CACHE_BYTES) {
        while (cache.size >= 128 || cachedBytes + image.body.byteLength > MAX_CACHE_BYTES) {
          const first = cache.keys().next().value;
          if (!first) break;
          cachedBytes -= cache.get(first)!.body.byteLength; cache.delete(first);
        }
        cache.set(key, image); cachedBytes += image.body.byteLength;
      }
    } catch { return new Response("Image unavailable", { status: 502, headers: { "Cache-Control": "no-store" } }); }
    finally { pending.delete(key); }
  }
  const headers = { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", ETag: image.etag, "X-Content-Type-Options": "nosniff" };
  if (request.headers.get("if-none-match") === image.etag) return new Response(null, { status: 304, headers });
  return new Response(request.method === "HEAD" ? null : image.body as BodyInit, { headers });
}
