# Boots

A modern SvelteKit application managed with the Model W philosophy.

## Architecture

This project is built as a SvelteKit application using TypeScript and pnpm. While currently a standalone application, it is structured to support growth into a full Model W monorepo.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

### Production Build

Create a production-ready build:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Quality Assurance

We maintain high standards through the following checks:

```bash
pnpm check    # Svelte-check and TypeScript verification
pnpm format   # Formatting via Prettier (pnpm exec prettier --write .)
```

## Model W Management

This project uses Model W management skills for standardized workflows. If you are using an agent like OpenCode, you can leverage these specialized skills:

- `model-w-project-structure`: Guidance on the directory layout and tech stack.
- `model-w-deps-web`: Managed pnpm dependency updates.
- `model-w-qa-web`: Comprehensive QA routines.
- `model-w-update`: Quarterly system-wide upgrades.

---
Managed by [Model W](https://with-madrid.com)
