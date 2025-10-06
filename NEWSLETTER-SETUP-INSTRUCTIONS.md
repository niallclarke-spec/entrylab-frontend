# Newsletter Subscription Setup Instructions

## Overview
Your newsletter form now collects email addresses and stores them in your WordPress database. You can view and manage subscribers directly from your WordPress admin panel.

## Setup Steps

### 1. Add Code to WordPress

You have two options:

**Option A: Add to functions.php (Quickest)**
1. Go to WordPress Admin → Appearance → Theme File Editor
2. Select `functions.php` from the right sidebar
3. Copy all the code from `wordpress-newsletter-setup.php`
4. Paste it at the end of your functions.php file
5. Click "Update File"

**Option B: Create a Custom Plugin (Recommended)**
1. Create a new folder in `wp-content/plugins/` called `entrylab-newsletter`
2. Create a file `entrylab-newsletter.php` in that folder
3. Add this header at the top:
```php
<?php
/**
 * Plugin Name: EntryLab Newsletter
 * Description: Manages newsletter subscriptions for EntryLab
 * Version: 1.0
 */
```
4. Copy the code from `wordpress-newsletter-setup.php` below the header
5. Activate the plugin in WordPress Admin → Plugins

### 2. Database Table Creation

The database table will be created automatically when you:
- Save the functions.php file, OR
- Activate the plugin

Table name: `wp_entrylab_newsletter` (or `{your_prefix}_entrylab_newsletter`)

### 3. View Subscribers

1. Go to WordPress Admin
2. Look for "EntryLab" in the left sidebar (with an email icon)
3. Click "EntryLab" → "Subscribers"
4. You'll see a list of all newsletter subscribers with:
   - Email addresses
   - Subscription date and time
   - IP addresses (for security)
   - Status (active/inactive)

### 4. Export Subscribers

Click the "Export to CSV" button on the subscribers page to download a spreadsheet with all subscriber data.

## API Endpoint

The WordPress REST API endpoint is now available at:
```
https://entrylab.io/wp-json/entrylab/v1/newsletter/subscribe
```

This endpoint:
- Accepts POST requests with JSON body: `{"email": "user@example.com"}`
- Validates email addresses
- Prevents duplicate subscriptions
- Returns success/error responses

## Features

✅ **Automatic Database Setup** - Table created automatically
✅ **Duplicate Prevention** - Same email can't subscribe twice
✅ **Admin Dashboard** - View all subscribers in WordPress
✅ **CSV Export** - Download subscriber list
✅ **IP Tracking** - Records subscriber IP for security
✅ **Status Management** - Active/inactive subscriber states
✅ **Pagination** - Handles large subscriber lists (50 per page)

## Testing

1. Visit your EntryLab website
2. Scroll to the newsletter form at the bottom
3. Enter an email address and click "Subscribe Now"
4. Check WordPress Admin → EntryLab → Subscribers
5. You should see the new subscriber appear!

## Troubleshooting

**"Failed to subscribe" error:**
- Make sure you've added the code to WordPress
- Check that the REST API is enabled (it should be by default)
- Try deactivating and reactivating the plugin/theme

**Table not created:**
- Make sure you saved the functions.php file or activated the plugin
- Check your WordPress database to see if `wp_entrylab_newsletter` table exists

**Subscribers not showing:**
- Clear your WordPress cache (if using a caching plugin)
- Try refreshing the admin page

## Security & Spam Protection

✅ **Rate Limiting** - Same IP can only subscribe once per 60 seconds
✅ **Email Validation** - Checks for valid email format
✅ **Disposable Email Blocking** - Blocks common temporary email services
✅ **Duplicate Prevention** - Same email can't subscribe twice
✅ **SQL Injection Protection** - All queries use prepared statements
✅ **Email Sanitization** - All emails are sanitized before storage
✅ **IP Tracking** - Records IP addresses for abuse monitoring
✅ **Admin-Only Access** - Only WordPress admins can view subscriber list

### Additional Security Recommendations

For maximum protection against spam bots, consider adding:
- Google reCAPTCHA v3 (invisible)
- Cloudflare Turnstile
- WordPress plugin like "WP Armour" for honeypot protection

## Need Help?

If you encounter any issues, check the WordPress debug log or let me know!
