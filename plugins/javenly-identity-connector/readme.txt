=== Javenly Identity Connector ===
Contributors: Javenly Innovations
Tags: sso, single sign-on, oauth2, pkce, identity, authentication, supabase
Requires at least: 5.6
Tested up to: 6.7
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Single Sign-On (SSO) connector for Javenly Identity using OAuth 2.1 and OpenID Connect with PKCE (S256).

== Description ==

Javenly Identity Connector allows users to sign in to your WordPress website at javenly.com using their single Javenly Innovations account.

Features:
* Seamless "Sign in with Javenly" button on /wp-login.php and WooCommerce.
* OAuth 2.1 PKCE (S256) cryptographic security.
* Auto user provisioning & profile syncing.
* Shortcode [javenly_login] for custom landing pages.
* Preserves all existing WordPress users, passwords, and posts.

== Installation ==

1. Upload the `javenly-identity-connector` folder to the `/wp-content/plugins/` directory, or upload `javenly-identity-connector.zip` via WordPress Admin -> Plugins -> Add New -> Upload Plugin.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Go to Settings -> Javenly Identity and configure your Javenly Identity Portal URL and Client ID.
