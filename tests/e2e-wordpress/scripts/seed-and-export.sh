#!/usr/bin/env bash
set -euo pipefail

WP_PATH="${WP_PATH:-/var/www/html}"
WP_URL_INTERNAL="${WORDPRESS_URL_INTERNAL:-http://wordpress}"
WP_URL_EXTERNAL="${WORDPRESS_URL_EXTERNAL:-http://127.0.0.1:8088}"
WP_ADMIN_USER="${WP_ADMIN_USER:-admin}"
WP_ADMIN_PASSWORD="${WP_ADMIN_PASSWORD:-admin-pass}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.test}"
WP_E2E_APP_PASSWORD_NAME="${WP_E2E_APP_PASSWORD_NAME:-unpress-e2e}"
WP_EXPORT_DIR="${WP_EXPORT_DIR:-/workspace/output}"
WORDPRESS_DB_HOST="${WORDPRESS_DB_HOST:-db:3306}"
WORDPRESS_DB_NAME="${WORDPRESS_DB_NAME:-wordpress}"
WORDPRESS_DB_USER="${WORDPRESS_DB_USER:-wp}"
WORDPRESS_DB_PASSWORD="${WORDPRESS_DB_PASSWORD:-wp}"

mkdir -p "$WP_EXPORT_DIR"

wp_cmd() {
  wp --allow-root --path="$WP_PATH" --url="$WP_URL_INTERNAL" "$@"
  return $?
}

wp_try() {
  timeout 15s wp --allow-root --path="$WP_PATH" --url="$WP_URL_INTERNAL" "$@"
  return $?
}

echo "Waiting for WordPress to respond..."
for i in $(seq 1 180); do
  if [[ -f "$WP_PATH/wp-load.php" ]]; then
    break
  fi
  echo "[$i/180] Waiting for WordPress core files..."
  sleep 2
done

if [[ ! -f "$WP_PATH/wp-load.php" ]]; then
  echo "WordPress core files never appeared in $WP_PATH"
  ls -la "$WP_PATH" || true
  exit 1
fi

echo "Writing deterministic wp-config.php for WP-CLI..."
wp config create \
  --allow-root \
  --path="$WP_PATH" \
  --dbname="$WORDPRESS_DB_NAME" \
  --dbuser="$WORDPRESS_DB_USER" \
  --dbpass="$WORDPRESS_DB_PASSWORD" \
  --dbhost="$WORDPRESS_DB_HOST" \
  --skip-check \
  --force >/dev/null

for i in $(seq 1 180); do
  if php -r '$url = getenv("WORDPRESS_URL_INTERNAL") ?: "http://wordpress"; $ctx = stream_context_create(["http" => ["timeout" => 2]]); $body = @file_get_contents($url, false, $ctx); exit($body === false ? 1 : 0);'; then
    break
  fi
  echo "[$i/180] Waiting for HTTP readiness..."
  sleep 2
done

INSTALL_LOG="$(mktemp)"
for i in $(seq 1 60); do
  if wp_try core is-installed >/dev/null 2>&1; then
    break
  fi
  if wp_try core install \
    --title='Unpress E2E Blog' \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" \
    --skip-email >"$INSTALL_LOG" 2>&1; then
    break
  fi
  echo "[$i/60] WordPress not installable yet; retrying..."
  tail -n 20 "$INSTALL_LOG" || true
  sleep 2
done

if ! wp_try core is-installed >/dev/null 2>&1; then
  echo "WordPress setup failed"
  tail -n 50 "$INSTALL_LOG" || true
  exit 1
fi

echo "Setting permalink structure..."
wp_try rewrite structure '/%postname%/' --hard >/dev/null

mkdir -p "$WP_PATH/wp-content/mu-plugins"
cat > "$WP_PATH/wp-content/mu-plugins/unpress-e2e-cpt.php" <<'PHP'
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
PHP

# Authors
wp_try user create author1 author1@example.test --role=author --user_pass=author1-pass >/dev/null || true
wp_try user create author2 author2@example.test --role=author --user_pass=author2-pass >/dev/null || true

AUTHOR1_ID="$(wp_try user get author1 --field=ID)"
AUTHOR2_ID="$(wp_try user get author2 --field=ID)"

# Taxonomies
wp_try term create category engineering >/dev/null || true
wp_try term create category writing >/dev/null || true
wp_try term create post_tag alpha >/dev/null || true
wp_try term create post_tag beta >/dev/null || true

# 12 posts per author
for i in $(seq 1 12); do
  wp_try post create \
    --post_type=post \
    --post_status=publish \
    --post_author="$AUTHOR1_ID" \
    --post_title="Author1 Post $i" \
    --post_excerpt="Excerpt for author1 post $i" \
    --post_content="Content for author1 post $i" \
    --post_category=engineering \
    --tags_input=alpha >/dev/null

done

for i in $(seq 1 12); do
  wp_try post create \
    --post_type=post \
    --post_status=publish \
    --post_author="$AUTHOR2_ID" \
    --post_title="Author2 Post $i" \
    --post_excerpt="Excerpt for author2 post $i" \
    --post_content="Content for author2 post $i" \
    --post_category=writing \
    --tags_input=beta >/dev/null

done

# 12 pages
for i in $(seq 1 12); do
  wp_try post create \
    --post_type=page \
    --post_status=publish \
    --post_title="Page $i" \
    --post_content="Content for page $i" >/dev/null

done

# 12 custom post type entries
for i in $(seq 1 12); do
  wp_try post create \
    --post_type=book \
    --post_status=publish \
    --post_author="$AUTHOR1_ID" \
    --post_title="Book $i" \
    --post_content="Custom post type content $i" >/dev/null

done

# Application password for API auth (delete old first for deterministic output)
EXISTING_IDS="$(wp_try user application-password list "$WP_ADMIN_USER" --format=ids || true)"
if [[ -n "$EXISTING_IDS" ]]; then
  # shellcheck disable=SC2086
  wp_try user application-password delete "$WP_ADMIN_USER" $EXISTING_IDS >/dev/null || true
fi
APP_PASSWORD="$(wp_try user application-password create "$WP_ADMIN_USER" "$WP_E2E_APP_PASSWORD_NAME" --porcelain)"

# XML export
rm -f "$WP_EXPORT_DIR"/*.xml
wp_try export --dir="$WP_EXPORT_DIR" --filename_format="unpress-e2e-{date}-{n}.xml" >/dev/null
XML_PATH="$(ls -1 "$WP_EXPORT_DIR"/unpress-e2e-*.xml | head -n 1)"

cat > "$WP_EXPORT_DIR/credentials.env" <<ENV
WP_URL=$WP_URL_EXTERNAL
WP_USER=$WP_ADMIN_USER
WP_APP_PASSWORD=$APP_PASSWORD
WP_XML_FILE=$XML_PATH
ENV

echo "Seed and export complete"
echo "XML: $XML_PATH"
