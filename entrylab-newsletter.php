<?php
/**
 * Plugin Name: EntryLab Newsletter
 * Description: Manages newsletter subscriptions with source tracking for EntryLab
 * Version: 2.0
 * Author: EntryLab
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Create database table on plugin activation
function entrylab_create_newsletter_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'entrylab_newsletter';
    $charset_collate = $wpdb->get_charset_collate();

    // Create table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        email varchar(255) NOT NULL,
        source varchar(255) DEFAULT 'Unknown',
        subscribed_at datetime DEFAULT CURRENT_TIMESTAMP,
        ip_address varchar(45) DEFAULT NULL,
        status varchar(20) DEFAULT 'active',
        PRIMARY KEY  (id),
        UNIQUE KEY email (email)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Check if source column exists, if not add it (for existing installations)
    $column_exists = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = 'source'",
        DB_NAME,
        $table_name
    ));
    
    if (empty($column_exists)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN source varchar(255) DEFAULT 'Unknown' AFTER email");
    }
    
    // Check if ip_address column exists, if not add it
    $ip_column_exists = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = 'ip_address'",
        DB_NAME,
        $table_name
    ));
    
    if (empty($ip_column_exists)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN ip_address varchar(45) DEFAULT NULL AFTER subscribed_at");
    }
    
    // Check if status column exists, if not add it
    $status_column_exists = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = 'status'",
        DB_NAME,
        $table_name
    ));
    
    if (empty($status_column_exists)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN status varchar(20) DEFAULT 'active'");
    }
}
register_activation_hook(__FILE__, 'entrylab_create_newsletter_table');
add_action('after_setup_theme', 'entrylab_create_newsletter_table');

// Register custom REST API endpoint
function entrylab_register_newsletter_endpoint() {
    register_rest_route('entrylab/v1', '/newsletter/subscribe', array(
        'methods' => 'POST',
        'callback' => 'entrylab_handle_newsletter_subscription',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'entrylab_register_newsletter_endpoint');

// Handle newsletter subscription
function entrylab_handle_newsletter_subscription($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'entrylab_newsletter';
    
    $email = sanitize_email($request->get_param('email'));
    $source = sanitize_text_field($request->get_param('source')) ?: 'Unknown';
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }
    
    // Get subscriber IP address
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    
    // Rate limiting: Check if this IP has subscribed recently (within last 60 seconds)
    if ($ip_address) {
        $recent_submission = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name 
            WHERE ip_address = %s 
            AND subscribed_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)",
            $ip_address
        ));
        
        if ($recent_submission > 0) {
            return new WP_Error(
                'rate_limit', 
                'Please wait before subscribing again', 
                array('status' => 429)
            );
        }
    }
    
    // Check if email already exists
    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table_name WHERE email = %s",
        $email
    ));
    
    if ($existing) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Email already subscribed',
            'already_subscribed' => true
        ), 200);
    }
    
    // Additional spam protection: Block disposable email domains
    $disposable_domains = array('tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com');
    $email_domain = substr(strrchr($email, "@"), 1);
    if (in_array($email_domain, $disposable_domains)) {
        return new WP_Error('invalid_email', 'Disposable email addresses are not allowed', array('status' => 400));
    }
    
    // Insert new subscription
    $result = $wpdb->insert(
        $table_name,
        array(
            'email' => $email,
            'source' => $source,
            'ip_address' => $ip_address,
            'subscribed_at' => current_time('mysql'),
            'status' => 'active'
        ),
        array('%s', '%s', '%s', '%s', '%s')
    );
    
    if ($result === false) {
        return new WP_Error('db_error', 'Database error', array('status' => 500));
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Successfully subscribed to newsletter'
    ), 200);
}

// Add admin menu
function entrylab_add_admin_menu() {
    add_menu_page(
        'EntryLab Newsletter',
        'EntryLab',
        'manage_options',
        'entrylab-newsletter',
        'entrylab_newsletter_admin_page',
        'dashicons-email-alt',
        30
    );
}
add_action('admin_menu', 'entrylab_add_admin_menu');

// Admin page to view subscribers
function entrylab_newsletter_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'entrylab_newsletter';
    
    // Handle manual database update
    if (isset($_POST['update_database']) && check_admin_referer('entrylab_update_db')) {
        entrylab_create_newsletter_table();
        echo '<div class="notice notice-success is-dismissible"><p><strong>Database updated successfully!</strong> The source column has been added.</p></div>';
    }
    
    // Handle CSV export
    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        $subscribers = $wpdb->get_results("SELECT * FROM $table_name ORDER BY subscribed_at DESC");
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="entrylab-subscribers-' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, array('ID', 'Email', 'Source', 'Subscribed At', 'IP Address', 'Status'));
        
        foreach ($subscribers as $subscriber) {
            fputcsv($output, array(
                $subscriber->id,
                $subscriber->email,
                $subscriber->source,
                $subscriber->subscribed_at,
                $subscriber->ip_address,
                $subscriber->status
            ));
        }
        
        fclose($output);
        exit;
    }
    
    // Get all subscribers
    $subscribers = $wpdb->get_results("SELECT * FROM $table_name ORDER BY subscribed_at DESC");
    $total_count = count($subscribers);
    
    ?>
    <div class="wrap">
        <h1>Newsletter Subscribers</h1>
        <p>Total Subscribers: <strong><?php echo $total_count; ?></strong></p>
        
        <div style="margin-bottom: 20px;">
            <a href="?page=entrylab-newsletter&export=csv" class="button button-primary">
                Export to CSV
            </a>
            
            <form method="post" style="display: inline-block; margin-left: 10px;">
                <?php wp_nonce_field('entrylab_update_db'); ?>
                <button type="submit" name="update_database" class="button button-secondary" 
                        onclick="return confirm('This will update the database table to add the source column. Continue?');">
                    🔄 Update Database
                </button>
            </form>
        </div>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Subscribed At</th>
                    <th>IP Address</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($subscribers)): ?>
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px;">
                            No subscribers yet.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($subscribers as $subscriber): ?>
                        <tr>
                            <td><?php echo esc_html($subscriber->id); ?></td>
                            <td><?php echo esc_html($subscriber->email); ?></td>
                            <td><strong><?php echo esc_html($subscriber->source ?? 'Unknown'); ?></strong></td>
                            <td><?php echo esc_html($subscriber->subscribed_at); ?></td>
                            <td><?php echo esc_html($subscriber->ip_address ?? 'N/A'); ?></td>
                            <td>
                                <span class="status-<?php echo esc_attr($subscriber->status ?? 'active'); ?>">
                                    <?php echo esc_html(ucfirst($subscriber->status ?? 'active')); ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    
    <style>
        .status-active { color: #46b450; font-weight: bold; }
        .status-inactive { color: #dc3232; }
    </style>
    <?php
}
