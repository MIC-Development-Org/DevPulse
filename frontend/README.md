# DevPulse

An engineering-grade learning platform that takes students from web fundamentals to full-stack systems and blockchain architecture, built on active retrieval, interactive simulation, and verifiable server-side mastery gates.

[![Next.js 14](https://img.shields.io/badge/next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.4-38BDF8)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-729B1B)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/e2e-playwright-2EAD33)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Curriculum](#curriculum)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Data Layer and API Contracts](#data-layer-and-api-contracts)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

DevPulse is a self-paced learning platform for software engineering topics. It delivers a structured, three-track curriculum that spans the low-level mechanics of the internet, the internals of modern full-stack tooling, and the architecture of blockchain systems:

1. **Web Foundations** — the physical internet, TCP and TLS, HTTP in depth, Unix fundamentals, and Git object internals.
2. **Full-Stack Systems** — modern TypeScript, React and its fiber reconciliation model, Next.js server components and streaming, PostgreSQL transactions, and authentication.
3. **Blockchain and Web3** — cryptographic primitives, Ethereum Virtual Machine opcodes, Solidity design patterns, and smart contract auditing.

The platform is designed around three principles that distinguish it from passive, video-first courses:

- **Active retrieval.** Progress is validated by server-scored assessments, not video watch-time or click-through checkpoints.
- **Interactive simulation.** Core concepts are taught through runnable, in-browser tools such as a live Git directed-acyclic-graph visualizer.
- **Verifiable mastery.** Advancement through the curriculum is gated by scored quizzes evaluated on the server with configurable pass thresholds.

---

## Key Features

### Interactive Git Visualizer

An in-browser simulation of a Git repository's internal object graph, embedded directly into lesson flows:

- Live rendering of commit nodes, parent hashes, branch labels, and `HEAD` pointer movement as animated SVG.
- A working plumbing-and-porcelain engine that simulates `git commit`, `git branch`, `git checkout` and `git switch`, `git merge` (computing real three-way merge commits), and `git reset`.
- An integrated terminal input with contextual error states and autocompletion hints.

### Server-Scored Quiz Engine

- **No client-side grading.** Answer keys are stripped from questions before they reach the browser bundle; correctness is evaluated only on the API routes in `src/app/api`.
- **Configurable pass mark.** The pass threshold (default 80 percent) is read from server configuration per module.
- **Structured remediation.** Failed attempts return a per-topic breakdown with explanatory guidance for missed concepts.
- **Sequential unlocking.** Passing a module quiz unlocks the next module and its accompanying content.

### Learning Reader

A purpose-built reading experience for technical curriculum:

- Zero-layout-shift reading progress bar driven by GPU-accelerated transforms.
- Sticky, scroll-synchronized table of contents for each lesson section.
- Shiki-based syntax highlighting in code blocks with copy-to-clipboard feedback, line numbers, and collapsible solution regions.
- Embedded video cards with creator attribution, license badges, and timestamped chapters.
- Locally persisted study notes with real-time save status, plus downloadable Markdown cheat sheets per module.

### Certifications Directory

A curated, filterable directory of free certification programs across web development, cloud, Git, security, blockchain, and AI, filterable by category, difficulty, and cost.

### Gamification

- Ten-level experience progression with a named ladder from Initiate to graduate level.
- Live progress HUD in the navigation bar with XP bar, level badge, and current route indication.
- Daily missions, a cohort leaderboard, and a sixteen-week activity heatmap.
- An animated learning trail that communicates node state: completed, active, or locked.

---

## Curriculum

| Track | Focus | Modules | Estimated Hours |
| :--- | :--- | :---: | :---: |
| 0 — Web Foundations | Internet, TCP/TLS, HTTP in depth, development environment, Git and GitHub essentials | 6 | 18 |
| 1 — Full-Stack Dev | HTML/CSS/JS, TypeScript, React internals, Next.js server components, REST APIs, security, PostgreSQL, authentication, production capstone | 9 | 42 |
| 2 — Blockchain and Web3 | Blockchain concepts, cryptography and wallets, EVM architecture, Solidity patterns, tooling, dApp development, smart contract security | 8 | 36 |

Each module follows a consistent structure: learning goals, core concept, an interactive tool or worked example, common mistakes, a practice task, a summary, and cited sources.

---

## Technical Architecture

- **Framework:** Next.js 14 App Router with React 18, installed in the `frontend/` directory of this repository.
- **Language:** TypeScript 5.6 in strict mode.
- **Styling:** Tailwind CSS with a token-driven design system (semantic CSS variables, per-track accent palettes, dark-first theme).
- **Validation:** Zod schemas define the domain model and enforce typed boundaries between data and UI.
- **State:** Server components for data retrieval, client components isolated to interactive surfaces.
- **Data:** Currently seeded from local mock data with a swappable client adapter, ready to be pointed at a live backend without UI changes.
- **Design system:** Documented in [DESIGN.md](DESIGN.md) with a full token map, motion budget (spring physics, 60 fps target, zero cumulative layout shift), and `prefers-reduced-motion` compliance.

An interactive gallery of all design-system components is available in-app at `/storybook` and linked from the site footer.

---

## Project Structure

```
frontend/
├── docs/
│   └── api-contracts.md          # Typed REST API contracts
├── src/
│   ├── app/
│   │   ├── api/                  # API routes: tracks, quiz submission, certificates, profile
│   │   ├── certificates/         # Filterable free certification directory
│   │   ├── dashboard/            # Student progress and activity views
│   │   ├── learn/                # Curriculum overview and module reader/quiz pages
│   │   ├── login/                # Sign-in interface
│   │   ├── profile/              # Student achievements and progress transcript
│   │   ├── signup/               # Account registration
│   │   ├── storybook/            # In-app design system component gallery
│   │   ├── error.tsx             # Runtime error boundary
│   │   ├── layout.tsx            # Global application shell
│   │   ├── not-found.tsx         # 404 page
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── brand/                # Logo and brand assets
│   │   ├── gamification/         # Achievement and toast components
│   │   ├── global/               # Command palette, shortcuts modal, scroll progress
│   │   ├── interactive/          # Git DAG visualizer
│   │   ├── landing/              # Landing page visuals
│   │   ├── layout/               # Navbar, footer, theme system
│   │   ├── quiz/                 # Quiz player and results view
│   │   ├── reader/               # Reader components: TOC, code blocks, callouts, notes
│   │   ├── trail/                # Learning trail visualization
│   │   └── ui/                   # Primitive components: button, card, badge, dialog, tabs, toast
│   ├── lib/
│   │   ├── api/                  # Typed client adapter (mock and live HTTP)
│   │   ├── contracts/            # Zod schemas for all domain entities
│   │   ├── data/                 # Seed data for tracks, modules, quizzes, certificates
│   │   ├── gamification/         # XP and level logic
│   │   ├── shortcut.tsx          # Keyboard shortcut utilities
│   │   └── utils.ts              # Tailwind class merging utilities
│   └── styles/
│       └── globals.css           # Semantic CSS variables and global styles
├── tests/
│   ├── e2e/                      # Playwright end-to-end tests
│   └── unit/                     # Vitest unit tests
├── .env.example                  # Environment variable template
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind and design token configuration
├── tsconfig.json                 # TypeScript configuration (strict)
├── postcss.config.mjs            # PostCSS pipeline
├── playwright.config.ts          # End-to-end test configuration
├── vitest.config.ts              # Unit test configuration
├── package.json                  # Project manifest and scripts
├── CONTRIBUTING.md               # Engineering guidelines
├── DESIGN.md                     # Design system reference
├── LICENSE                       # MIT license
└── README.md                     # This document
```

---

## Data Layer and API Contracts

All domain entities are validated by Zod schemas in [`src/lib/contracts/index.ts`](src/lib/contracts/index.ts), covering tracks, module metadata, source citations, embedded video, quiz questions and results, certificates, user profiles, and badges.

UI surfaces consume data exclusively through the [`ApiClient`](src/lib/api/api-client.ts) interface:

```typescript
import { api } from "@/lib/api/api-client";

const tracks = await api.getTracks();
const result = await api.submitQuiz({ moduleId, answers });
```

Because the adapter is swappable, the application currently runs against seeded mock data (`NEXT_PUBLIC_API_MOCK=true`) and can be switched to a live HTTP backend by configuration alone. Full endpoint specifications, payloads, and status codes are documented in [docs/api-contracts.md](docs/api-contracts.md).

### Environment Variables

Copy `.env.example` to `.env.local` and adjust as needed:

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application |
| `NEXT_PUBLIC_API_MOCK` | `true` serves seeded mock data; `false` uses the live HTTP adapter |
| `NEXT_PUBLIC_APP_ENV` | Runtime environment label |
| `NEXT_PUBLIC_QUIZ_PASS_PERCENTAGE` | Default quiz pass threshold |

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later (20 or newer recommended)
- npm 9 or later

### Installation

All application code lives in the `frontend/` directory:

```bash
# 1. Clone the repository
git clone https://github.com/MIC-Development-Org/DevPulse.git
cd DevPulse/frontend

# 2. Create your local environment file
# (Windows: copy .env.example .env.local)
cp .env.example .env.local

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

### Production Build

```bash
npm run build
npm start
```

---

## Testing

The project maintains a two-tier test pyramid: Vitest for domain logic and Playwright for end-to-end browser flows.

```bash
# Unit and contract tests (Vitest)
npm run test

# Watch mode during development
npm run test:watch

# End-to-end critical-flow tests (Playwright)
npm run test:e2e

# Lint
npm run lint
```

Coverage targets include quiz scoring algorithms and the pass-threshold logic, Zod contract boundary validation, and end-to-end critical flows: navigation, the module reader, quiz interaction and grading, and certificate filtering.

---

## Accessibility

The interface is engineered toward WCAG 2.2 AA compliance:

- Minimum 4.5:1 contrast for body text and 7:1 for display headings.
- Minimum 44 by 44 pixel touch targets for all interactive elements.
- Complete ARIA semantics: progressbar and alert roles, live regions, and selection states.
- Full keyboard operability across navigation, quizzes, palettes, and modals.
- Honor `prefers-reduced-motion` for all animation.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` / `Cmd+K` | Open the global command palette |
| `?` | Open the keyboard shortcuts reference |
| `1`, `2`, `3`, `4` | Select a quiz answer option |
| `Enter` | Confirm selection and advance |
| `H` | Reveal the current question hint |
| `R` | Review answers before submission |
| `Esc` | Close the open palette, modal, or drawer |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the engineering guidelines, workflow conventions, and commit standards used in this repository. In summary:

- Work on a feature branch following the team's naming conventions.
- Keep TypeScript strict mode clean; new code must be fully typed.
- Add or update unit tests for changed domain logic and contracts.
- Run the full test suite and lint locally before opening a pull request.
- Pull requests are reviewed before merging into `main`.

---

## License

DevPulse is released under the [MIT License](LICENSE). You are free to use, modify, and distribute this software in accordance with its terms.
