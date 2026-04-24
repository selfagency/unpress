# Meilisearch

Static sites do not have built-in server-side search. Unpress can index generated posts into Meilisearch so you can add fast search to your 11ty site.

## When to use it

Use Meilisearch if:

- you have enough content that tag archives are not enough
- you want typo-tolerant search
- you want a search index separate from your static files

## Run Meilisearch locally

This repo already includes a Docker Compose example under `docs/meilisearch/`.

```bash
cd docs/meilisearch
docker compose up -d
```

## Configure search settings

Add these values to `.env` if needed:

```dotenv
MEILI_HOST=http://127.0.0.1:7700
MEILI_API_KEY=
MEILI_INDEX=posts
```

## Index generated posts

After you generate the site, run:

```bash
pnpx @selfagency/unpress --out-dir ./out --index-meili
```

Or with `npx`:

```bash
npx -y @selfagency/unpress --out-dir ./out --index-meili
```

If you need to override the host directly:

```bash
pnpx @selfagency/unpress --out-dir ./out --index-meili --meili-host http://127.0.0.1:7700
```

## What gets indexed

Unpress reads generated Markdown files from the posts directory, parses frontmatter, and uploads batches of post documents to Meilisearch.

## Front-end integration

You still need to add a search UI to your 11ty templates. A common pattern is:

1. add a search input to your layout
2. fetch results from your Meilisearch instance with client-side JavaScript
3. render matching post links below the input

## Troubleshooting

- ensure the posts directory exists before indexing
- ensure `MEILI_HOST` points at a live instance
- provide `MEILI_API_KEY` if your instance requires it
- confirm the index name you expect with `MEILI_INDEX`
