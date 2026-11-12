# Node.js Integration Guide — @javenly/identity-node

> **For Javenly CRM and Node.js Microservices**  
> Standards-based OIDC and JWT authorization for Express, Next.js, and Hono.

---

## 1. Installation

```bash
npm install @javenly/identity-node express dotenv
```

---

## 2. Quickstart Middleware

```typescript
import express from 'express';
import { javenlyAuth, requireRole } from '@javenly/identity-node';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Javenly Identity middleware
app.use(javenlyAuth({
  issuer: process.env.JAVENLY_ISSUER || 'https://identity.javenly.com',
  clientId: process.env.JAVENLY_CLIENT_ID!,
  clientSecret: process.env.JAVENLY_CLIENT_SECRET,
  redirectUri: 'https://crm.javenly.com/auth/callback',
}));

// Public endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authenticated endpoint (attaches req.javenlyUser with verified sub)
app.get('/api/crm/me', (req, res) => {
  res.json({ user: req.javenlyUser });
});

// Admin-only route
app.get('/api/crm/admin', requireRole(['admin', 'super_admin']), (req, res) => {
  res.json({ secretData: 'Confidential CRM metrics' });
});

app.listen(4000, () => {
  console.log('Javenly CRM running on port 4000');
});
```

---

## 3. Token Verification Logic

1. Extracts the Bearer token from the `Authorization: Bearer <jwt>` HTTP header.
2. Validates the JWT signature against Supabase Auth's public keys via `https://api-identity.javenly.com/.well-known/jwks.json`.
3. Verifies `iss` equals `https://identity.javenly.com`.
4. Verifies token is not expired (`exp`).
5. Populates `req.javenlyUser` with `sub`, `email`, `name`, and `role`.
