# Media Handling

Configure how Unpress handles your WordPress media files (images, videos, documents, etc.) during migration.

## Overview

WordPress sites typically have hundreds or thousands of media files. Unpress offers three modes to handle these files:

1. **Local Download** - Download media to your `site/` folder
2. **Reupload** - Upload media to S3 or SFTP with automatic URL replacement
3. **Leave URLs** - Keep original media URLs unchanged

Choose the mode that best fits your use case:
- **Cost savings** → Use Reupload (S3 is cheap)
- **Archival** → Use Leave URLs (preserve original structure)
- **Simple migration** → Use Local Download (easiest setup)

## Mode 1: Local Download

Download media files from WordPress to your local `site/` folder and update URLs in Markdown to point to these local files.

### When to Use

- Quick migration with minimal setup
- Want to keep media with your site files
- Media files are small (under 100MB total)
- Deploying to platforms that support local files (Netlify, Vercel)

### How to Enable

Add `--download-media` flag to your migration command:

```bash
unpress \
  --wp-url https://your-site.com \
  --wp-user admin \
  --wp-app-password "abcd efgh ijkl mnop qrst" \
  --download-media \
  --generate-site
```

### What Happens

1. Unpress scans migrated Markdown files for media URLs
2. Downloads each media file to `site/media/` folder
3. Updates URLs in Markdown to point to local files:
   - **Before:** `![image](https://your-site.com/wp-content/uploads/2024/01/image.jpg)`
   - **After:** `![image](/media/uploads/2024/01/image.jpg)`

### Output Structure

```
site/
├── media/
│   └── uploads/
│       ├── 2024/
│       │   ├── 01/
│       │   │   ├── image.jpg
│       │   │   └── document.pdf
│       │   └── 02/
│       │       └── photo.png
│       └── ...
├── content/
│   └── posts/
│       └── 2024-01-15-post.md
```

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Easiest setup—no external accounts | ❌ Increases site size (media included) |
| ✅ Works offline after download | ❌ Longer deployment time |
| ✅ No ongoing costs | ❌ May hit file size limits on free hosting |
| ✅ Simple URL structure | ❌ Must redeploy to update media |

### Troubleshooting

**Media files not downloading:**
- Check if WordPress media URLs are accessible
- Verify your internet connection is stable
- Look for error messages in migration output

**Broken image links in deployed site:**
- Ensure `site/media/` folder was deployed
- Check file permissions on media files
- Verify URL paths in Markdown are correct

## Mode 2: Reupload to S3

Upload media files to Amazon S3 (or S3-compatible storage) and automatically update URLs in Markdown.

### When to Use

- Large media libraries (100MB+)
- Want CDN performance and cheap storage
- Deploying to platforms with file size limits
- Want scalable, reliable media hosting

### Prerequisites

