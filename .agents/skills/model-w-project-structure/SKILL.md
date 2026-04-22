---
name: model-w-project-structure
description:
    Map components to directories and explain frameworks for the current Model W
    project.
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

## Project Layout

The project is currently a standalone SvelteKit web application.

- **Root (/)**: SvelteKit web application.
- **`src/`**: Frontend source code.
- **`static/`**: Static assets for the web application.
- **`pnpm-workspace.yaml`**: Defines the pnpm workspace (currently root).

## Frameworks & Tech Stack

- **Frontend**: SvelteKit with TypeScript.
- **Package Manager**: pnpm.
- **Build Tool**: Vite.

## Environment Variables

Local development uses a `.env` file in the root directory. Ensure variables are
prefixed as required by SvelteKit (e.g., `PUBLIC_` for client-side access).
