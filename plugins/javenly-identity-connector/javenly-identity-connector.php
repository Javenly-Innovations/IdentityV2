<?php
/**
 * Plugin Name: Javenly Identity Connector
 * Plugin URI: https://javenly.com
 * Description: Enterprise Single Sign-On (SSO) connector for Javenly Identity powered by Supabase Auth and OAuth 2.1 PKCE (S256).
 * Version: 1.0.0
 * Author: Javenly Innovations
 * Author URI: https://javenly.com
 * License: GPL-2.0+
 * Text Domain: javenly-identity-connector
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('JAVENLY_IDENTITY_VERSION', '1.0.0');
define('JAVENLY_IDENTITY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('JAVENLY_IDENTITY_PLUGIN_URL', plugin_dir_url(__FILE__));

// Require plugin components
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-oauth.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'includes/class-javenly-user-manager.php';
require_once JAVENLY_IDENTITY_PLUGIN_DIR . 'admin/class-javenly-admin.php';

/**
 * Main Javenly Identity Connector Class
 */
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
        // Intercept OAuth callback via query parameters anywhere on site
        if ((isset($_GET['javenly_oauth_callback']) && $_GET['javenly_oauth_callback'] == '1') || 
            (isset($_GET['code']) && (isset($_GET['state']) || isset($_GET['auth_token'])))) {
            $this->oauth->handle_callback();
        }
    }

    /**
     * Enforce Javenly Identity as the exclusive login provider for wp-login.php & wp-admin
     */
    public function enforce_javenly_login() {
        // 1. Emergency Bypass parameter (?javenly_bypass=1) allows native WordPress login
        if (isset($_GET['javenly_bypass']) && $_GET['javenly_bypass'] === '1') {
            add_action('login_message', function() {
                return '<div id="login_error" style="border-left-color: #00A3E0; background: #f0f9ff; color: #0369a1; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"><strong>Emergency Bypass Active:</strong> Native WordPress username & password authentication is permitted.</div>';
            });
            return;
        }

        // 2. Allow core non-login actions (logout, password protected posts)
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
        if (in_array($action, array('logout', 'postpass'), true)) {
            return;
        }

        // 3. If already logged in, redirect to admin or home
        if (is_user_logged_in()) {
            if (current_user_can('manage_options')) {
                wp_redirect(admin_url());
            } else {
                wp_redirect(home_url('/'));
            }
            exit;
        }

        // 4. Save intended destination if provided
        if (!empty($_GET['redirect_to'])) {
            $dest = esc_url_raw($_GET['redirect_to']);
            setcookie('javenly_oauth_redirect_to', $dest, time() + 900, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        }

        // 5. Check if enforce is active (defaults to 1 = enabled)
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

    /**
     * Block standard username & password POST submission unless bypass is active
     */
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
                '<strong>Access Restricted:</strong> Standard WordPress password logins are disabled on this site. You must log in via <a href="' . esc_url($auth_url) . '" style="color: #00A3E0; font-weight: bold;">Javenly Identity SSO</a>. (For emergency access, append <code>?javenly_bypass=1</code> to the login URL).'
            );
        }

        return $user;
    }

    /**
     * Enforce Javenly SSO on WooCommerce My Account page if user is not logged in
     */
    public function enforce_woocommerce_login() {
        if (!function_exists('is_account_page') || !is_account_page()) {
            return;
        }

        if (is_user_logged_in()) {
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

    /**
     * Redirect to Javenly Identity portal upon logout
     */
    public function on_logout() {
        $options = get_option('javenly_identity_settings', array());
        $issuer_url = rtrim($options['issuer_url'] ?? 'https://identity.javenly.com', '/');
        wp_redirect($issuer_url);
        exit;
    }

    /**
     * Clean login styles if login form is rendered
     */
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

    /**
     * Render the "Sign in with Javenly" button on login forms
     */
    public function render_login_button() {
        $login_url = $this->oauth->get_authorization_url();
        if (empty($login_url)) {
            return;
        }

        ?>
        <div class="javenly-sso-wrapper" style="margin: 16px 0; padding: 12px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <p style="margin-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                — Secure Single Sign-On —
            </p>
            <a href="<?php echo esc_url($login_url); ?>" 
               class="button button-large javenly-sso-btn" 
               style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 42px; background: #00A3E0; border-color: #0092c9; color: #ffffff; font-weight: 700; font-size: 13px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(0, 163, 224, 0.25); transition: background 0.2s ease;">
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                    <path d="M 28 20 C 44 14, 68 18, 76 32 C 82 43, 78 58, 68 66 L 56 56 C 62 50, 64 42, 60 36 C 56 28, 42 26, 32 30 Z" fill="#ffffff" />
                    <path d="M 72 32 C 82 46, 80 68, 68 80 C 56 90, 36 88, 24 76 C 14 66, 16 48, 26 38 L 36 48 C 30 54, 30 62, 36 68 C 42 74, 54 74, 60 68 C 66 60, 68 48, 60 40 Z" fill="#ED3833" />
                </svg>
                <span>Sign in with Javenly Identity</span>
            </a>
        </div>
        <?php
    }

    /**
     * Shortcode: [javenly_login]
     */
    public function shortcode_login_button($atts) {
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            return '<div class="javenly-logged-in-box"><p>Signed in as <strong>' . esc_html($current_user->display_name) . '</strong> (<a href="' . esc_url(wp_logout_url(home_url())) . '">Log out</a>)</p></div>';
        }

        ob_start();
        $this->render_login_button();
        return ob_get_clean();
    }
}

// Instantiate
function javenly_identity_connector_init() {
    return Javenly_Identity_Connector::get_instance();
}
add_action('plugins_loaded', 'javenly_identity_connector_init');

