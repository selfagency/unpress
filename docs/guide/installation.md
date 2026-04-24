# Installation

Unpress is designed to run without global installation. In most cases you should use `pnpx` or `npx` and let the tool read credentials from a local `.env` file.

## Prerequisites

Before using Unpress, ensure you have:

- **Node.js 18 or higher** - Download from [nodejs.org](https://nodejs.org/)
- **pnpm** package manager (optional) if you prefer `pnpx`

::: tip No installation required!
Unpress runs directly with `pnpx` or `npx`. Just have Node.js installed and you're ready to go.
:::

## Recommended workflow

### 1. Create a `.env` file

Create a `.env` file in the directory where you plan to run Unpress:

```dotenv
WP_URL=https://your-wordpress-site.com
WP_USER=your-wordpress-username
WP_APP_PASSWORD=your-wordpress-application-password
```

Unpress loads this file automatically via `dotenv`, so you do not need to export variables manually for the common case.

### 2. Run Unpress with `pnpx`

```bash
pnpx @selfagency/unpress --generate-site
```

### 3. Or run with `npx`

```bash
npx -y @selfagency/unpress --generate-site
```

### 4. Override values only when necessary

You can still pass flags explicitly. Flags override `.env` values.

```bash
pnpx @selfagency/unpress --out-dir ./out --download-media
```

## `pnpx` vs `npx`

Both approaches work:

- `pnpx @selfagency/unpress ...` if you already use pnpm
- `npx -y @selfagency/unpress ...` if you use the default npm tooling

Choose one and keep the docs, scripts, and examples consistent in your project.

## Verify the command works

If you want to confirm the published package can execute:

```bash
pnpx @selfagency/unpress --help
# or
npx -y @selfagency/unpress --help
```

## Working with `.env`

The tool reads these values automatically:

- `WP_URL`
- `WP_USER`
- `WP_APP_PASSWORD`
- `DOWNLOAD_MEDIA`

Optional Meilisearch-related values can also live in `.env`:

- `MEILI_HOST`
- `MEILI_API_KEY`
- `MEILI_INDEX`

Example:

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
DOWNLOAD_MEDIA=true
MEILI_HOST=http://127.0.0.1:7700
MEILI_INDEX=posts
```

## When to clone the repo instead

Clone the repo only if you are developing Unpress itself, debugging locally, or contributing changes.

```bash
git clone https://github.com/selfagency/unpress.git
cd unpress
pnpm install
pnpm build
pnpm dev:cli -- --generate-site
```

That workflow is for maintainers and contributors, not the normal migration path.

## Troubleshooting

### `pnpx: command not found`

Install pnpm or use `npx` instead.

```bash
npx -y @selfagency/unpress --help
```

### `.env` values are not being picked up`

Check that:

- the file is named exactly `.env`
- you run `pnpx`/`npx` from the same directory as `.env`
- variable names are uppercase and spelled correctly
- there are no extra quotes around the whole line

### I want a repeatable command for a team

Use a committed `README` snippet plus a non-committed local `.env`. If you need shared defaults, add a tracked `.env.example` and keep real secrets in `.env`.

## Next Steps

After confirming `pnpx` or `npx` works:

1. **[Quick Start Guide](./quick-start.md)** - Run your first migration
2. **[WordPress API Migration](./migration-api.md)** - Learn about API-based migration
3. **[XML Export Migration](./migration-xml.md)** - Use WordPress export files
4. **[Configuration Reference](../reference/cli-flags.md)** - All CLI flags and options
