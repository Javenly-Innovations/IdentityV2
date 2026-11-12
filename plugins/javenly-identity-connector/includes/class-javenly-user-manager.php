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
        $name  = sanitize_text_field($user_data['name'] ?? ($user_data['user_metadata']['full_name'] ?? ''));
        $role_claim = strtolower(sanitize_text_field($user_data['role'] ?? ''));

        if (empty($email) && empty($sub)) {
            return new WP_Error('invalid_user_data', 'Missing user identifier from Javenly Identity.');
        }

        // Determine if account is an administrator
        $is_admin = false;
        if (
            $email === 'business@javenly.com' ||
            $email === 'admin@javenly.com' ||
            $role_claim === 'super_admin' ||
            $role_claim === 'admin' ||
            $role_claim === 'administrator'
        ) {
            $is_admin = true;
        }

        $target_role = $is_admin ? 'administrator' : ($this->options['default_role'] ?? 'subscriber');

        // 1. Look up by stable _javenly_identity_sub
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
                // Link account safely
                update_user_meta($existing_user->ID, '_javenly_identity_sub', $sub);
                if ($is_admin && !in_array('administrator', (array) $existing_user->roles)) {
                    $existing_user->set_role('administrator');
                }
                return $existing_user;
            }
        }

        // 3. Auto-create new WordPress user if enabled
        if (empty($this->options['auto_create_user'])) {
            return new WP_Error('user_not_found', 'No existing WordPress user found for this Javenly account and auto-creation is disabled.');
        }

        // Generate username from email or name
        $base_username = sanitize_user(strstr($email, '@', true), true);
        if (empty($base_username)) {
            $base_username = sanitize_user(str_replace(array('@', '.'), '_', $email), true);
        }
        if (empty($base_username)) {
            $base_username = 'javenly_' . wp_generate_password(6, false);
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

        // Store persistent metadata
        update_user_meta($user_id, '_javenly_identity_sub', $sub);
        update_user_meta($user_id, '_javenly_linked_at', current_time('mysql'));

        return get_user_by('id', $user_id);
    }
}
