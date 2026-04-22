---
name: model-w-update
description: Orchestrate the full Model W version upgrade for the project.
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

## Model W Version Upgrade Procedure

Model W releases happen quarterly. Upgrading involves aligning dependencies and
Docker images with the latest release.

### 1. Identify Target Release

Check the [Model W Releases](https://github.com/model-w/releases) for the latest
version (e.g., `2026.04`).

### 2. Update Web Component

Refer to `model-w-deps-web` skill:

- Update preset packages to the target version.
- Relax other dependencies to `*`.
- Run `pnpm update`.

### 3. Update Infrastructure (Future)

When a `snow.yml` or `Dockerfile` is added:

- Update the base image tag in `Dockerfile` to match the release (e.g.,
  `FROM ghcr.io/model-w/node:2026.04`).

### 4. Verification

Run all QA checks:

- Use `model-w-qa-web` to verify the web component.
- Ensure `pnpm build` completes successfully.
