# Architecture Overview — Javenly Identity

```
                                  [ User Browser / Device ]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         identity.javenly.com        account.javenly.com     admin-identity.javenly.com
        (Central Auth Gateway)     (User Account Portal)      (Admin Security Console)
                    │                         │                         │
                    └─────────────────────────┬─────────────────────────┘
                                              │
                                              ▼
                             [ Cloudflare Pages Edge (Free) ]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
         api-identity.javenly.com                             [ Supabase Auth ]
        (Cloudflare Workers Edge)                              (Free Tier Engine)
        - OIDC Discovery: /.well-known/openid-config           - 50,000 MAU free
        - UserInfo: /api/v1/me                                 - GoTrue Auth Engine
        - JWKS Verification Keys                              - JWT Signing (RS256)
                                                               - MFA TOTP Engine
```

---

## 1. Subdomain Topology

1. **`identity.javenly.com`**
   - Central authentication user interface.
   - Hosted on Cloudflare Pages.
   - Handles email/password sign-in, magic links, user registration, and OAuth 2.1 PKCE consent.

2. **`account.javenly.com`**
   - Self-service portal for logged-in users.
   - Profile claims, MFA enrollment, active device sessions list, GDPR personal data export, and account deletion.

3. **`admin-identity.javenly.com`**
   - Restricted to users with `admin` or `super_admin` role.
   - User directory management, application registry (Client IDs, redirect URIs), and security audit log.

4. **`api-identity.javenly.com`**
   - High-speed edge API powered by Cloudflare Workers.
   - OpenID Connect 1.0 Discovery (`/.well-known/openid-configuration`), UserInfo, and token revocation.

---

## 2. Standards-Compliant 10-Step Authentication Flow

```
User -> Application (WordPress or CRM)
  1. User selects "Sign in with Javenly"
  2. Application generates PKCE code_verifier & code_challenge (S256)
  3. Browser redirected to https://identity.javenly.com/v1/auth/authorize
  4. User signs in or authenticates existing session
  5. User consents to scopes (openid, profile, email)
  6. Browser redirected back to registered callback URI with authorization code
  7. Application backend exchanges code + code_verifier with token endpoint
  8. Identity token validated against Supabase JWKS asymmetric keys
  9. Application looks up user via permanent _javenly_identity_sub UUID
 10. Application session created; user enters application.
```
