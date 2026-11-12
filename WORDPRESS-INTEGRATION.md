# WordPress Integration Guide — Javenly Identity Connector

> **Target Site**: `javenly.com`  
> **Current Hosting**: Namecheap WordPress  
> **Plugin**: Javenly Identity Connector (Version 1.0.0)

---

## 1. Safety & Preservation Policy

- **No Server Migration**: The existing WordPress website remains on Namecheap hosting.
- **Data Safety**: All existing posts, pages, media, plugins, roles, and user accounts are 100% preserved.
- **Non-Destructive User Linking**: Users are linked via the custom WordPress user meta key `_javenly_identity_sub`. Existing WordPress accounts are not blindly overwritten or linked without verified authentication.

---

## 2. Plugin Architecture

The plugin is structured into clean object-oriented classes:
```
wp-content/plugins/javenly-identity-connector/
├── javenly-identity-connector.php       # Main plugin bootstrapper & hook loader
├── includes/
│   ├── class-javenly-oauth.php          # PKCE generation & token exchange
│   └── class-javenly-user-manager.php   # User lookup by sub UUID & profile sync
└── admin/
    └── class-javenly-admin-settings.php # WordPress admin settings page
```

---

## 3. Step-by-Step Installation

### Step 1: Register WordPress in Javenly Admin Console
1. Open `https://admin-identity.javenly.com`.
2. Go to **Applications** → Click **Register New Application**.
3. Set:
   - **Application Name**: `Javenly WordPress Main Site`
   - **Client Type**: `Web Application (Confidential - Backend Server / WordPress)`
   - **Homepage URL**: `https://javenly.com`
   - **Redirect URI**: `https://javenly.com/wp-json/javenly/v1/callback`
4. Copy the generated **Client ID** and **Client Secret**.

### Step 2: Upload Plugin to WordPress
1. Log in to your WordPress admin dashboard at `https://javenly.com/wp-admin`.
2. Go to **Plugins** → **Add New** → **Upload Plugin**.
3. Select the `javenly-identity-connector.zip` file (or copy the files into `wp-content/plugins/javenly-identity-connector`).
4. Click **Install Now**, then click **Activate Plugin**.

### Step 3: Configure Settings
1. In the WordPress sidebar, go to **Settings** → **Javenly Identity**.
2. Enter:
   - **Identity Issuer URL**: `https://identity.javenly.com`
   - **OAuth 2.1 Client ID**: (Pasted from Step 1)
   - **Client Secret**: (Pasted from Step 1)
3. Click **Save Javenly Settings**.

---

## 4. How Authentication Operates

1. Visitors to `javenly.com/wp-login.php` see the branded **"Sign in with Javenly"** button.
2. Clicking the button initiates an OAuth 2.1 PKCE redirect with a unique `code_verifier` and SHA-256 `code_challenge`.
3. After the user logs in at `identity.javenly.com`, WordPress receives the authorization code at `/wp-json/javenly/v1/callback`.
4. The server exchanges the code for tokens over HTTPS.
5. WordPress retrieves the user's stable OIDC `sub` UUID, creates or retrieves the matching WordPress user, and issues a standard WordPress auth cookie.