1. **AWS Account** - Create account at [aws.amazon.com](https://aws.amazon.com/)
2. **S3 Bucket** - Create bucket to store media files
3. **AWS Credentials** - Get Access Key ID and Secret Access Key

### Step 1: Create S3 Bucket

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3**
3. Click **Create bucket**
4. Enter bucket name (globally unique, e.g., `my-site-media-2024`)
5. Choose AWS Region (closest to your users)
6. Configure settings:
   - **Block Public Access settings**: Off (to allow public media)
   - **Bucket Policy**: Add policy to allow public read access

### Step 2: Set Bucket Policy (Public Read)

In your S3 bucket, go to **Permissions → Bucket Policy** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Replace `your-bucket-name` with your actual bucket name.

### Step 3: Get AWS Credentials

1. Go to **IAM → Users** in AWS Console
2. Create new user with **Programmatic access**
3. Attach policy: `AmazonS3FullAccess` (or create custom policy for your bucket)
4. Save Access Key ID and Secret Access Key (you won't see Secret Access Key again!)

### Step 4: Configure Unpress for S3

Create a config file `unpress.yml`:

```yaml
source:
  type: api
  api:
    baseUrl: https://your-site.com

media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: your-bucket-name
      region: us-east-1
      endpoint: https://s3.amazonaws.com
```

### Step 5: Set Environment Variables

Set your AWS credentials as environment variables:

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=us-east-1
```

::: warning Never commit credentials!
Never commit AWS credentials to Git or share them publicly. Use environment variables or secret management tools.
:::

### Step 6: Run Migration

```bash
unpress \
  --config unpress.yml \
  --generate-site
```

Unpress will:
1. Download media from WordPress (to temporary folder)
2. Upload each file to your S3 bucket
3. Update URLs in Markdown to point to S3:
   - **Before:** `![image](https://your-site.com/wp-content/uploads/2024/01/image.jpg)`
   - **After:** `![image](https://your-bucket.s3.amazonaws.com/uploads/2024/01/image.jpg)`

### What Gets Uploaded

- Images (JPG, PNG, GIF, SVG, WebP)
- Videos (MP4, WebM, MOV)
- Documents (PDF, DOC, DOCX)
- Audio files (MP3, WAV, OGG)

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Cheap storage (~$0.023/GB/month) | ❌ Requires AWS account and setup |
| ✅ Fast CDN via CloudFront (optional) | ❌ Must manage AWS credentials |
| ✅ Scales to any size | ❌ Has ongoing AWS costs |
| ✅ Faster site deployment (media not included) | ❌ External dependency on S3 |
| ✅ Better performance with CDN | ❌ More complex than local download |

### Troubleshooting

**"Access Denied" error:**
- Check AWS credentials are correct
- Verify bucket policy allows public read access
- Ensure IAM user has S3 permissions
- Check bucket name and region match your config

**"Bucket not found" error:**
- Verify bucket name is correct (case-sensitive)
- Check bucket is in the correct region
- Ensure bucket exists and you have access

**"Connection timeout":**
- Check your internet connection
- Verify S3 endpoint URL is correct for your region
- Try increasing timeout (adjust in config if needed)

### Optional: Use CloudFront CDN

For even better performance, set up CloudFront CDN in front of your S3 bucket:

1. Go to **CloudFront** in AWS Console
2. Create distribution with S3 bucket as origin
3. Update `unpress.yml` with CloudFront domain:

```yaml
media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: your-bucket-name
      region: us-east-1
      endpoint: https://your-cloudfront-id.cloudfront.net
```

URLs will point to CloudFront (faster, lower latency).

## Mode 3: Reupload to SFTP

Upload media files to SFTP server and automatically update URLs in Markdown.

### When to Use

- Existing SFTP hosting for media
- Want to use your own server for media
- Deploying to platforms that can't handle large media
- Prefer complete control over media hosting

### Prerequisites

1. **SFTP Server** - Server with SFTP access enabled
2. **SFTP Credentials** - Host, port, username, password/key
3. **Directory Path** - Path where media should be uploaded

### Step 1: Configure Unpress for SFTP

Create a config file `unpress.yml`:

```yaml
source:
  type: api
  api:
    baseUrl: https://your-site.com

media:
  mode: reupload
  reupload:
    driver: sftp
    sftp:
      host: your-server.com
      port: 22
      username: your-username
      password: your-password
      path: /var/www/media
```

### Step 2: Set Environment Variables (Optional)

You can also set SFTP credentials via environment variables:

```bash
export SFTP_HOST=your-server.com
export SFTP_PORT=22
export SFTP_USERNAME=your-username
export SFTP_PASSWORD=your-password
export SFTP_PATH=/var/www/media
```

### Step 3: Run Migration

```bash
unpress \
  --config unpress.yml \
  --generate-site
```

Unpress will:
1. Download media from WordPress (to temporary folder)
2. Upload each file to your SFTP server
3. Update URLs in Markdown to point to SFTP:
   - **Before:** `![image](https://your-site.com/wp-content/uploads/2024/01/image.jpg)`
   - **After:** `![image](https://your-server.com/media/uploads/2024/01/image.jpg)`

### SFTP Authentication Options

#### Password Authentication

```yaml
sftp:
  host: your-server.com
  username: your-username
  password: your-password
```

#### SSH Key Authentication (Recommended)

```yaml
sftp:
  host: your-server.com
  username: your-username
  privateKey: /path/to/private/key.pem
  passphrase: your-passphrase  # Optional
```

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Use your existing server | ❌ Requires server setup and maintenance |
| ✅ Full control over media hosting | ❌ Must manage server credentials |
| ✅ Can use any SFTP server | ❌ Server performance impacts media delivery |
| ✅ No external service costs | ❌ Scalability depends on your server |
| ✅ Faster site deployment | ❌ More complex than local download |

### Troubleshooting

**"Connection refused" error:**
- Verify SFTP port is correct (default: 22)
- Check if SFTP service is enabled on your server
- Ensure firewall allows SFTP connections
- Verify hostname resolves correctly

**"Authentication failed" error:**
- Check username and password/SSH key are correct
- Verify SSH key format is supported (PEM format)
- Test SFTP connection manually: `sftp your-server.com`

**"Permission denied" error:**
- Check if upload path exists and is writable
- Verify user has write permissions on target directory
- Check directory ownership and permissions

## Mode 4: Leave URLs

Keep original WordPress media URLs unchanged. This is the simplest mode and ideal for archival.

### When to Use

- **Archival** - Preserve original structure and links
- **Minimal migration** - Want simplest possible setup
- **Existing CDN** - WordPress already uses CDN for media
- **Cost savings** - Don't want to move media

### How to Enable

Create a config file `unpress.yml`:

```yaml
media:
  mode: leave
```

Or use CLI flag (though config is recommended for consistency):

```bash
unpress \
  --wp-url https://your-site.com \
  --wp-user admin \
  --wp-app-password "abcd efgh ijkl mnop qrst" \
  --generate-site
```

Default behavior (if no media config) is to leave URLs unchanged.

### What Happens

Unpress does **not** download or upload media. Media URLs in Markdown remain as they were in WordPress:

```markdown
![image](https://your-site.com/wp-content/uploads/2024/01/image.jpg)
```

Your new site will continue loading media from your WordPress server.

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Easiest setup—no changes to media | ❌ Depends on WordPress server remaining online |
| ✅ Fastest migration—no media processing | ❌ No performance improvement for media |
| ✅ No external service needed | ❌ Can't delete WordPress server |
| ✅ Minimal site size | ❌ No cost savings from media hosting |
| ✅ Preserves original URLs | ❌ Media delivery speed unchanged |

### When This Fails

**Problem:** WordPress server is offline or media is deleted.

**Solution:** Your new site will show broken image links. To fix this:
1. Migrate again using Local Download or Reupload mode
2. Or manually restore WordPress server/media files

### Use Case: Archival Migration

For archival scenarios, this mode is ideal because:
- Preserves original structure exactly
- No risk of losing media if WordPress is archived properly
- Minimal migration effort
- Maintains historical accuracy

However, ensure your WordPress media is properly archived:
- Backup media files to reliable storage
- Consider using Wayback Machine or archive.org for public sites
- Document media structure for future reference

## Choosing the Right Mode

### Decision Flowchart

```
Do you want to move media?
├─ No → Use "Leave URLs" (easiest)
└─ Yes
   ├─ Want simplest setup?
   │  └─ Yes → Use "Local Download"
   └─ Want best performance/cost?
      ├─ Have AWS account?
      │  └─ Yes → Use "Reupload to S3"
      └─ Have SFTP server?
         └─ Yes → Use "Reupload to SFTP"
```

### Comparison Table

| Mode | Setup Difficulty | Performance | Cost | Best For |
|------|-----------------|-------------|-------|-----------|
| **Local Download** | ⭐ Easy | ⭐⭐⭐ Good | $0 | Small sites, quick migration |
| **Reupload to S3** | ⭐⭐⭐ Complex | ⭐⭐⭐⭐ Excellent | $0.023/GB/mo | Large sites, CDN performance |
| **Reupload to SFTP** | ⭐⭐ Medium | ⭐⭐⭐ Good | $0 (server cost) | Existing server, full control |
| **Leave URLs** | ⭐ Easiest | ⭐⭐ Fair | $0 | Archival, minimal migration |

### Recommendations

**For cost savings:**
- Use Reupload to S3 (cheapest storage at scale)
- Local Download works for small sites (< 100MB media)

**For archival:**
- Use Leave URLs (preserve original structure)
- Ensure WordPress media is properly backed up

**For performance:**
- Use Reupload to S3 + CloudFront CDN (fastest)
- Reupload to fast SFTP server with caching

**For simplicity:**
- Use Leave URLs (no changes needed)
- Local Download if you want media with your site

## Next Steps

After configuring media handling:

1. **[Generated Site Guide](./generated-site.md)** - Understand your output structure
2. **[Deployment Guide](./deployment.md)** - Deploy your site (consider media mode!)
3. **[WordPress API Migration](./migration-api.md)** - Run migration with media config
4. **[XML Export Migration](./migration-xml.md)** - Use XML with media reupload
