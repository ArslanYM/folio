# Security Policy

The Swatchbook team takes the security of our application and users seriously. Because Swatchbook accepts user-supplied URLs and processes external web content, security is treated as a foundational requirement.

---

## Supported Versions

| Version | Supported | Status |
| --- | --- | --- |
| `0.1.x` (current `main`) | ✅ Yes | Active development |
| `< 0.1.0` | ❌ No | Deprecated |

---

## Security Architecture & Defenses

Swatchbook employs defense-in-depth measures against common web application vulnerabilities:

1. **SSRF Guard (`lib/ssrf.ts`):**
   - All external URL requests are strictly validated using DNS resolution before connection.
   - Blocks private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), IPv6 loopback (`::1`), link-local (`169.254.0.0/16`), AWS/GCP/Azure instance metadata (`169.254.169.254`), and carrier-grade NAT ranges.
   - Redirect limits (max 3 hops) with re-validation on each hop.
   - Strict content-type validation and response size limits (max 2 MB per stylesheet/page).

2. **Rate Limiting (`lib/rate-limit.ts`):**
   - Sliding-window in-memory IP rate limiter protecting `/api/generate` against abuse and denial of service.

3. **Content Sanitization:**
   - Template previews use scriptless sandboxed iframes (`sandbox=""`).
   - Markdown output is rendered using hardened React Markdown components without raw unescaped HTML execution.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security issue or potential bypass (especially related to SSRF, XSS, or prompt injection), please report it responsibly:

1. **Preferred:** Use GitHub's [Private Vulnerability Reporting](https://github.com/ArslanYM/swatchbook/security/advisories/new) via the **Security** tab of the repository.
2. Provide a detailed summary including:
   - Type of vulnerability (e.g., SSRF bypass, XSS, rate-limit bypass)
   - Step-by-step reproduction instructions or a minimal proof-of-concept
   - Impact assessment
   - Suggested fix or mitigation (if known)

### Our Commitment

- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will coordinate a fix and publish an advisory before public disclosure.
- Security researchers who report valid vulnerabilities will be credited in release notes (unless anonymity is requested).
