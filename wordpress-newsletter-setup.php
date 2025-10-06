<?php
/**
 * EntryLab Newsletter Subscription System
 * 
 * INSTALLATION INSTRUCTIONS:
 * 1. Add this code to your theme's functions.php file
 *    OR create a custom plugin with this code
 * 2. The database table will be created automatically
 * 3. Access the subscribers list in WordPress Admin > EntryLab > Newsletter Subscribers
 * 
 * API Endpoint: https://entrylab.io/wp-json/entrylab/v1/newsletter/subscribe
 */

// Create database table on plugin/theme activation
function entrylab_create_newsletter_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'entrylab_newsletter';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        email varchar(255) NOT NULL,
        subscribed_at datetime DEFAULT CURRENT_TIMESTAMP,
        ip_address varchar(45) DEFAULT NULL,
        status varchar(20) DEFAULT 'active',
        PRIMARY KEY  (id),
        UNIQUE KEY email (email)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
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
    
    // Insert new subscriber
    $result = $wpdb->insert(
        $table_name,
        array(
            'email' => $email,
            'ip_address' => $ip_address,
            'status' => 'active'
        ),
        array('%s', '%s', '%s')
    );
    
    if ($result === false) {
        return new WP_Error('db_error', 'Failed to save subscription', array('status' => 500));
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Successfully subscribed to newsletter'
    ), 200);
}

// Add admin menu page to view subscribers
function entrylab_add_newsletter_admin_menu() {
    add_menu_page(
        'Newsletter Subscribers',
        'EntryLab',
        'manage_options',
        'entrylab-newsletter',
        'entrylab_newsletter_admin_page',
        'dashicons-email-alt',
        30
    );
    
    add_submenu_page(
        'entrylab-newsletter',
        'Newsletter Subscribers',
        'Subscribers',
        'manage_options',
        'entrylab-newsletter',
        'entrylab_newsletter_admin_page'
    );
}
add_action('admin_menu', 'entrylab_add_newsletter_admin_menu');

// Display admin page with subscriber list
function entrylab_newsletter_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'entrylab_newsletter';
    
    // Handle export to CSV
    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        $subscribers = $wpdb->get_results("SELECT * FROM $table_name ORDER BY subscribed_at DESC");
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="newsletter-subscribers-' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, array('ID', 'Email', 'Subscribed At', 'IP Address', 'Status'));
        
        foreach ($subscribers as $sub) {
            fputcsv($output, array(
                $sub->id,
                $sub->email,
                $sub->subscribed_at,
                $sub->ip_address,
                $sub->status
            ));
        }
        
        fclose($output);
        exit;
    }
    
    // Get total count
    $total_subscribers = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'active'");
    
    // Pagination
    $per_page = 50;
    $current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
    $offset = ($current_page - 1) * $per_page;
    
    // Get subscribers
    $subscribers = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table_name ORDER BY subscribed_at DESC LIMIT %d OFFSET %d",
        $per_page,
        $offset
    ));
    
    $total_pages = ceil($total_subscribers / $per_page);
    
    ?>
    <div class="wrap">
        <h1>Newsletter Subscribers</h1>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0;">Statistics</h2>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #2271b1;">
                <?php echo number_format($total_subscribers); ?>
            </p>
            <p style="margin: 0; color: #666;">Active Subscribers</p>
        </div>
        
        <p>
            <a href="?page=entrylab-newsletter&export=csv" class="button button-primary">
                Export to CSV
            </a>
        </p>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email Address</th>
                    <th>Subscribed Date</th>
                    <th>IP Address</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($subscribers)): ?>
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px;">
                            No subscribers yet.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($subscribers as $subscriber): ?>
                        <tr>
                            <td><?php echo esc_html($subscriber->id); ?></td>
                            <td>
                                <strong><?php echo esc_html($subscriber->email); ?></strong>
                            </td>
                            <td><?php echo esc_html(date('F j, Y, g:i a', strtotime($subscriber->subscribed_at))); ?></td>
                            <td><?php echo esc_html($subscriber->ip_address ?: 'N/A'); ?></td>
                            <td>
                                <span style="color: <?php echo $subscriber->status === 'active' ? '#46b450' : '#dc3232'; ?>;">
                                    <?php echo esc_html(ucfirst($subscriber->status)); ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
        
        <?php if ($total_pages > 1): ?>
            <div class="tablenav bottom">
                <div class="tablenav-pages">
                    <?php
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => '&laquo; Previous',
                        'next_text' => 'Next &raquo;',
                        'total' => $total_pages,
                        'current' => $current_page
                    ));
                    ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
