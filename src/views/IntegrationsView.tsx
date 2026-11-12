import React, { useState } from 'react';
import { 
  Globe, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Terminal,
  CheckCircle2
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wordpress' | 'nodejs' | 'dns'>('wordpress');
  const [activeWpFile, setActiveWpFile] = useState<string>('main');
  const [copiedFile, setCopiedFile] = useState(false);

  // WordPress Plugin Files
  const wpPluginFiles: Record<string, { filename: string; path: string; description: string; code: string }> = {
    main: {
      filename: 'javenly-identity-connector.php',
      path: 'wp-content/plugins/javenly-identity-connector/javenly-identity-connector.php',
      description: 'Main plugin entrypoint registering activation hooks, OAuth handlers, and shortcodes.',
      code: `<?php
/**
 * Plugin Name: Javenly Identity Connector
 * Plugin URI: https://identity.javenly.com
 * Description: Official Single Sign-On (SSO) connector for Javenly Innovations. Connects WordPress (javenly.com) to Javenly Identity using OAuth 2.1 PKCE.
 * Version: 1.0.0
 * Author: Javenly Innovations
 * Author URI: https://javenly.com
 * License: GPL-2.0+
 * Text Domain: javenly-identity
 */

if (!defined('ABSPATH')) {
    exit;
}

define('JAVENLY_IDENTITY_VERSION', '1.0.0');
define('JAVENLY_IDENTITY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('JAVENLY_IDENTITY_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-oauth.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-user-manager.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'admin/class-javenly-admin-settings.php';

final class Javenly_Identity_Connector {
    private static $instance = null;
    public $oauth;
    public $user_manager;
    public $admin_settings;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->oauth = new Javenly_OAuth_Client();
        $this->user_manager = new Javenly_User_Manager();
        
        if (is_admin()) {
            $this->admin_settings = new Javenly_Admin_Settings();
        }

        add_action('login_form', [$this, 'render_login_button']);
        add_shortcode('javenly_login_button', [$this, 'render_login_button_shortcode']);
        add_action('rest_api_init', [$this, 'register_callback_endpoint']);
    }

    public function render_login_button() {
        $auth_url = $this->oauth->get_authorization_url();
        ?>
        <div style="margin: 15px 0 20px 0; text-align: center;">
            <a href="<?php echo esc_url($auth_url); ?>" 
               style="display: block; background: #0284c7; color: #ffffff; padding: 10px 14px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);">
                🛡️ Sign in with Javenly Identity
            </a>
            <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
                Single Sign-On powered by Javenly Innovations
            </div>
        </div>
        <?php
    }

    public function render_login_button_shortcode($atts) {
        ob_start();
        $this->render_login_button();
        return ob_get_clean();
    }

    public function register_callback_endpoint() {
        register_rest_route('javenly/v1', '/callback', [
            'methods'  => 'GET',
            'callback' => [$this->oauth, 'handle_oauth_callback'],
            'permission_callback' => '__return_true',
        ]);
    }
}

add_action('plugins_loaded', ['Javenly_Identity_Connector', 'get_instance']);
`,
    },
    oauth: {
      filename: 'class-javenly-oauth.php',
      path: 'wp-content/plugins/javenly-identity-connector/includes/class-javenly-oauth.php',
      description: 'Handles PKCE generation, cryptographic state validation, and server-side token exchange.',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_OAuth_Client {
    public function get_authorization_url() {
        $options = get_option('javenly_identity_settings');
        $issuer = rtrim($options['issuer'] ?? 'https://identity.javenly.com', '/');
        $client_id = $options['client_id'] ?? '';
        $redirect_uri = home_url('/wp-json/javenly/v1/callback');

        // Generate PKCE code verifier and challenge (RFC 7636)
        $code_verifier = bin2hex(random_bytes(32));
        $code_challenge = rtrim(strtr(base64_encode(hash('sha256', $code_verifier, true)), '+/', '-_'), '=');

        // Cryptographic state for CSRF defense
        $state = bin2hex(random_bytes(16));

        // Store state & verifier temporarily in transient
        set_transient('jav_oauth_verifier_' . $state, $code_verifier, 15 * MINUTE_IN_SECONDS);

        $params = [
            'response_type'         => 'code',
            'client_id'             => $client_id,
            'redirect_uri'          => $redirect_uri,
            'scope'                 => 'openid profile email',
            'state'                 => $state,
            'code_challenge'        => $code_challenge,
            'code_challenge_method' => 'S256',
        ];

        return $issuer . '/v1/auth/authorize?' . http_build_query($params);
    }

    public function handle_oauth_callback(WP_REST_Request $request) {
        $code = sanitize_text_field($request->get_param('code'));
        $state = sanitize_text_field($request->get_param('state'));
        $error = sanitize_text_field($request->get_param('error'));

        if (!empty($error)) {
            wp_die('Authentication Error: ' . esc_html($error));
        }

        if (empty($code) || empty($state)) {
            wp_die('Invalid response parameters from Identity Provider.');
        }

        $code_verifier = get_transient('jav_oauth_verifier_' . $state);
        delete_transient('jav_oauth_verifier_' . $state);

        if (!$code_verifier) {
            wp_die('Invalid or expired OAuth state token. Please retry login.');
        }

        // Server-side token exchange
        $tokens = $this->exchange_code_for_tokens($code, $code_verifier);
        if (is_wp_error($tokens)) {
            wp_die('Token Exchange Failed: ' . esc_html($tokens->get_error_message()));
        }

        // Validate user claims
        $user_manager = new Javenly_User_Manager();
        $user_id = $user_manager->authenticate_or_create_user($tokens['id_token'], $tokens['access_token']);

        if (is_wp_error($user_id)) {
            wp_die('User Federation Failed: ' . esc_html($user_id->get_error_message()));
        }

        // Establish secure WordPress session
        wp_clear_auth_cookie();
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id, true);

        // Redirect to dashboard or designated redirect target
        $redirect_to = admin_url();
        wp_safe_redirect($redirect_to);
        exit;
    }

    private function exchange_code_for_tokens($code, $code_verifier) {
        $options = get_option('javenly_identity_settings');
        $issuer = rtrim($options['issuer'] ?? 'https://identity.javenly.com', '/');
        $token_endpoint = $options['token_endpoint'] ?? ($issuer . '/v1/auth/token');
        $client_id = $options['client_id'] ?? '';
        $client_secret = $options['client_secret'] ?? '';

        $body = [
            'grant_type'    => 'authorization_code',
            'client_id'     => $client_id,
            'client_secret' => $client_secret,
            'code'          => $code,
            'code_verifier' => $code_verifier,
            'redirect_uri'  => home_url('/wp-json/javenly/v1/callback'),
        ];

        $response = wp_remote_post($token_endpoint, [
            'body'    => $body,
            'headers' => ['Accept' => 'application/json'],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        $payload = json_decode(wp_remote_retrieve_body($response), true);

        if ($status !== 200 || empty($payload['access_token'])) {
            return new WP_Error('token_exchange_error', $payload['error_description'] ?? 'Failed to exchange token');
        }

        return $payload;
    }
}
`,
    },
    user: {
      filename: 'class-javenly-user-manager.php',
      path: 'wp-content/plugins/javenly-identity-connector/includes/class-javenly-user-manager.php',
      description: 'Manages user lookup via stable _javenly_identity_sub, prevents unverified account takeovers, and syncs profiles.',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_User_Manager {
    const META_KEY_SUB = '_javenly_identity_sub';

    public function authenticate_or_create_user($id_token, $access_token) {
        $claims = $this->decode_jwt_claims($id_token);
        if (!$claims || empty($claims['sub'])) {
            return new WP_Error('invalid_claims', 'Identity token missing subject identifier (sub).');
        }

        $sub = sanitize_text_field($claims['sub']);
        $email = sanitize_email($claims['email'] ?? '');
        $name = sanitize_text_field($claims['name'] ?? '');

        // 1. Search for existing WordPress user by permanent sub
        $users = get_users([
            'meta_key'   => self::META_KEY_SUB,
            'meta_value' => $sub,
            'number'     => 1,
            'fields'     => 'ID',
        ]);

        if (!empty($users)) {
            $user_id = $users[0];
            $this->sync_user_profile($user_id, $claims);
            return $user_id;
        }

        // 2. Security requirement: Do NOT automatically link by email alone without verified authentication
        $existing_user_by_email = get_user_by('email', $email);
        if ($existing_user_by_email) {
            // Check if current user is logged in to link account
            if (is_user_logged_in() && get_current_user_id() === $existing_user_by_email->ID) {
                update_user_meta($existing_user_by_email->ID, self::META_KEY_SUB, $sub);
                return $existing_user_by_email->ID;
            }
            return new WP_Error(
                'account_conflict',
                'An existing WordPress account uses this email. Please log in first and link your Javenly account in Profile settings.'
            );
        }

        // 3. Create fresh WordPress user
        $username = sanitize_user($claims['preferred_username'] ?? explode('@', $email)[0], true);
        if (username_exists($username)) {
            $username .= '_' . wp_rand(100, 999);
        }

        $random_password = wp_generate_password(24, true, true);
        $user_id = wp_create_user($username, $random_password, $email);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Store stable OIDC subject identifier in user metadata
        update_user_meta($user_id, self::META_KEY_SUB, $sub);
        $this->sync_user_profile($user_id, $claims);

        return $user_id;
    }

    private function sync_user_profile($user_id, $claims) {
        if (!empty($claims['name'])) {
            wp_update_user([
                'ID'           => $user_id,
                'display_name' => sanitize_text_field($claims['name']),
            ]);
        }
    }

    private function decode_jwt_claims($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) < 2) return null;
        $payload = base64_decode(strtr($parts[1], '-_', '+/'));
        return json_decode($payload, true);
    }
}
`,
    },
    admin: {
      filename: 'class-javenly-admin-settings.php',
      path: 'wp-content/plugins/javenly-identity-connector/admin/class-javenly-admin-settings.php',
      description: 'WordPress admin dashboard settings page to configure Client ID, secret, and issuer endpoints.',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_Admin_Settings {
    public function __construct() {
        add_action('admin_menu', [$this, 'add_settings_menu']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function add_settings_menu() {
        add_options_page(
            'Javenly Identity Settings',
            'Javenly Identity',
            'manage_options',
            'javenly-identity',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('javenly_identity_group', 'javenly_identity_settings');
    }

    public function render_settings_page() {
        $options = get_option('javenly_identity_settings', [
            'issuer'        => 'https://identity.javenly.com',
            'client_id'     => 'client_jav_wordpress_javenly_com',
            'client_secret' => '',
        ]);
        ?>
        <div class="wrap">
            <h1>Javenly Identity Connector Configuration</h1>
            <p>Federated single sign-on settings for javenly.com powered by Supabase Auth.</p>
            <form method="post" action="options.php">
                <?php settings_fields('javenly_identity_group'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Identity Issuer URL</th>
                        <td>
                            <input type="url" name="javenly_identity_settings[issuer]" 
                                   value="<?php echo esc_attr($options['issuer']); ?>" class="regular-text" />
                            <p class="description">Standard: https://identity.javenly.com</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">OAuth 2.1 Client ID</th>
                        <td>
                            <input type="text" name="javenly_identity_settings[client_id]" 
                                   value="<?php echo esc_attr($options['client_id']); ?>" class="regular-text code" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Client Secret (Confidential)</th>
                        <td>
                            <input type="password" name="javenly_identity_settings[client_secret]" 
                                   value="<?php echo esc_attr($options['client_secret']); ?>" class="regular-text code" />
                            <p class="description">Stored securely on your server. Never exposed to browser JavaScript.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Registered Redirect Callback</th>
                        <td>
                            <code><?php echo esc_html(home_url('/wp-json/javenly/v1/callback')); ?></code>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Javenly Settings'); ?>
            </form>
        </div>
        <?php
    }
}
`,
    },
  };

  const currentWpFileObj = wpPluginFiles[activeWpFile] || wpPluginFiles.main;

  const downloadWpZipSimulation = () => {
    const readme = `Javenly Identity Connector - WordPress Plugin
===============================================
Version: 1.0.0
Author: Javenly Innovations
Compatibility: WordPress 5.8+ to 6.x

Installation:
1. Upload the entire 'javenly-identity-connector' folder to your '/wp-content/plugins/' directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to Settings -> Javenly Identity and verify your Client ID.
`;
    const blob = new Blob([currentWpFileObj.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentWpFileObj.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-800/40">
            Developer SDKs & Plugins
          </span>
          <span className="text-xs text-slate-400 font-mono">docs.javenly.com</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Integration Packages & Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Production-ready WordPress plugin for <strong>javenly.com</strong> and TypeScript SDK for Node.js microservices.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('wordpress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wordpress'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>WordPress Plugin (javenly.com)</span>
        </button>

        <button
          onClick={() => setActiveTab('nodejs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'nodejs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Node.js Package (@javenly/identity-node)</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dns'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Namecheap DNS Blueprint ($0 Safe)</span>
        </button>
      </div>

      {/* TAB 1: WORDPRESS PLUGIN */}
      {activeTab === 'wordpress' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-400" />
                  Javenly Identity Connector WordPress Plugin
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Complete, modular object-oriented PHP plugin installable on your Namecheap WordPress host.
                </p>
              </div>

              <button
                onClick={downloadWpZipSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all self-start sm:self-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Plugin File ({currentWpFileObj.filename})</span>
              </button>
            </div>

            {/* Plugin File Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 mb-4 border-b border-slate-800">
              {Object.entries(wpPluginFiles).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveWpFile(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    activeWpFile === key 
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.filename}
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-slate-300 font-bold">{currentWpFileObj.path}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{currentWpFileObj.description}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentWpFileObj.code);
                  setCopiedFile(true);
                  setTimeout(() => setCopiedFile(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-[500px]">
              {currentWpFileObj.code}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: NODE.JS PACKAGE */}
      {activeTab === 'nodejs' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Reusable Node.js Package: @javenly/identity-node
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-2xl">
              Provides drop-in authentication middleware for Express, Next.js, and Hono. Handles token extraction, cryptographically verifies signatures using Supabase JWKS, and guarantees PKCE security.
            </p>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-300">1. Install dependencies:</span>
                <div className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>npm install @javenly/identity-node express dotenv</code>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300">2. Example server (`server.ts`):</span>
                <pre className="mt-1 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
{`import express from 'express';
import { javenlyAuth, requireRole } from '@javenly/identity-node';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Javenly Identity Client
app.use(javenlyAuth({
  issuer: process.env.JAVENLY_ISSUER || 'https://identity.javenly.com',
  clientId: process.env.JAVENLY_CLIENT_ID,
  clientSecret: process.env.JAVENLY_CLIENT_SECRET, // If confidential client
  redirectUri: 'https://crm.javenly.com/auth/callback',
}));

// Public route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authenticated route - accessible to any logged in Javenly user
app.get('/api/me', (req, res) => {
  res.json({ user: req.javenlyUser });
});

// Role-protected route - requires 'admin' or 'super_admin'
app.get('/api/admin/crm/reports', requireRole(['admin', 'super_admin']), (req, res) => {
  res.json({ message: 'Confidential CRM financial metrics accessed.' });
});

app.listen(4000, () => {
  console.log('Javenly CRM listening on port 4000');
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DNS BLUEPRINT */}
      {activeTab === 'dns' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Namecheap DNS Blueprint — $0 Cost & Zero Disruption Guarantee
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-2xl">
              Your WordPress website on <code className="text-emerald-300 font-bold">javenly.com</code> is currently hosted with Namecheap. We do <strong>NOT</strong> move, replace, or disrupt this site. You simply add 4 isolated CNAME records in Namecheap's DNS zone:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Host Name</th>
                    <th className="p-3">Target Value</th>
                    <th className="p-3">TTL</th>
                    <th className="p-3">Target Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold text-sky-400">CNAME</td>
                    <td className="p-3 font-bold text-white">identity</td>
                    <td className="p-3 text-slate-300">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Cloudflare Pages (Free)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-sky-400">CNAME</td>
                    <td className="p-3 font-bold text-white">account</td>
                    <td className="p-3 text-slate-300">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Cloudflare Pages (Free)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-sky-400">CNAME</td>
                    <td className="p-3 font-bold text-white">admin-identity</td>
                    <td className="p-3 text-slate-300">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Cloudflare Pages (Free)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-sky-400">CNAME</td>
                    <td className="p-3 font-bold text-white">api-identity</td>
                    <td className="p-3 text-slate-300">javenly-identity.workers.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Cloudflare Workers (Free)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Safety Guarantee Checklist:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-emerald-400/90 text-[11px]">
                <li>Existing WordPress A records and MX email records on Namecheap are 100% untouched.</li>
                <li>Cloudflare Pages automatically provisions free TLS certificates for each subdomain.</li>
                <li>Operating cost remains exactly <strong>$0.00/month</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
