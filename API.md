# Javenly Identity API Documentation (v1)

Base URL: `https://api-identity.javenly.com`

---

## 1. OpenID Connect Discovery

### `GET /.well-known/openid-configuration`
Returns standard OpenID Provider Metadata (RFC 8414).

#### Response (200 OK):
```json
{
  "issuer": "https://identity.javenly.com",
  "authorization_endpoint": "https://identity.javenly.com/v1/auth/authorize",
  "token_endpoint": "https://api-identity.javenly.com/v1/auth/token",
  "userinfo_endpoint": "https://api-identity.javenly.com/api/v1/me",
  "jwks_uri": "https://api-identity.javenly.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["openid", "profile", "email", "offline_access"]
}
```

---

## 2. User & Profile Endpoints

### `GET /api/v1/me`
Returns OIDC standard claims for the calling subject. Requires `Authorization: Bearer <token>`.

#### Response (200 OK):
```json
{
  "sub": "usr_jav_9941a82f-871d-40ce-8c31-419b380d1933",
  "name": "Alex Rivers",
  "preferred_username": "alexrivers",
  "email": "alex.rivers@javenly.com",
  "email_verified": true,
  "picture": "https://images.unsplash.com/photo-1534528741775...",
  "role": "super_admin",
  "company": "Javenly Innovations"
}
```

---

## 3. Session Management Endpoints

### `GET /api/v1/security/sessions`
Returns active device sessions for the authenticated user.

### `POST /api/v1/security/sessions/revoke`
Revokes an active session ID and invalidates the associated refresh token.

#### Request Body:
```json
{
  "sessionId": "sess_live_iphone",
  "reason": "User manual revocation"
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Device session invalidated and refresh token revoked.",
  "revokedAt": "2026-11-11T05:30:00Z"
}
```
