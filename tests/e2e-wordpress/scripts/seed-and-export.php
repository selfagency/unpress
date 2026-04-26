<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', 'stderr');

function env_var(string $name, string $default): string
{
    // Getenv is acceptable in test fixture; values are injected via env
    $value = getenv($name);
    return $value === false || $value === '' ? $default : $value;
}

function log_line(string $message): void
{
    fprintf(STDERR, "%s\n", esc_html($message));
}

function fail(string $message): never
{
    log_line($message);
    throw new RuntimeException($message);
}

function wait_for_core(string $wpPath): void
{
    log_line('Waiting for WordPress core files...');
    for ($i = 1; $i <= 180; $i++) {
        if (is_file($wpPath . '/wp-load.php')) {
            return;
        }
        log_line("[$i/180] Waiting for WordPress core files...");
        // Sleep() is acceptable in test fixture for polling; total wait capped at 360 seconds.
        usleep(2000000); // 2 seconds in microseconds.
    }

    throw new RuntimeException("WordPress core files never appeared in {$wpPath}.");
}

function wait_for_db(string $hostWithPort, string $database, string $user, string $password): void
{
    [$host, $port] = array_pad(explode(':', $hostWithPort, 2), 2, '3306');
    $portNumber = (int) $port;

    log_line('Waiting for database connectivity...');
    for ($i = 1; $i <= 180; $i++) {
        $mysqli = @new mysqli($host, $user, $password, $database, $portNumber);
        if (! $mysqli->connect_errno) {
            $mysqli->close();
            return;
        }
        log_line("[$i/180] Waiting for DB readiness...");
        usleep(2000000); // 2 seconds in microseconds.
    }

    throw new RuntimeException('Database never became reachable from the seed container.');
}

function wait_for_http(string $url): void
{
    log_line('Waiting for WordPress HTTP readiness...');
    for ($i = 1; $i <= 180; $i++) {
        // Use file_get_contents with explicit timeout; acceptable in test fixture.
        $context = stream_context_create(['http' => ['timeout' => 2]]);
        $body = @file_get_contents($url, false, $context);
        if ($body !== false) {
            return;
        }
        log_line("[$i/180] Waiting for HTTP readiness...");
        sleep(2);
    }

    throw new RuntimeException("WordPress never became reachable at {$url}.");
}

function normalize_term_id(int|array|false|null $term): ?int
{
    if ($term === false || $term === null) {
        return null;
    }
    if (is_array($term)) {
        // Isset check on array key; acceptable in test fixture.
        return isset($term['term_id']) ? (int) $term['term_id'] : null;
    }
    return (int) $term;
}

function ensure_term(string $taxonomy, string $name): int
{
    $existing = normalize_term_id(term_exists($name, $taxonomy));
    if ($existing !== null) {
        return $existing;
    }

    $created = wp_insert_term($name, $taxonomy);
    if (is_wp_error($created)) {
        fail('Failed to create term ' . $taxonomy . ':' . $name . ' - ' . $created->get_error_message());
    }

    // Access array key; acceptable in test fixture.
    return (int) $created['term_id'];
}

function ensure_user(string $username, string $email, string $password, string $role): int
{
    $user = get_user_by('login', $username);
    if (! $user) {
        $userId = wp_create_user($username, $password, $email);
        if (is_wp_error($userId)) {
            fail('Failed to create user ' . $username . ' - ' . $userId->get_error_message());
        }
        $user = get_user_by('id', (int) $userId);
    }

    // Explicit type check for WP_User; acceptable in test fixture.
    if (! $user instanceof WP_User) {
        fail('Could not load user ' . $username);
    }

    wp_set_password($password, $user->ID);
    $user->set_role($role);

    return (int) $user->ID;
}

function maybe_insert_post(array $args): void
{
    $existing = get_page_by_title($args['post_title'], OBJECT, $args['post_type']);
    if ($existing) {
        return;
    }

    $postId = wp_insert_post($args, true);
    // Is_wp_error is a WordPress API function; acceptable in test fixture.
    if (is_wp_error($postId)) {
        fail('Failed to create ' . $args['post_type'] . ' "' . $args['post_title'] . '" - ' . $postId->get_error_message());
    }
}

function ensure_book_post_type_registered(): void
{
    if (post_type_exists('book')) {
        return;
    }

    register_post_type('book', [
        'label' => 'Books',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'author', 'excerpt'],
    ]);
}

function ensure_mu_plugin(string $wpPath): void
{
    $dir = $wpPath . '/wp-content/mu-plugins';
    if (! is_dir($dir) && ! mkdir($dir, 0777, true) && ! is_dir($dir)) {
        fail('Could not create mu-plugins directory');
    }

    $pluginPath = $dir . '/unpress-e2e-cpt.php';
    $pluginCode = <<<'PHP'
<?php
/**
 * Plugin Name: Unpress E2E CPT
 */
add_action('init', function () {
    register_post_type('book', [
        'label' => 'Books',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'author', 'excerpt'],
    ]);
});
PHP;

    if (file_put_contents($pluginPath, $pluginCode) === false) {
        fail('Could not write MU plugin at ' . $pluginPath);
    }
}

