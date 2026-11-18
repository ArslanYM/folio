import dns from "node:dns/promises";
import net from "node:net";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);
const ALLOWED_CONTENT_TYPES = new Set(["text/html", "text/css"]);

export const MAX_REDIRECTS = 3;
export const FETCH_TIMEOUT_MS = 10_000;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB

export type DnsLookupFn = (
  hostname: string
) => Promise<Array<{ address: string; family: number }>>;

export class SsrfError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "ssrf-blocked", statusCode = 400) {
    super(message);
    this.name = "SsrfError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function parseIpv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => {
    if (!/^\d{1,3}$/.test(p)) return Number.NaN;
    return Number.parseInt(p, 10);
  });
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return [nums[0], nums[1], nums[2], nums[3]];
}

export function isBlockedIpv4(ip: string): boolean {
  const octets = parseIpv4(ip);
  if (!octets) return true;
  const [a, b] = octets;

  // 0.0.0.0/8 ("this" network)
  if (a === 0) return true;
  // 10.0.0.0/8 (RFC 1918 private)
  if (a === 10) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local & cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (RFC 1918 private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 & 192.0.2.0/24 (IETF / TEST-NET-1)
  if (a === 192 && b === 0) return true;
  // 192.168.0.0/16 (RFC 1918 private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved / broadcast)
  if (a >= 224) return true;

  return false;
}

export function isBlockedIpv6(rawIp: string): boolean {
  const ip = rawIp.toLowerCase().split("%")[0];

  // Unspecified & loopback
  if (ip === "::" || ip === "::1" || /^0+(:0+)*:0*1$/.test(ip)) return true;

  // IPv4-mapped IPv6 in dotted form: ::ffff:127.0.0.1
  const dottedMapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (dottedMapped) {
    return isBlockedIpv4(dottedMapped[1]);
  }

  // IPv4-mapped IPv6 in hex form: ::ffff:7f00:1
  const hexMapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);
  if (hexMapped) {
    const hi = Number.parseInt(hexMapped[1], 16);
    const lo = Number.parseInt(hexMapped[2], 16);
    const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isBlockedIpv4(ipv4);
  }

  // Extract leading hextet
  const firstHextetStr = ip.split(":")[0];
  if (firstHextetStr) {
    const first = Number.parseInt(firstHextetStr, 16);
    if (!Number.isNaN(first)) {
      // fc00::/7 (Unique Local Address: fc00..fdff)
      if ((first & 0xfe00) === 0xfc00) return true;
      // fe80::/10 (Link-local: fe80..febf)
      if ((first & 0xffc0) === 0xfe80) return true;
      // ff00::/8 (Multicast)
      if ((first & 0xff00) === 0xff00) return true;
    }
  }

  return false;
}

export function isBlockedIp(ip: string): boolean {
  const clean = ip.trim().replace(/^\[|\]$/g, "");
  const version = net.isIP(clean);
  if (version === 4) return isBlockedIpv4(clean);
  if (version === 6) return isBlockedIpv6(clean);
  return true;
}

const defaultLookup: DnsLookupFn = async (hostname) => {
  return dns.lookup(hostname, { all: true, verbatim: true });
};

export interface ValidateUrlResult {
  safe: boolean;
  url?: URL;
  error?: string;
  code?: string;
}

/**
 * Validates scheme, port, hostname, and resolved DNS IP addresses against SSRF blocklists.
 */
