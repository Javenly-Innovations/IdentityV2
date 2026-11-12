=== Javenly Identity Connector ===
Contributors: Javenly Innovations
Tags: sso, single sign-on, oauth2, pkce, identity, authentication, supabase, exclusive login
Requires at least: 5.6
Tested up to: 6.7
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Single Sign-On (SSO) connector for Javenly Identity using OAuth 2.1 and OpenID Connect with PKCE (S256).

== Description ==

Javenly Identity Connector allows users and administrators to sign in to your WordPress website at javenly.com using their single Javenly Innovations account.

Features:
* Exclusive Login Enforcement: All visits to /wp-login.php, /wp-admin/, and WooCommerce login forms automatically route through Javenly Identity.
* Emergency Admin Bypass: Access standard WordPress credentials at any time via `wp-login.php?javenly_bypass=1`.
* Automatic Session & Cookie Issuance: Sets WordPress auth cookies and redirects administrators directly into /wp-admin/.
* Auto User Provisioning: Creates or links WordPress accounts for authorized Javenly users automatically.
* OAuth 2.1 PKCE (S256) cryptographic security.
* Shortcode [javenly_login] for custom landing pages.

== Installation ==

1. Upload the `javenly-identity-connector` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Go to Settings -> Javenly Identity to configure your Identity Portal URL and options.
