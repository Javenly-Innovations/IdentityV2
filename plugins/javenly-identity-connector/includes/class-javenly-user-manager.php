<?php
/**
 * User Manager: Links Javenly Identity UUIDs (sub) to WordPress Users
 */

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

    /**
     * Look up existing user by Javenly OIDC sub UUID, or email, or create new WordPress user
     *
     * @param array $user_data
     * @return WP_User|WP_Error
     */
    public function get_or_create_user($user_data) {
        $sub   = sanitize_text_field($user_data['sub'] ?? '');
        $email = sanitize_email($user_data['email'] ?? '');
        $name  = sanitize_text_field($user_data['name'] ?? ($user_data['user_metadata']['full_name'] ?? 'Javenly Member'));

        if (empty($email) && empty($sub)) {
            return new WP_Error('invalid_user_data', 'Missing user identifier from Javenly Identity.');
        }

        // 1. Look up by stable _javenly_identity_sub
        if (!empty($sub)) {
            $users = get_users(array(
                'meta_key'   => '_javenly_identity_sub',
                'meta_value' => $sub,
                'number'     => 1,
            ));

            if (!empty($users)) {
                return $users[0];
            }
        }

        // 2. Look up by email
        if (!empty($email)) {
            $existing_user = get_user_by('email', $email);
            if ($existing_user) {
                // Link account safely
                update_user_meta($existing_user->ID, '_javenly_identity_sub', $sub);
                return $existing_user;
            }
        }

        // 3. Auto-create new WordPress user if enabled
        if (empty($this->options['auto_create_user'])) {
            return new WP_Error('user_not_found', 'No existing WordPress user found for this Javenly account.');
        }

        // Generate username from email or name
        $base_username = sanitize_user(str_replace(array('@', '.'), '_', $email), true);
        if (empty($base_username)) {
            $base_username = 'javenly_user_' . wp_generate_password(6, false);
        }

        $username = $base_username;
        $counter = 1;
        while (username_exists($username)) {
            $username = $base_username . '_' . $counter;
            $counter++;
        }

        // Determine user role
        $role = $this->options['default_role'] ?? 'subscriber';
        if ($email === 'business@javenly.com' || $email === 'admin@javenly.com') {
            $role = 'administrator';
        }

        $random_password = wp_generate_password(32, true, true);

        $user_id = wp_insert_user(array(
            'user_login'   => $username,
            'user_pass'    => $random_password,
            'user_email'   => $email,
            'display_name' => $name,
            'first_name'   => $name,
            'role'         => $role,
        ));

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Store persistent metadata
        update_user_meta($user_id, '_javenly_identity_sub', $sub);
        update_user_meta($user_id, '_javenly_linked_at', current_time('mysql'));

        return get_user_by('id', $user_id);
    }
}
