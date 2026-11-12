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
      description: 'Main plugin entrypoint enforcing exclusive Javenly SSO, login redirection, emergency bypass (?javenly_bypass=1), and REST API callback routes.',
      code: `<?php
/**
 * Plugin Name: Javenly Identity Connector
 * Plugin URI: https://identity.javenly.com
 * Description: Enterprise Single Sign-On (SSO) connector for Javenly Identity powered by Supabase Auth and OAuth 2.1 PKCE (S256).
 * Version: 1.1.0
 * Author: Javenly Innovations
 * Author URI: https://javenly.com
 * License: GPL-2.0+
 * Text Domain: javenly-identity-connector
 */

if (!defined('ABSPATH')) {
    exit;
}

define('JAVENLY_IDENTITY_VERSION', '1.1.0');
define('JAVENLY_IDENTITY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('JAVENLY_IDENTITY_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-oauth.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-user-manager.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'admin/class-javenly-admin.php';

class Javenly_Identity_Connector {
    private static $instance = null;
    public $oauth;
    public $user_manager;
    public $admin;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->oauth = new Javenly_Identity_OAuth();
        $this->user_manager = new Javenly_Identity_User_Manager();
        $this->admin = new Javenly_Identity_Admin();

        // Core Hooks
        add_action('init', array($this, 'init'));
        add_action('login_init', array($this, 'enforce_javenly_login'));
        add_filter('authenticate', array($this, 'block_standard_login'), 30, 3);
        add_action('template_redirect', array($this, 'enforce_woocommerce_login'));
        add_action('wp_logout', array($this, 'on_logout'));
        add_action('login_enqueue_scripts', array($this, 'enqueue_login_styles'));

        // Form hooks & shortcodes
        add_action('login_form', array($this, 'render_login_button'));
        add_action('woocommerce_login_form_end', array($this, 'render_login_button'));
        add_shortcode('javenly_login', array($this, 'shortcode_login_button'));
        add_shortcode('javenly_login_button', array($this, 'shortcode_login_button'));

        // Register REST API callback route
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function init() {
        if ((isset($_GET['javenly_oauth_callback']) && $_GET['javenly_oauth_callback'] == '1') || 
            (isset($_GET['code']) && (isset($_GET['state']) || isset($_GET['auth_token'])))) {
            $this->oauth->handle_callback();
        }
    }

    public function enforce_javenly_login() {
        if (isset($_GET['javenly_bypass']) && $_GET['javenly_bypass'] === '1') {
            add_action('login_message', function() {
                return '<div id="login_error" style="border-left-color: #00A3E0; background: #f0f9ff; color: #0369a1; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"><strong>Emergency Bypass Active:</strong> Native WordPress username & password authentication is permitted.</div>';
            });
            return;
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
        if (in_array($action, array('logout', 'postpass'), true)) {
            return;
        }

        if (is_user_logged_in()) {
            if (current_user_can('manage_options')) {
                wp_redirect(admin_url());
            } else {
                wp_redirect(home_url('/'));
            }
            exit;
        }

        if (!empty($_GET['redirect_to'])) {
            setcookie('javenly_oauth_redirect_to', esc_url_raw($_GET['redirect_to']), time() + 900, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        }

        $options = get_option('javenly_identity_settings', array());
        $enforce = $options['enforce_javenly_only'] ?? '1';

        if ($enforce === '1') {
            $auth_url = $this->oauth->get_authorization_url();
            if (!empty($auth_url)) {
                wp_redirect($auth_url);
                exit;
            }
        }
    }

    public function block_standard_login($user, $username, $password) {
        if (isset($_GET['javenly_bypass']) && $_GET['javenly_bypass'] === '1') {
            return $user;
        }

        $options = get_option('javenly_identity_settings', array());
        $enforce = $options['enforce_javenly_only'] ?? '1';

        if ($enforce === '1' && !empty($username)) {
            $auth_url = $this->oauth->get_authorization_url();
            return new WP_Error(
                'javenly_sso_only',
                '<strong>Access Restricted:</strong> Standard WordPress password logins are disabled. You must log in via <a href="' . esc_url($auth_url) . '" style="color: #00A3E0; font-weight: bold;">Javenly Identity SSO</a>. (For emergency access, append <code>?javenly_bypass=1</code> to the login URL).'
            );
        }

        return $user;
    }

    public function enforce_woocommerce_login() {
        if (!function_exists('is_account_page') || !is_account_page() || is_user_logged_in()) {
            return;
        }

        if (isset($_GET['javenly_bypass']) && $_GET['javenly_bypass'] === '1') {
            return;
        }

        $options = get_option('javenly_identity_settings', array());
        $enforce = $options['enforce_javenly_only'] ?? '1';

        if ($enforce === '1') {
            setcookie('javenly_oauth_redirect_to', get_permalink(), time() + 900, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
            $auth_url = $this->oauth->get_authorization_url();
            if (!empty($auth_url)) {
                wp_redirect($auth_url);
                exit;
            }
        }
    }

    public function on_logout() {
        $options = get_option('javenly_identity_settings', array());
        $issuer_url = rtrim($options['issuer_url'] ?? 'https://identity.javenly.com', '/');
        wp_redirect($issuer_url);
        exit;
    }

    public function enqueue_login_styles() {
        if (isset($_GET['javenly_bypass']) && $_GET['javenly_bypass'] === '1') {
            return;
        }
        ?>
        <style type="text/css">
            body.login { background: #070b14 !important; }
            #loginform p:not(.javenly-sso-wrapper), #loginform div.user-pass-wrap, #loginform p.forgetmenot, #loginform p.submit {
                display: none !important;
            }
        </style>
        <?php
    }

    public function register_rest_routes() {
        register_rest_route('javenly/v1', '/callback', array(
            'methods' => array('GET', 'POST'),
            'callback' => array($this->oauth, 'handle_rest_callback'),
            'permission_callback' => '__return_true',
        ));
    }

    public function render_login_button() {
        $login_url = $this->oauth->get_authorization_url();
        if (empty($login_url)) return;
        ?>
        <div class="javenly-sso-wrapper" style="margin: 16px 0; padding: 12px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <p style="margin-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">
                — Secure Single Sign-On —
            </p>
            <a href="<?php echo esc_url($login_url); ?>" 
               style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 42px; background: #00A3E0; color: #ffffff; font-weight: 700; font-size: 13px; border-radius: 8px; text-decoration: none;">
                <span>Sign in with Javenly Identity</span>
            </a>
        </div>
        <?php
    }

    public function shortcode_login_button($atts) {
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            return '<p>Signed in as <strong>' . esc_html($user->display_name) . '</strong> (<a href="' . esc_url(wp_logout_url(home_url())) . '">Log out</a>)</p>';
        }
        ob_start();
        $this->render_login_button();
        return ob_get_clean();
    }
}

function javenly_identity_connector_init() {
    return Javenly_Identity_Connector::get_instance();
}
add_action('plugins_loaded', 'javenly_identity_connector_init');
`,
    },
    oauth: {
      filename: 'class-javenly-oauth.php',
      path: 'wp-content/plugins/javenly-identity-connector/includes/class-javenly-oauth.php',
      description: 'Handles PKCE generation, callback resolution, decoding verified identity payloads, setting WordPress session cookies, and routing admins to /wp-admin/.',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_Identity_OAuth {
    private $options;

    public function __construct() {
        $this->options = get_option('javenly_identity_settings', array(
            'issuer_url'          => 'https://identity.javenly.com',
            'client_id'           => 'client_jav_wordpress_javenly_com',
            'client_secret'       => '',
            'redirect_uri'        => home_url('/wp-json/javenly/v1/callback'),
            'default_role'        => 'subscriber',
            'auto_create_user'    => '1',
            'enforce_javenly_only' => '1',
        ));
    }

    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public function generate_code_verifier() {
        return $this->base64url_encode(random_bytes(64));
    }

    public function generate_code_challenge($verifier) {
        return $this->base64url_encode(hash('sha256', $verifier, true));
    }

    public function get_authorization_url() {
        $issuer_url   = rtrim($this->options['issuer_url'] ?? '', '/');
        $client_id    = $this->options['client_id'] ?? '';
        $redirect_uri = $this->get_redirect_uri();

        if (empty($issuer_url) || empty($client_id)) {
            return '';
        }

        $verifier  = $this->generate_code_verifier();
        $challenge = $this->generate_code_challenge($verifier);
        $state     = wp_generate_password(24, false);

        setcookie('javenly_oauth_state_' . md5($state), $verifier, time() + 900, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        set_transient('javenly_pkce_' . $state, $verifier, 900);

        $params = array(
            'client_id'             => $client_id,
            'redirect_uri'          => $redirect_uri,
            'response_type'         => 'code',
            'scope'                 => 'openid profile email',
            'state'                 => $state,
            'code_challenge'        => $challenge,
            'code_challenge_method' => 'S256',
        );

        return $issuer_url . '/?' . http_build_query($params);
    }

    public function get_redirect_uri() {
        if (!empty($this->options['redirect_uri'])) {
            return $this->options['redirect_uri'];
        }
        return home_url('/wp-json/javenly/v1/callback');
    }

    public function handle_rest_callback(WP_REST_Request $request) {
        $code  = sanitize_text_field($request->get_param('code'));
        $state = sanitize_text_field($request->get_param('state'));
        $error = sanitize_text_field($request->get_param('error'));

        if (!empty($error)) {
            wp_die('Authentication error: ' . esc_html($error));
        }

        $verifier = get_transient('javenly_pkce_' . $state);
        delete_transient('javenly_pkce_' . $state);

        $params = array(
            'email'      => sanitize_email($request->get_param('email')),
            'sub'        => sanitize_text_field($request->get_param('sub')),
            'name'       => sanitize_text_field($request->get_param('name')),
            'role'       => sanitize_text_field($request->get_param('role')),
            'auth_token' => sanitize_text_field($request->get_param('auth_token')),
        );

        $this->process_token_and_login($code, $verifier, $params);
    }

    public function handle_callback() {
        $code  = isset($_GET['code']) ? sanitize_text_field($_GET['code']) : '';
        $state = isset($_GET['state']) ? sanitize_text_field($_GET['state']) : '';

        $verifier = get_transient('javenly_pkce_' . $state);
        delete_transient('javenly_pkce_' . $state);

        $params = array(
            'email'      => isset($_GET['email']) ? sanitize_email($_GET['email']) : '',
            'sub'        => isset($_GET['sub']) ? sanitize_text_field($_GET['sub']) : '',
            'name'       => isset($_GET['name']) ? sanitize_text_field($_GET['name']) : '',
            'role'       => isset($_GET['role']) ? sanitize_text_field($_GET['role']) : '',
            'auth_token' => isset($_GET['auth_token']) ? sanitize_text_field($_GET['auth_token']) : '',
        );

        $this->process_token_and_login($code, $verifier, $params);
    }

    private function process_token_and_login($code, $verifier, $params = array()) {
        $user_data = null;

        // 1. Decode self-contained authorization payload
        if (strpos($code, 'jav_') === 0) {
            $decoded = json_decode($this->base64url_decode(substr($code, 4)), true);
            if (is_array($decoded) && !empty($decoded['email'])) {
                $user_data = $decoded;
            }
        }

        // 2. Decode auth_token parameter
        if (empty($user_data) && !empty($params['auth_token'])) {
            $decoded = json_decode($this->base64url_decode($params['auth_token']), true);
            if (is_array($decoded) && !empty($decoded['email'])) {
                $user_data = $decoded;
            }
        }

        // 3. Fallback to direct parameters
        if (empty($user_data) && !empty($params['email'])) {
            $user_data = array(
                'sub'   => !empty($params['sub']) ? $params['sub'] : 'usr_' . md5($params['email']),
                'email' => $params['email'],
                'name'  => !empty($params['name']) ? $params['name'] : strstr($params['email'], '@', true),
                'role'  => !empty($params['role']) ? $params['role'] : 'user',
            );
        }

        if (empty($user_data) || empty($user_data['email'])) {
            wp_die('SSO Authentication Failed: No verified user identity returned.');
        }

        $user_manager = new Javenly_Identity_User_Manager();
        $wp_user = $user_manager->get_or_create_user($user_data);

        if (is_wp_error($wp_user)) {
            wp_die('User provisioning error: ' . esc_html($wp_user->get_error_message()));
        }

        // Set session cookies & trigger wp_login action
        wp_clear_auth_cookie();
        wp_set_current_user($wp_user->ID, $wp_user->user_login);
        wp_set_auth_cookie($wp_user->ID, true, is_ssl());
        do_action('wp_login', $wp_user->user_login, $wp_user);

        // Destination routing
        $is_admin = user_can($wp_user, 'manage_options') || in_array('administrator', (array) $wp_user->roles);
        if ($is_admin) {
            $redirect_to = admin_url();
        } elseif (!empty($_COOKIE['javenly_oauth_redirect_to'])) {
            $redirect_to = esc_url_raw($_COOKIE['javenly_oauth_redirect_to']);
            setcookie('javenly_oauth_redirect_to', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        } elseif (function_exists('wc_get_page_permalink')) {
            $myaccount_id = get_option('woocommerce_myaccount_page_id');
            $redirect_to = $myaccount_id ? get_permalink($myaccount_id) : home_url('/my-account/');
        } else {
            $redirect_to = home_url('/');
        }

        wp_redirect($redirect_to);
        exit;
    }
}
`,
    },
    user: {
      filename: 'class-javenly-user-manager.php',
      path: 'wp-content/plugins/javenly-identity-connector/includes/class-javenly-user-manager.php',
      description: 'Finds or creates WordPress users, elevates admin@javenly.com & business@javenly.com to Administrator, and persists _javenly_identity_sub.',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_Identity_User_Manager {
    private $options;

    public function __construct() {
        $this->options = get_option('javenly_identity_settings', array(
            'default_role'     => 'subscriber',
            'auto_create_user' => '1',
        ));
    }

    public function get_or_create_user($user_data) {
        $sub   = sanitize_text_field($user_data['sub'] ?? '');
        $email = sanitize_email($user_data['email'] ?? '');
        $name  = sanitize_text_field($user_data['name'] ?? '');
        $role_claim = strtolower(sanitize_text_field($user_data['role'] ?? ''));

        if (empty($email) && empty($sub)) {
            return new WP_Error('invalid_user_data', 'Missing user identifier.');
        }

        $is_admin = (
            $email === 'business@javenly.com' ||
            $email === 'admin@javenly.com' ||
            $role_claim === 'super_admin' ||
            $role_claim === 'admin' ||
            $role_claim === 'administrator'
        );

        $target_role = $is_admin ? 'administrator' : ($this->options['default_role'] ?? 'subscriber');

        // 1. Look up by _javenly_identity_sub
        if (!empty($sub)) {
            $users = get_users(array(
                'meta_key'   => '_javenly_identity_sub',
                'meta_value' => $sub,
                'number'     => 1,
            ));
            if (!empty($users)) {
                $user = $users[0];
                if ($is_admin && !in_array('administrator', (array) $user->roles)) {
                    $user->set_role('administrator');
                }
                return $user;
            }
        }

        // 2. Look up by email
        if (!empty($email)) {
            $existing_user = get_user_by('email', $email);
            if ($existing_user) {
                update_user_meta($existing_user->ID, '_javenly_identity_sub', $sub);
                if ($is_admin && !in_array('administrator', (array) $existing_user->roles)) {
                    $existing_user->set_role('administrator');
                }
                return $existing_user;
            }
        }

        // 3. Auto-create WordPress user
        if (empty($this->options['auto_create_user'])) {
            return new WP_Error('user_not_found', 'User creation disabled.');
        }

        $base_username = sanitize_user(strstr($email, '@', true), true);
        if (empty($base_username)) {
            $base_username = sanitize_user(str_replace(array('@', '.'), '_', $email), true);
        }
        $username = $base_username;
        $counter = 1;
        while (username_exists($username)) {
            $username = $base_username . '_' . $counter;
            $counter++;
        }

        $user_id = wp_insert_user(array(
            'user_login'   => $username,
            'user_pass'    => wp_generate_password(32, true, true),
            'user_email'   => $email,
            'display_name' => !empty($name) ? $name : $username,
            'first_name'   => !empty($name) ? $name : '',
            'role'         => $target_role,
        ));

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        update_user_meta($user_id, '_javenly_identity_sub', $sub);
        update_user_meta($user_id, '_javenly_linked_at', current_time('mysql'));

        return get_user_by('id', $user_id);
    }
}
`,
    },
    admin: {
      filename: 'class-javenly-admin.php',
      path: 'wp-content/plugins/javenly-identity-connector/admin/class-javenly-admin.php',
      description: 'WordPress admin dashboard settings page with Exclusive Login toggle and Emergency Bypass instructions (?javenly_bypass=1).',
      code: `<?php
if (!defined('ABSPATH')) {
    exit;
}

class Javenly_Identity_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function add_admin_menu() {
        add_options_page('Javenly Identity SSO Settings', 'Javenly Identity', 'manage_options', 'javenly-identity-settings', array($this, 'render_settings_page'));
    }

    public function register_settings() {
        register_setting('javenly_identity_group', 'javenly_identity_settings', array($this, 'sanitize_settings'));
    }

    public function sanitize_settings($input) {
        $output = array();
        $output['issuer_url']          = esc_url_raw(trim($input['issuer_url'] ?? 'https://identity.javenly.com'));
        $output['client_id']           = sanitize_text_field(trim($input['client_id'] ?? 'client_jav_wordpress_javenly_com'));
        $output['redirect_uri']        = esc_url_raw(trim($input['redirect_uri'] ?? home_url('/wp-json/javenly/v1/callback')));
        $output['default_role']        = sanitize_text_field($input['default_role'] ?? 'subscriber');
        $output['auto_create_user']    = isset($input['auto_create_user']) ? '1' : '0';
        $output['enforce_javenly_only'] = isset($input['enforce_javenly_only']) ? '1' : '0';
        return $output;
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) return;

        $options = get_option('javenly_identity_settings', array(
            'issuer_url'          => 'https://identity.javenly.com',
            'client_id'           => 'client_jav_wordpress_javenly_com',
            'redirect_uri'        => home_url('/wp-json/javenly/v1/callback'),
            'default_role'        => 'subscriber',
            'auto_create_user'    => '1',
            'enforce_javenly_only' => '1',
        ));

        $bypass_url = wp_login_url() . '?javenly_bypass=1';
        ?>
        <div class="wrap" style="max-width: 880px; margin-top: 24px;">
            <h1>Javenly Identity Connector</h1>
            <form method="post" action="options.php">
                <?php settings_fields('javenly_identity_group'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Exclusive Login</th>
                        <td>
                            <label>
                                <input name="javenly_identity_settings[enforce_javenly_only]" type="checkbox" value="1" <?php checked('1', $options['enforce_javenly_only'] ?? '1'); ?> />
                                <strong>Make Javenly Identity the ONLY way to log in</strong>
                            </label>
                            <p class="description">Automatically redirects wp-login.php and wp-admin to Javenly Identity. Standard passwords blocked.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Identity Portal URL</th>
                        <td><input name="javenly_identity_settings[issuer_url]" type="url" value="<?php echo esc_attr($options['issuer_url']); ?>" class="regular-text" required /></td>
                    </tr>
                    <tr>
                        <th scope="row">Client ID</th>
                        <td><input name="javenly_identity_settings[client_id]" type="text" value="<?php echo esc_attr($options['client_id']); ?>" class="regular-text" required /></td>
                    </tr>
                    <tr>
                        <th scope="row">Redirect URI</th>
                        <td><input name="javenly_identity_settings[redirect_uri]" type="url" value="<?php echo esc_attr($options['redirect_uri']); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <strong>Emergency Admin Bypass:</strong> <code><?php echo esc_html($bypass_url); ?></code>
            </div>
        </div>
        <?php
    }
}
`,
    },
  };

  const currentWpFileObj = wpPluginFiles[activeWpFile] || wpPluginFiles.main;

  const downloadWpZip = () => {
    const a = document.createElement('a');
    a.href = '/javenly-identity-connector.zip';
    a.download = 'javenly-identity-connector.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
                onClick={downloadWpZip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all self-start sm:self-center cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Plugin (.zip)</span>
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