export async function validatePublicUrl(
  rawUrl: string,
  lookup: DnsLookupFn = defaultLookup
): Promise<ValidateUrlResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      safe: false,
      code: "invalid-url",
      error: "Please enter a valid http:// or https:// URL.",
    };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      safe: false,
      code: "invalid-protocol",
      error: "Only http:// and https:// URLs are supported.",
    };
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    return {
      safe: false,
      code: "blocked-port",
      error: `Port ${parsed.port} is not allowed. Use standard web ports (80, 443, 8080, 8443).`,
    };
  }

  if (parsed.username || parsed.password) {
    return {
      safe: false,
      code: "blocked-credentials",
      error: "URLs with embedded credentials are not allowed.",
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return {
      safe: false,
      code: "private-network",
      error: "That address points to a private network, so I can't fetch it.",
    };
  }

  const bareHost = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(bareHost)) {
    if (isBlockedIp(bareHost)) {
      return {
        safe: false,
        code: "private-network",
        error: "That address points to a private network, so I can't fetch it.",
      };
    }
    return { safe: true, url: parsed };
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(bareHost);
  } catch {
    return {
      safe: false,
      code: "dns-failed",
      error: `Could not resolve "${bareHost}". Check the domain and try again.`,
    };
  }

  if (!addresses || addresses.length === 0) {
    return {
      safe: false,
      code: "dns-empty",
      error: `No DNS records found for "${bareHost}".`,
    };
  }

  for (const record of addresses) {
    if (isBlockedIp(record.address)) {
      return {
        safe: false,
        code: "private-network",
        error: "That address points to a private network, so I can't fetch it.",
      };
    }
  }

  return { safe: true, url: parsed };
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
  signal?: AbortSignal;
  lookup?: DnsLookupFn;
  fetchImpl?: typeof fetch;
}

export interface SafeFetchResult {
  finalUrl: string;
  contentType: string;
  text: string;
}

/**
 * Fetches an HTML or CSS resource safely with SSRF checks before every hop,
 * max 3 redirects, 10s timeout, 2 MB byte limit, and strict Content-Type enforcement.
 */
export async function safeFetchText(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_RESPONSE_BYTES;
  const lookup = options.lookup ?? defaultLookup;
  const fetchImpl = options.fetchImpl ?? fetch;

  let currentUrl = initialUrl;

  for (let hops = 0; hops <= maxRedirects; hops += 1) {
    const check = await validatePublicUrl(currentUrl, lookup);
    if (!check.safe || !check.url) {
      throw new SsrfError(
        check.error ?? "Blocked URL.",
        check.code ?? "ssrf-blocked",
        400
      );
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetchImpl(check.url.toString(), {
        method: "GET",
        redirect: "manual",
        signal,
        headers: {
          "User-Agent":
            "SwatchbookBot/1.0 (+https://github.com/swatchbook; design-token-extractor)",
          Accept: "text/html,text/css;q=0.9,*/*;q=0.1",
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new SsrfError(
          "The website took too long to respond (10s timeout).",
          "fetch-timeout",
          504
        );
      }
      throw new SsrfError(
        "Could not connect to that website. Make sure it is publicly reachable.",
        "fetch-failed",
        502
      );
    }

    // Handle redirects manually and re-validate every destination
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      if (hops >= maxRedirects) {
        throw new SsrfError(
          "Too many redirects while fetching that URL.",
          "too-many-redirects",
          400
        );
      }
      const location = response.headers.get("location") ?? "";
      try {
        currentUrl = new URL(location, check.url).toString();
      } catch {
        throw new SsrfError(
          "The site redirected to an invalid URL.",
          "invalid-redirect",
          400
        );
      }
      continue;
    }

    if (!response.ok) {
      throw new SsrfError(
        `The website responded with HTTP ${response.status}.`,
        "http-error",
        502
      );
    }

    const rawContentType = response.headers.get("content-type") ?? "";
    const mimeType = rawContentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(mimeType)) {
      throw new SsrfError(
        `Unsupported content type "${mimeType || "unknown"}". Swatchbook only reads HTML and CSS pages.`,
        "unsupported-content-type",
        415
      );
    }

    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader) {
      const declaredSize = Number.parseInt(contentLengthHeader, 10);
      if (!Number.isNaN(declaredSize) && declaredSize > maxBytes) {
        throw new SsrfError(
          "The page exceeds the 2 MB download limit.",
          "payload-too-large",
          413
        );
      }
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > maxBytes) {
        throw new SsrfError(
          "The page exceeds the 2 MB download limit.",
          "payload-too-large",
          413
        );
      }
      return { finalUrl: check.url.toString(), contentType: mimeType, text };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new SsrfError(
            "The page exceeds the 2 MB download limit.",
            "payload-too-large",
            413
          );
        }
        chunks.push(value);
      }
    }

    const merged = Buffer.concat(chunks);
    return {
      finalUrl: check.url.toString(),
      contentType: mimeType,
      text: merged.toString("utf8"),
    };
  }

  throw new SsrfError("Too many redirects.", "too-many-redirects", 400);
}
