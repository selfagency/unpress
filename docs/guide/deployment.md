# Deployment

Once Unpress has generated your `site/` folder, you can deploy the resulting static site to almost any static host.

## Build the site locally

If you want to build before deploying:

```bash
cd site
npx @11ty/eleventy
```

This creates the `dist/` output folder inside your output directory (e.g., `site/dist/`). Deploy the `dist/` folder to your hosting provider.

## Netlify

Fastest path:

1. generate the site with Unpress
2. build with `npx @11ty/eleventy`
3. upload `site/dist` to Netlify Drop

## Vercel

Good option if you want Git-backed deploys.

1. commit your generated output directory to Git
2. import it into Vercel
3. set the build command to `npx @11ty/eleventy`
4. set the output directory to `dist`

## Cloudflare Pages

Another solid static-hosting option.

1. push the generated output directory to Git
2. connect the repo in Cloudflare Pages
3. use `npx @11ty/eleventy` as the build command
4. use `dist` as the output directory

## GitHub Pages

Works best if you already keep the generated site in Git and are comfortable with a GitHub Actions workflow.

## Media considerations

Your deployment choice should match your media mode:

- local media: deploy the generated media files with the site
- S3 or SFTP reupload: ensure those hosts stay available
- leave URLs: keep the original WordPress media online or archived

## Custom domains

All major static hosts support custom domains and HTTPS. Point your DNS at the host after your first successful deploy.
