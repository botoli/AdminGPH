const PREVIEW_TIMEOUT_MS = 8_000;

type ProductSource = "wildberries" | "ozon" | "avito" | "other";

interface WishlistProductPreview {
  productImageUrl: string | null;
  productSource: ProductSource | null;
}

function resolveSource(hostname: string): ProductSource {
  if (hostname.includes("wildberries.ru")) return "wildberries";
  if (hostname.includes("ozon.ru")) return "ozon";
  if (hostname.includes("avito.ru")) return "avito";
  return "other";
}

function extractMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

function extractJsonLdImage(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  for (const script of scripts) {
    const content = script
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    if (!content) continue;

    try {
      const parsed = JSON.parse(content) as unknown;
      const image = findImageInJsonLd(parsed);
      if (image) return image;
    } catch {
      continue;
    }
  }

  return null;
}

function findImageInJsonLd(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const image = findImageInJsonLd(item);
      if (image) return image;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if ("image" in record) {
    const image = findImageInJsonLd(record.image);
    if (image) return image;
  }

  if ("@graph" in record) {
    const image = findImageInJsonLd(record["@graph"]);
    if (image) return image;
  }

  if ("url" in record && typeof record.url === "string" && /^https?:\/\//i.test(record.url)) {
    return record.url;
  }

  return null;
}

function toAbsoluteUrl(rawUrl: string | null, productUrl: URL) {
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl, productUrl).toString();
  } catch {
    return null;
  }
}

export async function getWishlistProductPreview(productUrl: string): Promise<WishlistProductPreview> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(productUrl);
  } catch {
    return { productImageUrl: null, productSource: null };
  }

  const productSource = resolveSource(parsedUrl.hostname);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AdminGPH/1.0; +https://example.local)",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { productImageUrl: null, productSource };
    }

    const html = await response.text();
    const imageUrl = toAbsoluteUrl(
      extractMetaContent(html, ["og:image", "twitter:image", "og:image:url"]) ?? extractJsonLdImage(html),
      parsedUrl,
    );

    return { productImageUrl: imageUrl, productSource };
  } catch {
    return { productImageUrl: null, productSource };
  } finally {
    clearTimeout(timeout);
  }
}
