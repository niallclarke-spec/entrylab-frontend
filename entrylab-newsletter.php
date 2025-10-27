<?php
/**
 * Plugin Name: EntryLab Newsletter
 * Description: Manages newsletter subscriptions with source tracking for EntryLab
 * Version: 3.0
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
    
    // Handle single delete
    if (isset($_POST['delete_subscriber']) && check_admin_referer('entrylab_delete_subscriber')) {
        $subscriber_id = intval($_POST['subscriber_id']);
        $wpdb->delete($table_name, array('id' => $subscriber_id), array('%d'));
        echo '<div class="notice notice-success is-dismissible"><p><strong>Subscriber deleted successfully!</strong></p></div>';
    }
    
    // Handle bulk delete
    if (isset($_POST['bulk_delete']) && check_admin_referer('entrylab_bulk_action')) {
        $subscriber_ids = array_map('intval', $_POST['subscriber_ids'] ?? array());
        if (!empty($subscriber_ids)) {
            $placeholders = implode(',', array_fill(0, count($subscriber_ids), '%d'));
            $wpdb->query($wpdb->prepare(
                "DELETE FROM $table_name WHERE id IN ($placeholders)",
                ...$subscriber_ids
            ));
            $count = count($subscriber_ids);
            echo '<div class="notice notice-success is-dismissible"><p><strong>' . $count . ' subscriber(s) deleted successfully!</strong></p></div>';
        }
    }
    
    // Handle manual database update
    if (isset($_POST['update_database']) && check_admin_referer('entrylab_update_db')) {
        entrylab_create_newsletter_table();
        echo '<div class="notice notice-success is-dismissible"><p><strong>Database updated successfully!</strong> The source column has been added.</p></div>';
    }
    
    // Get filter and search parameters
    $filter_source = isset($_GET['filter_source']) ? sanitize_text_field($_GET['filter_source']) : '';
    $search_email = isset($_GET['search_email']) ? sanitize_text_field($_GET['search_email']) : '';
    
    // Build query with filters
    $where_clauses = array();
    $query_params = array();
    
    if (!empty($filter_source)) {
        $where_clauses[] = "source = %s";
        $query_params[] = $filter_source;
    }
    
    if (!empty($search_email)) {
        $where_clauses[] = "email LIKE %s";
        $query_params[] = '%' . $wpdb->esc_like($search_email) . '%';
    }
    
    $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
    
    // Get filtered subscribers
    if (!empty($query_params)) {
        $subscribers = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name $where_sql ORDER BY subscribed_at DESC",
            ...$query_params
        ));
    } else {
        $subscribers = $wpdb->get_results("SELECT * FROM $table_name ORDER BY subscribed_at DESC");
    }
    
    // Get all unique sources for filter dropdown
    $sources = $wpdb->get_col("SELECT DISTINCT source FROM $table_name WHERE source IS NOT NULL ORDER BY source ASC");
    
    // Get total count
    $total_count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    $filtered_count = count($subscribers);
    
    // Handle CSV export with current filters
    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
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
    
    ?>
    <div class="wrap">
        <h1>Newsletter Subscribers</h1>
        <p>
            Showing <strong><?php echo $filtered_count; ?></strong> of <strong><?php echo $total_count; ?></strong> total subscribers
        </p>
        
        <!-- Filter and Search Form -->
        <div style="background: #fff; padding: 15px; margin: 20px 0; border: 1px solid #ccc; border-radius: 4px;">
            <form method="get" style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                <input type="hidden" name="page" value="entrylab-newsletter">
                
                <div>
                    <label for="filter_source" style="display: block; margin-bottom: 5px; font-weight: 600;">Filter by Source:</label>
                    <select name="filter_source" id="filter_source" style="min-width: 200px;">
                        <option value="">All Sources</option>
                        <?php foreach ($sources as $source): ?>
                            <option value="<?php echo esc_attr($source); ?>" <?php selected($filter_source, $source); ?>>
                                <?php echo esc_html($source); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div>
                    <label for="search_email" style="display: block; margin-bottom: 5px; font-weight: 600;">Search Email:</label>
                    <input type="text" name="search_email" id="search_email" value="<?php echo esc_attr($search_email); ?>" 
                           placeholder="Enter email..." style="min-width: 250px;">
                </div>
                
                <div>
                    <button type="submit" class="button button-primary">Apply Filters</button>
                    <a href="?page=entrylab-newsletter" class="button">Clear</a>
                </div>
            </form>
        </div>
        
        <!-- Action Buttons -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="?page=entrylab-newsletter&export=csv<?php echo !empty($filter_source) ? '&filter_source=' . urlencode($filter_source) : ''; ?><?php echo !empty($search_email) ? '&search_email=' . urlencode($search_email) : ''; ?>" 
               class="button button-primary">
                📥 Export to CSV<?php echo ($filtered_count != $total_count) ? ' (Filtered)' : ''; ?>
            </a>
            
            <form method="post" style="display: inline-block;">
                <?php wp_nonce_field('entrylab_update_db'); ?>
                <button type="submit" name="update_database" class="button button-secondary" 
                        onclick="return confirm('This will update the database table to add the source column. Continue?');">
                    🔄 Update Database
                </button>
            </form>
            
            <button type="button" class="button button-secondary" onclick="toggleSelectAll()">
                ☑️ Toggle Select All
            </button>
            
            <button type="button" class="button button-secondary" id="bulk-delete-btn" onclick="bulkDelete()" style="color: #dc3232;">
                🗑️ Delete Selected
            </button>
        </div>
        
        <!-- Bulk Action Form -->
        <form method="post" id="bulk-action-form">
            <?php wp_nonce_field('entrylab_bulk_action'); ?>
            <input type="hidden" name="bulk_delete" value="1">
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" id="select-all-checkbox" onclick="toggleSelectAll()"></th>
                        <th style="width: 50px;">ID</th>
                        <th>Email</th>
                        <th>Source</th>
                        <th>Subscribed At</th>
                        <th>IP Address</th>
                        <th style="width: 80px;">Status</th>
                        <th style="width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($subscribers)): ?>
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 20px;">
                                No subscribers found<?php echo (!empty($filter_source) || !empty($search_email)) ? ' matching your filters' : ''; ?>.
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($subscribers as $subscriber): ?>
                            <tr>
                                <td>
                                    <input type="checkbox" name="subscriber_ids[]" value="<?php echo esc_attr($subscriber->id); ?>" class="subscriber-checkbox">
                                </td>
                                <td><?php echo esc_html($subscriber->id); ?></td>
                                <td><strong><?php echo esc_html($subscriber->email); ?></strong></td>
                                <td>
                                    <span style="background: #f0f0f1; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                                        <?php echo esc_html($subscriber->source ?? 'Unknown'); ?>
                                    </span>
                                </td>
                                <td><?php echo esc_html($subscriber->subscribed_at); ?></td>
                                <td><?php echo esc_html($subscriber->ip_address ?? 'N/A'); ?></td>
                                <td>
                                    <span class="status-<?php echo esc_attr($subscriber->status ?? 'active'); ?>">
                                        <?php echo esc_html(ucfirst($subscriber->status ?? 'active')); ?>
                                    </span>
                                </td>
                                <td>
                                    <form method="post" style="display: inline-block;" onsubmit="return confirm('Are you sure you want to delete this subscriber?');">
                                        <?php wp_nonce_field('entrylab_delete_subscriber'); ?>
                                        <input type="hidden" name="subscriber_id" value="<?php echo esc_attr($subscriber->id); ?>">
                                        <button type="submit" name="delete_subscriber" class="button button-small" style="color: #dc3232; padding: 0 8px; height: 24px; line-height: 22px;">
                                            🗑️
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </form>
    </div>
    
    <style>
        .status-active { color: #46b450; font-weight: bold; }
        .status-inactive { color: #dc3232; }
    </style>
    
    <script>
        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('select-all-checkbox');
            const checkboxes = document.querySelectorAll('.subscriber-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        }
        
        function bulkDelete() {
            const checkboxes = document.querySelectorAll('.subscriber-checkbox:checked');
            if (checkboxes.length === 0) {
                alert('Please select at least one subscriber to delete.');
                return;
            }
            
            if (confirm('Are you sure you want to delete ' + checkboxes.length + ' subscriber(s)? This cannot be undone.')) {
                document.getElementById('bulk-action-form').submit();
            }
        }
    </script>
    <?php
}
