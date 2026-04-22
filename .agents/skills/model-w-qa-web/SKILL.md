---
name: model-w-qa-web
description:
    Quality assurance (lint, format, test) for the SvelteKit web component.
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

## Quality Assurance Workflow

All code must pass linting, type checking, and formatting before being
committed.

### Linting and Type Checking

Run the standard SvelteKit check:

```bash
pnpm check
```

### Formatting

This project typically uses Prettier. Ensure your editor is configured to format
on save, or run:

```bash
pnpm exec prettier --write .
```

### Production Build Verification

Always verify that the project builds correctly:

```bash
pnpm build
```

### Testing

If Vitest is configured, run tests using:

```bash
pnpm test
```
