---
name: model-w-deps-web
description: Manage dependencies for the SvelteKit web component using pnpm.
license: Proprietary
metadata:
    author: with-madrid.com
---

## The Model W Philosophy

- **Uniform DX**: Django and SvelteKit are the standard. Monorepo structure with
  components in first-level directories.
- **Quarterly Releases**: Versions (e.g., `2026.01`) impose strict "preset"
  packages for Python and Node.
- **Docker Alignment**: Base Docker images match the release number.
- **Convention over Configuration**: `snow.yml` defines the architecture and
  deployment for Kerfufoo.
- **Local First**: Prioritize local dev (no Docker) using local
  PostgreSQL/Redis.
- **Quality**: All checks (lint, format, tests) must pass after every change.

## Dependency Management

This project uses **pnpm** for managing Node.js dependencies.

### Common Commands

- **Install dependencies**: `pnpm install`
- **Add a package**: `pnpm add <package-name>`
- **Add a dev dependency**: `pnpm add -D <package-name>`
- **Remove a package**: `pnpm remove <package-name>`
- **Update all packages**: `pnpm update`

### Model W Update Strategy

When performing a Model W version upgrade:

1. Identify the new release version (e.g., `2026.01`).
2. Update `@model-w/preset-sveltekit` (if present) to the specific release
   version.
3. For all other non-preset dependencies, relax constraints to `*` in
   `package.json`.
4. Run `pnpm update` to pull the latest compatible versions.
5. Fix any breaking changes and ensure all QA checks pass.
