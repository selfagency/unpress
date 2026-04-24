# Contributing

Thanks for helping improve Unpress.

## Development setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/selfagency/unpress.git
cd unpress
pnpm install
```

Build the package locally:

```bash
pnpm build
```

Run the local CLI during development:

```bash
pnpm dev:cli -- --help
```

## Testing

Run the full test suite:

```bash
pnpm test
```

Run coverage:

```bash
pnpm test:coverage
```

Run a specific test file:

```bash
pnpm test -- tests/e2e-xml-media.test.ts
```

## Linting and formatting

Run code linting:

```bash
pnpm lint
```

Run Markdown linting:

```bash
pnpm lint:md
```

Format the repo:

```bash
pnpm format
pnpm lint:md:fix
```

## Documentation work

Preview docs locally:

```bash
pnpm docs:dev
```

Build docs:

```bash
pnpm docs:build
```

## Environment and fixtures

The published tool is designed to read `.env` automatically. The codebase also uses `.env` during local CLI testing, so create a local `.env` when you need real credentials.

Never commit real secrets. Use placeholder values in examples and docs.

## Pull requests

Keep changes focused.

- update docs when behavior changes
- add or adjust tests for behavior changes
- avoid unrelated refactors in the same PR
- explain the user-facing impact in the PR description

## Reporting issues

When filing a bug, include:

- how you ran Unpress (`pnpx`, `npx`, or local `pnpm dev:cli`)
- whether you used API or XML input
- whether a `.env` file was present
- the command you ran
- the relevant error output

That saves everyone time, including future-you.
