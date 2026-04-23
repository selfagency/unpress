---
# unpress-tokl
title: Project scaffolding & CLI
status: completed
type: epic
priority: high
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T02:55:55Z
parent: unpress-9vhq
blocking:
    - unpress-w3ga
    - unpress-ammp
    - unpress-erf0
    - unpress-pri5
---

Implements CLI entrypoint, argument parsing, interactive prompts, env var loading, and input validation for the migration utility.

## Features

- TypeScript project scaffolding
- CLI with cac
- Interactive prompts with @inquirer/prompts
- Env var support (dotenv)
- Input validation/sanitization

## Tasks

- [ ] Scaffold TypeScript project with CLI entrypoint (`bin/cli.ts`)
- [ ] Set up `package.json` with npx-executable config (bin field, build scripts)
- [ ] Implement CLI argument parsing with `cac`
- [ ] Implement interactive prompt fallback with `@inquirer/prompts`
- [ ] Support env var loading for credentials (dotenv)
- [ ] Validate and sanitize all user input
