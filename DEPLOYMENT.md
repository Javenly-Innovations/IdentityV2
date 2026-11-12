# Deployment Guide — Javenly Identity

> **Operating Cost: $0.00 / month**  
> **Host: Cloudflare Pages + Supabase Free Tier**  
> **DNS Provider: Namecheap (Existing WordPress hosting remains 100% untouched)**

---

## 1. Cloudflare Pages Deployment (Free Plan)

Cloudflare Pages provides unlimited free bandwidth, global Anycast CDN, and automated TLS 1.3 certificates.

### Step 1: Connect GitHub Repository
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select **Compute (Workers & Pages)** → **Create application** → **Pages** → **Connect to Git**.
3. Select the `javenly-identity` GitHub repository.

### Step 2: Build Configuration
- **Framework preset**: `Vite` (or `None`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**:
  - `VITE_SUPABASE_URL`: Your Supabase Project URL
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key

Click **Save and Deploy**. Cloudflare will build the platform and issue a free `*.pages.dev` domain (e.g. `javenly-identity.pages.dev`).

---

## 2. Namecheap DNS Configuration (CRITICAL: ZERO-DISRUPTION)

Your existing WordPress website is hosted with Namecheap at `javenly.com`.  
**DO NOT** change your Nameservers away from Namecheap.  
**DO NOT** modify the root `@` A record or your email MX records.

### Exact DNS Records to Add in Namecheap:

1. Log into your [Namecheap Account](https://www.namecheap.com).
2. Go to **Domain List** → Click **Manage** next to `javenly.com`.
3. Click the **Advanced DNS** tab.
4. Under **Host Records**, click **Add New Record** for each of the following 4 records:

| Type | Host | Value | TTL | Note |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME Record** | `identity` | `javenly-identity.pages.dev` | Automatic | Central Auth Gateway |
| **CNAME Record** | `account` | `javenly-identity.pages.dev` | Automatic | User Account Portal |
| **CNAME Record** | `admin-identity` | `javenly-identity.pages.dev` | Automatic | Admin Security Console |
| **CNAME Record** | `api-identity` | `javenly-identity.pages.dev` | Automatic | Identity API |

5. Click **Save All Changes**.

---

## 3. Custom Domain Verification in Cloudflare Pages

1. In Cloudflare Pages, click on your `javenly-identity` project.
2. Go to **Custom domains** tab.
3. Click **Set up a custom domain**.
4. Add:
   - `identity.javenly.com`
   - `account.javenly.com`
   - `admin-identity.javenly.com`
   - `api-identity.javenly.com`
5. Cloudflare will automatically detect the CNAME records in Namecheap and issue free Universal SSL/TLS certificates for each subdomain within 5–15 minutes.
