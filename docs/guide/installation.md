# Installation

Detailed installation instructions for Unpress.

## Prerequisites

Before installing Unpress, ensure you have:

- **Node.js 18 or higher** - Download from [nodejs.org](https://nodejs.org/)
- **pnpm** package manager - Install with:
  ```bash
  npm install -g pnpm
  ```

::: tip Why pnpm?
pnpm is faster and more disk-efficient than npm or yarn. It uses hard links to avoid duplicating packages, saving significant space on your system.
:::

## Installation Options

### Option 1: Global Installation (Recommended)

Install Unpress globally so you can run it from anywhere:

```bash
pnpm install -g @selfagency/unpress
```

After installation, verify it works:

```bash
unpress --version
```

You should see version output like:
```
@selfagency/unpress/0.1.0
```

**Benefits:**
- Run `unpress` from any directory
- Easy to update: `pnpm update -g @selfagency/unpress`
- No need to manage local build artifacts

**When to use:**
- You plan to use Unpress regularly
- You want the simplest workflow
- You're migrating multiple WordPress sites

### Option 2: Local Installation

Install Unpress locally in your project directory:

```bash
# Clone the repository
git clone https://github.com/selfagency/unpress.git
cd unpress

# Install dependencies
pnpm install

# Build the CLI
pnpm build
```

Run Unpress using pnpm:

```bash
pnpm dev:cli -- <flags>
```

**Benefits:**
- Always use the latest version from Git
- Easy to test local changes
- Full control over build process

**When to use:**
- You want to modify Unpress source code
- You need a specific version from Git
- You're contributing to Unpress development

### Option 3: Use with npx (No Install)

Try Unpress without installing globally:

```bash
npx -y @selfagency/unpress -- <flags>
```

**Benefits:**
- No installation required
- Always uses latest version
- Great for one-time migrations

**When to use:**
- Quick test of Unpress
- One-time migration project
- Can't install global packages (restricted environments)

**Drawbacks:**
- Downloads package on every run (slower)
- Uses more network bandwidth
- Not ideal for repeated use

## Verify Installation

After installation, verify Unpress is working:

```bash
# Show version
unpress --version

# Show help
unpress --help
```

If you see version output and help text, installation was successful!

## Troubleshooting Installation

### "command not found: unpress"

**Cause:** Global installation not in your PATH.

**Solutions:**

1. **Restart your terminal** - PATH may update after install
2. **Check pnpm global bin directory:**
   ```bash
   pnpm bin -g
   ```
   Add this path to your system PATH
3. **Use full path to binary:**
   ```bash
   $(pnpm bin -g)/unpress --help
   ```

### "pnpm: command not found"

**Cause:** pnpm not installed or not in PATH.

**Solution:**
```bash
npm install -g pnpm
```

Restart your terminal and try again.

### "EACCES: permission denied" (Global Install)

**Cause:** Don't have write permissions for global directories.

**Solution:** Use a version manager like nvm (Node Version Manager):

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal
# Install Node.js with nvm
nvm install 18

# Set as default
nvm use 18

# Try global install again
pnpm install -g @selfagency/unpress
```

### Build Errors (Local Installation)

**Cause:** TypeScript compilation errors or missing dependencies.

**Solution:**
```bash
# Clean build artifacts
rm -rf dist node_modules

# Reinstall dependencies
pnpm install

# Try building again
pnpm build
```

If errors persist, check:
- Node.js version is 18 or higher: `node --version`
- pnpm version is 8 or higher: `pnpm --version`
- No conflicting packages globally

## Upgrading Unpress

### Global Installation

```bash
# Update to latest version
pnpm update -g @selfagency/unpress

# Verify new version
unpress --version
```

### Local Installation

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pnpm install

# Rebuild
pnpm build
```

### Npx Usage

npx always uses the latest published version. No upgrade needed—just run it again!

## Uninstalling Unpress

### Global Installation

```bash
pnpm remove -g @selfagency/unpress
```

Verify removal:
```bash
unpress --version
# Should show "command not found"
```

### Local Installation

Simply delete the cloned directory:
```bash
cd ..
rm -rf unpress
```

## Next Steps

After installing Unpress:

1. **[Quick Start Guide](./quick-start.md)** - Run your first migration
2. **[WordPress API Migration](./migration-api.md)** - Learn about API-based migration
3. **[XML Export Migration](./migration-xml.md)** - Use WordPress export files
4. **[Configuration Reference](../reference/cli-flags.md)** - All CLI flags and options
