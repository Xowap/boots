# Boots - DORA Maturity Map

Boots is a modern SvelteKit application designed to visualize and assess
organizational maturity through the lens of DORA (DevOps Research and
Assessment) capabilities. It provides an interactive graph-based interface to
understand how different technical and cultural capabilities interrelate and
drive performance.

## Core Features

- **Interactive Maturity Graph**: Visualize DORA capabilities and their causal
  relationships using a dynamic graph powered by Cytoscape.
- **Maturity Studies**: Create and manage multiple "studies" to track maturity
  across different teams, projects, or time periods.
- **Evidence-Based Assessment**: Conduct detailed questionnaires for each
  capability to calculate maturity scores based on industry-standard metrics.
- **Causal Propagation**: See how improvements in core technical capabilities
  (like Continuous Delivery) propagate through the system to influence
  organizational outcomes.
- **Persistence**: Save and clone studies to keep a history of maturity growth.

## Architecture

This project is built as a SvelteKit application using:

- **Svelte 5**: Utilizing the latest runes-based reactivity.
- **Cytoscape.js**: For high-performance graph visualization and layout.
- **Bits UI & Tailwind CSS**: For a polished, accessible user interface.
- **TypeScript**: Ensuring type safety across the assessment logic.

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
pnpm format   # Code formatting via Prettier
```

## Model W Management

This project uses Model W management skills for standardized workflows. If you
are using an agent like OpenCode, you can leverage these specialized skills:

- `model-w-project-structure`: Guidance on the directory layout and tech stack.
- `model-w-deps-web`: Managed pnpm dependency updates.
- `model-w-qa-web`: Comprehensive QA routines.
- `model-w-update`: Quarterly system-wide upgrades.

---

Managed by [Model W](https://with-madrid.com)
