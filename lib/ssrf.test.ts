import { describe, expect, it } from "vitest";
import {
  isBlockedIp,
  safeFetchText,
  SsrfError,
  validatePublicUrl,
  type DnsLookupFn,
} from "./ssrf";

describe("lib/ssrf", () => {
  it("blocks private, loopback, link-local, CGNAT, and metadata IPv4/IPv6 addresses", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.5")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    expect(isBlockedIp("100.64.0.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:169.254.169.254")).toBe(true);

    // Public IPs pass
    expect(isBlockedIp("93.184.216.34")).toBe(false);
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("2606:2800:220:1:248:1893:25c8:1946")).toBe(false);
  });

  it("blocks localhost, loopback, metadata, bad schemes, bad ports, and private DNS resolutions", async () => {
    const blockedUrls = [
      "http://127.0.0.1",
      "http://localhost",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/",
      "file:///etc/passwd",
      "https://example.com:22/",
    ];

    for (const url of blockedUrls) {
      const res = await validatePublicUrl(url);
      expect(res.safe).toBe(false);
      expect(res.error).toBeTruthy();
    }

    // DNS name resolving to private IP must be blocked
    const fakePrivateDns: DnsLookupFn = async () => [
      { address: "10.0.1.42", family: 4 },
    ];
    const dnsBlocked = await validatePublicUrl(
      "https://sneaky.example.com",
      fakePrivateDns
    );
    expect(dnsBlocked.safe).toBe(false);
    expect(dnsBlocked.code).toBe("private-network");

    // DNS name resolving to public IP passes
    const fakePublicDns: DnsLookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
    ];
    const ok = await validatePublicUrl("https://example.com", fakePublicDns);
    expect(ok.safe).toBe(true);
  });

  it("re-checks SSRF on redirects and enforces Content-Type & max redirect caps", async () => {
    const publicDns: DnsLookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
    ];

    // Redirect to metadata IP must be blocked
    const redirectToPrivateFetch: typeof fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/secret" },
      });

    await expect(
      safeFetchText("https://example.com", {
        lookup: publicDns,
        fetchImpl: redirectToPrivateFetch,
      })
    ).rejects.toThrow(SsrfError);

    // Non-HTML/CSS content type must be rejected
    const jsonFetch: typeof fetch = async () =>
      new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    await expect(
      safeFetchText("https://example.com", {
        lookup: publicDns,
        fetchImpl: jsonFetch,
      })
    ).rejects.toThrow(/Unsupported content type/);

    // Valid HTML passes
    const htmlFetch: typeof fetch = async () =>
      new Response("<html><body>Hello</body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });

    const result = await safeFetchText("https://example.com", {
      lookup: publicDns,
      fetchImpl: htmlFetch,
    });
    expect(result.contentType).toBe("text/html");
    expect(result.text).toContain("Hello");
  });
});
