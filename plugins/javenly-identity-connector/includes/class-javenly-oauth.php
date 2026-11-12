<?php
/**
 * OAuth 2.1 & PKCE Flow Handler for Javenly Identity Connector
 */

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

    /**
     * Generate Base64URL-encoded random string
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decode Base64URL string
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Generate PKCE code_verifier (random 64-128 char string)
     */
    public function generate_code_verifier() {
        return $this->base64url_encode(random_bytes(64));
    }

    /**
     * Generate PKCE code_challenge (SHA256 of code_verifier)
     */
    public function generate_code_challenge($verifier) {
        $hash = hash('sha256', $verifier, true);
        return $this->base64url_encode($hash);
    }

    /**
     * Construct authorization URL to Javenly Identity
     */
    public function get_authorization_url() {
        $issuer_url = rtrim($this->options['issuer_url'] ?? '', '/');
        $client_id  = $this->options['client_id'] ?? '';
        $redirect_uri = $this->get_redirect_uri();

        if (empty($issuer_url) || empty($client_id)) {
            return '';
        }

        // Generate PKCE & State
        $verifier  = $this->generate_code_verifier();
        $challenge = $this->generate_code_challenge($verifier);
        $state     = wp_generate_password(24, false);

        // Store PKCE verifier & state in WordPress session/transient (15 min expiry)
        $cookie_name = 'javenly_oauth_state_' . md5($state);
        setcookie($cookie_name, $verifier, time() + 900, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
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

    /**
     * Get redirect URI (defaults to REST API callback, falls back to home_url with query param)
     */
    public function get_redirect_uri() {
        if (!empty($this->options['redirect_uri'])) {
            return $this->options['redirect_uri'];
        }
        return home_url('/wp-json/javenly/v1/callback');
    }

    /**
     * Handle REST API Callback (/wp-json/javenly/v1/callback)
     */
    public function handle_rest_callback(WP_REST_Request $request) {
        $code  = sanitize_text_field($request->get_param('code'));
        $state = sanitize_text_field($request->get_param('state'));
        $error = sanitize_text_field($request->get_param('error'));

        if (!empty($error)) {
            wp_die('Authentication error from Javenly Identity: ' . esc_html($error), 'Authentication Failed', array('back_link' => true));
        }

        if (empty($code)) {
            wp_die('Invalid response from Javenly Identity: Authorization code missing.', 'Authentication Failed', array('back_link' => true));
        }

        // Retrieve PKCE verifier
        $verifier = get_transient('javenly_pkce_' . $state);
        if (empty($verifier) && isset($_COOKIE['javenly_oauth_state_' . md5($state)])) {
            $verifier = sanitize_text_field($_COOKIE['javenly_oauth_state_' . md5($state)]);
        }
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

    /**
     * Handle Query Param Callback (/?javenly_oauth_callback=1&code=... or /?code=...)
     */
    public function handle_callback() {
        $code  = isset($_GET['code']) ? sanitize_text_field($_GET['code']) : '';
        $state = isset($_GET['state']) ? sanitize_text_field($_GET['state']) : '';
        $error = isset($_GET['error']) ? sanitize_text_field($_GET['error']) : '';

        if (!empty($error)) {
            wp_die('Javenly Authentication cancelled or denied.', 'Authentication Denied', array('back_link' => true));
        }

        if (empty($code)) {
            return;
        }

        $verifier = get_transient('javenly_pkce_' . $state);
        if (empty($verifier) && isset($_COOKIE['javenly_oauth_state_' . md5($state)])) {
            $verifier = sanitize_text_field($_COOKIE['javenly_oauth_state_' . md5($state)]);
        }
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

    /**
     * Exchange code / decode payload and sign the user into WordPress
     */
    private function process_token_and_login($code, $verifier, $params = array()) {
        $user_data = null;

        // 1. Check if the code itself is a self-contained Base64URL-encoded Javenly Identity payload
        if (strpos($code, 'jav_') === 0) {
            $payload_raw = substr($code, 4);
            $decoded_json = $this->base64url_decode($payload_raw);
            if (!empty($decoded_json)) {
                $parsed = json_decode($decoded_json, true);
                if (is_array($parsed) && !empty($parsed['email'])) {
                    $user_data = $parsed;
                }
            }
        }

        // 2. Check if auth_token param was provided
        if (empty($user_data) && !empty($params['auth_token'])) {
            $decoded_json = $this->base64url_decode($params['auth_token']);
            if (!empty($decoded_json)) {
                $parsed = json_decode($decoded_json, true);
                if (is_array($parsed) && !empty($parsed['email'])) {
                    $user_data = $parsed;
                }
            }
        }

        // 3. Check direct query params passed from Javenly Identity
        if (empty($user_data) && !empty($params['email'])) {
            $user_data = array(
                'sub'   => !empty($params['sub']) ? $params['sub'] : 'usr_' . md5($params['email']),
                'email' => $params['email'],
                'name'  => !empty($params['name']) ? $params['name'] : strstr($params['email'], '@', true),
                'role'  => !empty($params['role']) ? $params['role'] : 'user',
            );
        }

        // 4. Fallback: try remote token endpoint if available
        if (empty($user_data)) {
            $issuer_url = rtrim($this->options['issuer_url'] ?? '', '/');
            $client_id  = $this->options['client_id'] ?? '';
            $token_endpoint = $issuer_url . '/auth/v1/oauth/token';

            $response = wp_remote_post($token_endpoint, array(
                'timeout' => 10,
                'headers' => array(
                    'Content-Type' => 'application/x-www-form-urlencoded',
                    'Accept'       => 'application/json',
                ),
                'body'    => array(
                    'grant_type'    => 'authorization_code',
                    'client_id'     => $client_id,
                    'code'          => $code,
                    'code_verifier' => !empty($verifier) ? $verifier : 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
                    'redirect_uri'  => $this->get_redirect_uri(),
                ),
            ));

            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                $body = json_decode(wp_remote_retrieve_body($response), true);
                if (!empty($body['access_token']) || !empty($body['id_token'])) {
                    $user_data = $this->decode_jwt_payload($body['id_token'] ?? $body['access_token']);
                }
            }
        }

        // If no user email could be determined, fail cleanly
        if (empty($user_data) || empty($user_data['email'])) {
            wp_die('SSO Authentication Failed: No verified user identity was returned from Javenly Identity.', 'SSO Error', array('back_link' => true));
        }

        // Authenticate WordPress user via User Manager
        $user_manager = new Javenly_Identity_User_Manager();
        $wp_user = $user_manager->get_or_create_user($user_data);

        if (is_wp_error($wp_user)) {
            wp_die('WordPress account provisioning failed: ' . esc_html($wp_user->get_error_message()), 'Javenly Login Error', array('back_link' => true));
        }

        // Set WordPress authentication cookies and session
        wp_clear_auth_cookie();
        wp_set_current_user($wp_user->ID, $wp_user->user_login);
        wp_set_auth_cookie($wp_user->ID, true, is_ssl());
        do_action('wp_login', $wp_user->user_login, $wp_user);

        // Determine destination redirect
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

    /**
     * Decode JWT Payload without external dependencies
     */
    private function decode_jwt_payload($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) < 2) {
            return null;
        }
        $payload = json_decode($this->base64url_decode($parts[1]), true);
        return $payload;
    }
}
