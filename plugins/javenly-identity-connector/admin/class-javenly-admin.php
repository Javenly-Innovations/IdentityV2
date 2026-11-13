<?php
/**
 * Admin Settings Page for Javenly Identity Connector
 */

if (!defined('ABSPATH')) {
    exit;
}

class Javenly_Identity_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function add_admin_menu() {
        add_options_page(
            'Javenly Identity SSO Settings',
            'Javenly Identity',
            'manage_options',
            'javenly-identity-settings',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('javenly_identity_group', 'javenly_identity_settings', array($this, 'sanitize_settings'));
    }

    public function sanitize_settings($input) {
        $output = array();
        $output['issuer_url']       = esc_url_raw(trim($input['issuer_url'] ?? 'https://identity.javenly.com'));
        $output['client_id']        = sanitize_text_field(trim($input['client_id'] ?? 'client_jav_wordpress_javenly_com'));
        $output['client_secret']    = sanitize_text_field(trim($input['client_secret'] ?? ''));
        $output['redirect_uri']     = esc_url_raw(trim($input['redirect_uri'] ?? home_url('/?javenly_oauth_callback=1')));
        $output['default_role']     = sanitize_text_field($input['default_role'] ?? 'administrator');
        $output['auto_create_user'] = isset($input['auto_create_user']) ? '1' : '0';
        return $output;
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $options = get_option('javenly_identity_settings', array(
            'issuer_url'       => 'https://identity.javenly.com',
            'client_id'        => 'client_jav_wordpress_javenly_com',
            'client_secret'    => '',
            'redirect_uri'     => home_url('/?javenly_oauth_callback=1'),
            'default_role'     => 'administrator',
            'auto_create_user' => '1',
        ));

        ?>
        <div class="wrap" style="max-width: 880px; margin-top: 24px;">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 28 20 C 44 14, 68 18, 76 32 C 82 43, 78 58, 68 66 L 56 56 C 62 50, 64 42, 60 36 C 56 28, 42 26, 32 30 Z" fill="#00A3E0" />
                    <path d="M 72 32 C 82 46, 80 68, 68 80 C 56 90, 36 88, 24 76 C 14 66, 16 48, 26 38 L 36 48 C 30 54, 30 62, 36 68 C 42 74, 54 74, 60 68 C 66 60, 68 48, 60 40 Z" fill="#ED3833" />
                </svg>
                <div>
                    <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #0f172a;">Javenly Identity Connector</h1>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Single Sign-On (SSO) & OAuth 2.1 authentication for javenly.com</p>
                </div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <form method="post" action="options.php">
                    <?php settings_fields('javenly_identity_group'); ?>

                    <table class="form-table" role="presentation">
                        <tr>
                            <th scope="row">
                                <label for="issuer_url">Javenly Identity Portal URL</label>
                            </th>
                            <td>
                                <input name="javenly_identity_settings[issuer_url]" type="url" id="issuer_url" value="<?php echo esc_attr($options['issuer_url']); ?>" class="regular-text" placeholder="https://identity.javenly.com" required style="width: 100%; max-width: 480px;" />
                                <p class="description">The URL of your centralized Javenly Identity platform.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="client_id">OAuth 2.1 Client ID</label>
                            </th>
                            <td>
                                <input name="javenly_identity_settings[client_id]" type="text" id="client_id" value="<?php echo esc_attr($options['client_id']); ?>" class="regular-text" placeholder="client_jav_wordpress_javenly_com" required style="width: 100%; max-width: 480px; font-family: monospace;" />
                                <p class="description">Identifier registered for this WordPress website in Javenly Identity.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="redirect_uri">Registered Redirect URI</label>
                            </th>
                            <td>
                                <input name="javenly_identity_settings[redirect_uri]" type="url" id="redirect_uri" value="<?php echo esc_attr($options['redirect_uri']); ?>" class="regular-text" style="width: 100%; max-width: 480px; font-family: monospace;" />
                                <p class="description">Callback URL where Javenly Identity returns authenticated users. Standard: <code><?php echo esc_url(home_url('/?javenly_oauth_callback=1')); ?></code>.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="default_role">Default New User Role</label>
                            </th>
                            <td>
                                <select name="javenly_identity_settings[default_role]" id="default_role">
                                    <option value="administrator" <?php selected($options['default_role'], 'administrator'); ?>>Administrator (Full wp-admin access)</option>
                                    <option value="subscriber" <?php selected($options['default_role'], 'subscriber'); ?>>Subscriber</option>
                                    <option value="customer" <?php selected($options['default_role'], 'customer'); ?>>Customer (WooCommerce)</option>
                                    <option value="editor" <?php selected($options['default_role'], 'editor'); ?>>Editor</option>
                                </select>
                                <p class="description">Role assigned when a new Javenly user signs in. Administrators always receive full Administrator privileges with direct wp-admin access.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">Auto-Create User Accounts</th>
                            <td>
                                <label for="auto_create_user">
                                    <input name="javenly_identity_settings[auto_create_user]" type="checkbox" id="auto_create_user" value="1" <?php checked('1', $options['auto_create_user']); ?> />
                                    Automatically create a WordPress user account when an authenticated Javenly member logs in
                                </label>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                        <?php submit_button('Save Javenly Settings', 'primary', 'submit', false); ?>
                    </div>
                </form>
            </div>

            <!-- Integration Instructions -->
            <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                <h3 style="margin-top: 0; font-size: 15px; font-weight: 700; color: #1e293b;">WordPress & wp-admin Access</h3>
                <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.6; color: #475569; font-size: 13px;">
                    <li><strong>Full wp-admin Access</strong>: All verified administrators automatically land directly in <code>/wp-admin/</code> with complete administrative access.</li>
                    <li><strong>Standard WordPress Login</strong>: Standard WordPress username and password logins remain 100% available on <code>/wp-login.php</code> alongside the Javenly SSO button.</li>
                    <li><strong>Automatic Provisioning</strong>: User accounts and passwords in WordPress are created or synced seamlessly upon first login.</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

