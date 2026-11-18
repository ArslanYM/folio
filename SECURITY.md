# Security Policy

## Supported Versions

Swatchbook is currently in active v1 development on the `main` branch.

## Reporting a Vulnerability

Because Swatchbook fetches user-supplied URLs and parses untrusted HTML/CSS, we take security issues — especially SSRF bypasses, XSS in markdown/preview rendering, and header/prompt injection — seriously.

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead:

1. Use GitHub's **Private Vulnerability Reporting** ("Report a vulnerability" in the repository Security tab), or
2. Contact the maintainers directly with:
   - A clear description of the vulnerability and potential impact
   - Steps to reproduce or a minimal proof of concept
   - Any suggested remediation if known

We aim to acknowledge reports within 72 hours and coordinate a fix before public disclosure.
