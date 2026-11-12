# Javenly Identity — Centralized Authentication Platform

> **Developed by Javenly Innovations**  
> Standalone, enterprise-grade Single Sign-On (SSO) and centralized identity platform powered by **Supabase Auth Free Tier**, **Cloudflare Pages**, and **OAuth 2.1 / OpenID Connect PKCE**.

---

## 💎 Operating Cost Guarantee: $0.00 / month

The entire infrastructure has been architected strictly around genuine permanent free tiers:
1. **Supabase Auth (Free Tier)**: 50,000 Monthly Active Users (MAU), Social logins, Passwordless magic links, Row Level Security, and cryptographic JWT issuance.
2. **Cloudflare Pages (Free Plan)**: Unlimited bandwidth, global Anycast edge network, automated TLS 1.3 SSL certificates, and 500 builds/month.
3. **Cloudflare Workers (Free Plan)**: 100,000 requests/day for edge identity API endpoints.
4. **Namecheap DNS**: Existing WordPress website at `javenly.com` remains 100% untouched.

---

## 🌐 Subdomain Topology

| Subdomain | Target | Purpose |
| :--- | :--- | :--- |
| `identity.javenly.com` | `javenly-identity.pages.dev` | Central login, registration, and OAuth 2.1 PKCE authorization consent gateway. |
| `account.javenly.com` | `javenly-identity.pages.dev` | Self-service user account portal: Profile, TOTP 2FA, sessions revocation, GDPR data export. |
| `admin-identity.javenly.com` | `javenly-identity.pages.dev` | Security administration console: User directory, application registry, and audit logs. |
| `api-identity.javenly.com` | `javenly-identity.workers.dev` | OIDC discovery (`/.well-known/openid-configuration`), JWKS, and versioned REST API. |

---

## 🚀 Key Capabilities

- **Single Sign-On (SSO)**: One Javenly account logs a user into WordPress (`javenly.com`), Javenly CRM (`crm.javenly.com`), and future mobile/web applications.
- **Strict OAuth 2.1 & OIDC**: Uses Authorization Code Flow with PKCE (`S256`). Implicit flow and client secrets in browser JavaScript are completely barred.
- **Permanent Immutable Subject Identifier (`sub`)**: Never links or stores accounts using mutable email addresses alone. Stores immutable UUIDs in WordPress user metadata (`_javenly_identity_sub`).
- **WordPress Integration**: Includes the official **Javenly Identity Connector** plugin with server-side token exchange and administrative settings page.
- **Node.js Integration**: Includes `@javenly/identity-node` middleware for Express, Next.js, and Hono apps.
- **Security & Privacy**: GDPR/CCPA personal data export, multi-step account deletion, session revocation across all devices, and immutable audit logs.

---

## 📚 Documentation Index

- [INSTALLATION.md](./INSTALLATION.md) — Local development on Windows 11 / Mac / Linux
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Cloudflare Pages & Supabase deployment
- [SECURITY.md](./SECURITY.md) — Threat model, PKCE validation, and token policy
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical topology, tokens, and data flow
- [API.md](./API.md) — OpenID Connect & REST API v1 specification
- [WORDPRESS-INTEGRATION.md](./WORDPRESS-INTEGRATION.md) — Plugin setup for Namecheap javenly.com
- [NODE-INTEGRATION.md](./NODE-INTEGRATION.md) — Express/Node.js integration guide
- [.env.example](./.env.example) — Configuration placeholders