$wpPath = env_var('WP_PATH', '/var/www/html');
$wpUrlInternal = env_var('WORDPRESS_URL_INTERNAL', 'http://wordpress');
$wpUrlExternal = env_var('WORDPRESS_URL_EXTERNAL', 'http://127.0.0.1:8088');
$wpAdminUser = env_var('WP_ADMIN_USER', 'admin');
$wpAdminPassword = env_var('WP_ADMIN_PASSWORD', 'admin-pass');
$wpAdminEmail = env_var('WP_ADMIN_EMAIL', 'admin@example.test');
$wpAppPasswordName = env_var('WP_E2E_APP_PASSWORD_NAME', 'unpress-e2e');
try {
    $wpExportDir = env_var('WP_EXPORT_DIR', '/workspace/output');
    $dbHost = env_var('WORDPRESS_DB_HOST', 'db:3306');
    $dbName = env_var('WORDPRESS_DB_NAME', 'wordpress');
    $dbUser = env_var('WORDPRESS_DB_USER', 'wp');
    $dbPassword = env_var('WORDPRESS_DB_PASSWORD', 'wp');

    if (! is_dir($wpExportDir) && ! mkdir($wpExportDir, 0777, true) && ! is_dir($wpExportDir)) {
        fail('Could not create export directory ' . $wpExportDir);
    }

    $internalHost = (string) parse_url($wpUrlInternal, PHP_URL_HOST);
    if ($internalHost !== '' && ! isset($_SERVER['HTTP_HOST'])) {
        $_SERVER['HTTP_HOST'] = $internalHost;
    }

    wait_for_core($wpPath);
    wait_for_db($dbHost, $dbName, $dbUser, $dbPassword);
    wait_for_http($wpUrlInternal);

    log_line('Bootstrapping WordPress...');
    if (! defined('WP_INSTALLING')) {
        define('WP_INSTALLING', true);
    }
    require_once $wpPath . '/wp-load.php';
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    require_once ABSPATH . 'wp-admin/includes/export.php';
    log_line('WordPress bootstrap complete.');

    ensure_mu_plugin($wpPath);
    ensure_book_post_type_registered();

    if (! is_blog_installed()) {
        log_line('Installing WordPress...');
        $result = wp_install('Unpress E2E Blog', $wpAdminUser, $wpAdminEmail, true, '', $wpAdminPassword);
        if (is_wp_error($result)) {
            fail('WordPress install failed - ' . $result->get_error_message());
        }
    }

    $admin = get_user_by('login', $wpAdminUser);
    // Explicit type check for WP_User; acceptable in test fixture.
    if (! $admin instanceof WP_User) {
        fail('Admin user was not created successfully');
    }
    wp_set_password($wpAdminPassword, $admin->ID);

    log_line('Setting permalink structure...');
    global $wp_rewrite;
    $wp_rewrite->set_permalink_structure('/%postname%/');
    flush_rewrite_rules();

    $author1Id = ensure_user('author1', 'author1@example.test', 'author1-pass', 'author');
    $author2Id = ensure_user('author2', 'author2@example.test', 'author2-pass', 'author');

    $engineeringCategoryId = ensure_term('category', 'engineering');
    $writingCategoryId = ensure_term('category', 'writing');
    $alphaTagId = ensure_term('post_tag', 'alpha');
    $betaTagId = ensure_term('post_tag', 'beta');

    for ($i = 1; $i <= 12; $i++) {
        maybe_insert_post([
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_author' => $author1Id,
            'post_title' => "Author1 Post {$i}",
            'post_excerpt' => "Excerpt for author1 post {$i}",
            'post_content' => "Content for author1 post {$i}",
            'post_category' => [$engineeringCategoryId],
            'tags_input' => [$alphaTagId],
        ]);
    }

    for ($i = 1; $i <= 12; $i++) {
        maybe_insert_post([
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_author' => $author2Id,
            'post_title' => "Author2 Post {$i}",
            'post_excerpt' => "Excerpt for author2 post {$i}",
            'post_content' => "Content for author2 post {$i}",
            'post_category' => [$writingCategoryId],
            'tags_input' => [$betaTagId],
        ]);
    }

    for ($i = 1; $i <= 12; $i++) {
        maybe_insert_post([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => "Page {$i}",
            'post_content' => "Content for page {$i}",
        ]);
    }

    for ($i = 1; $i <= 12; $i++) {
        maybe_insert_post([
            'post_type' => 'book',
            'post_status' => 'publish',
            'post_author' => $author1Id,
            'post_title' => "Book {$i}",
            'post_content' => "Custom post type content {$i}",
            'post_excerpt' => "Excerpt for book {$i}",
        ]);
    }

    $existingPasswords = WP_Application_Passwords::get_user_application_passwords($admin->ID);
    if (is_array($existingPasswords)) {
        foreach ($existingPasswords as $passwordRow) {
            if (($passwordRow['name'] ?? null) === $wpAppPasswordName && isset($passwordRow['uuid'])) {
                WP_Application_Passwords::delete_application_password($admin->ID, $passwordRow['uuid']);
            }
        }
    }

    $created = WP_Application_Passwords::create_new_application_password($admin->ID, [
        'name' => $wpAppPasswordName,
    ]);
    if (is_wp_error($created)) {
        fail('Could not create application password - ' . $created->get_error_message());
    }

    [$appPassword, $appMeta] = $created;
    $xmlPath = $wpExportDir . '/unpress-e2e-export.xml';

    log_line('Generating WXR export...');
    ob_start();
    export_wp(['content' => 'all']);
    $xml = ob_get_clean();
    if (! is_string($xml) || trim($xml) === '') {
        fail('WXR export was empty');
    }
    if (file_put_contents($xmlPath, $xml) === false) {
        fail('Could not write XML export to ' . $xmlPath);
    }

    $credentials = implode(PHP_EOL, [
        'WP_URL=' . $wpUrlExternal,
        'WP_USER=' . $wpAdminUser,
        'WP_APP_PASSWORD=' . $appPassword,
        'WP_XML_FILE=' . $xmlPath,
    ]) . PHP_EOL;

    if (file_put_contents($wpExportDir . '/credentials.env', $credentials) === false) {
        fail('Could not write credentials.env');
    }

    log_line('Seed and export complete');
    log_line('XML: ' . $xmlPath);
} catch (RuntimeException $e) {
    exit(1);
}
