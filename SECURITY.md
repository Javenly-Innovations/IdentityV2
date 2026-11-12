# Security Policy & Architecture — Javenly Identity

> **Javenly Innovations Security Standard**  
> OAuth 2.1 & OpenID Connect PKCE Cryptographic Enforcement

---

## 1. Core Principles

Centralized identity is the cryptographic backbone of Javenly Innovations. Compromising identity would compromise all connected systems. We adhere to the following non-negotiable security requirements:

### Strict OAuth 2.1 & PKCE (RFC 7636)
- Every authorization code request **MUST** provide a high-entropy `code_verifier` (minimum 43 characters, base64url-encoded) and a SHA-256 `code_challenge` with `code_challenge_method=S256`.
- **OAuth Implicit Grant Flow is strictly prohibited**: Access tokens are never returned in URL hash fragments.
- **Client Secrets**: Public clients (Single Page Apps, iOS/Android mobile apps) **NEVER** receive a client secret. Only confidential server-side clients (such as WordPress PHP backend) hold client secrets.

### Immutable Subject Identifier (`sub`)
- Users are indexed by their permanent OIDC `sub` UUID (e.g. `usr_jav_9941a82f-871d-40ce-8c31-419b380d1933`).
- Applications **must never** use an email address as a permanent database primary key. Email addresses can change, expire, or be transferred; the `sub` identifier is immutable.
- Existing WordPress accounts must never be linked automatically solely because an email matches; verified session linking is enforced.

### Exact Registered Redirect URI Matching
- Authorization codes are issued only to exact byte-for-byte registered callback URIs. Wildcards or open redirects are barred by design.

---

## 2. Token Security & Storage

1. **JWT Cryptographic Verification**: Identity tokens (ID Tokens) and Access Tokens are digitally signed by Supabase Auth using RS256 or ES256 asymmetric keys verifiable via the public JWKS endpoint (`/.well-known/jwks.json`).
2. **Short-Lived Access Tokens**: Access tokens expire in 1 hour (3600 seconds).
3. **Refresh Token Rotation**: Refresh tokens are single-use. When exchanged, the previous refresh token is invalidated. If a used token is presented again, the entire token family is immediately revoked as a suspected token theft.
4. **No Password Storage**: Javenly application code never stores passwords. Passwords are handled exclusively by Supabase Auth using Argon2id or bcrypt hashing with high work factors.

---

## 3. Session Revocation & Multi-Factor Authentication

- **Global Session Revocation**: Users can click "Sign Out All Other Devices" in `account.javenly.com`, instantly invalidating all active refresh tokens.
- **TOTP 2FA**: Standard RFC 6238 Time-based One-Time Passwords compatible with Google Authenticator, 1Password, and Authy.
- **Audit Logging**: All authentication attempts (successful, failed, and suspended) are logged with edge IP addresses and timestamps.
