<div align="center">

# DevPulse
### An Engineering-Grade Learning Platform from Web Foundations to Blockchain Architecture

**Built with precision by MIC Development Dept, Team 5 (2026–2027)**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2_App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Token_Driven-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests_Passed-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA-10B981?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

[Live Demo](#) • [Curriculum Blueprint](#-curriculum-blueprint) • [Interactive DAG Visualizer](#-interactive-git-visualizer) • [API Contracts](docs/api-contracts.md) • [Design System](DESIGN.md)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Curriculum Blueprint](#curriculum-blueprint)
- [Core Architectural Highlights](#core-architectural-highlights)
  - [Interactive Git Visualizer](#interactive-git-visualizer)
  - [Server-Scored Quiz Engine (80% Gate)](#server-scored-quiz-engine-80-gate)
  - [High-Craft MDX Reader](#high-craft-mdx-reader)
  - [Curated Free Certificates Directory](#curated-free-certificates-directory)
- [Design Tokens & Motion Principles](#design-tokens--motion-principles)
- [Project Directory Structure](#project-directory-structure)
- [Data Layer & Contract Boundaries](#data-layer--contract-boundaries)
- [Quick Start & Local Setup](#quick-start--local-setup)
- [Verification & Test Suites](#verification--test-suites)
- [Accessibility & Keyboard Navigation](#accessibility--keyboard-navigation)
- [Team Structure & Ownership](#team-structure--ownership)
- [License](#license)

---

## Overview

**DevPulse** is a learning platform taking students through a rigorous three-stage trajectory:
1. **Web Foundations** (the physical internet, TCP/TLS, HTTP/3, Unix, and Git object internals)
2. **Full-Stack Systems** (modern TypeScript, React Fiber reconciliation, Next.js streaming, PostgreSQL ACID transactions, and auth)
3. **Blockchain & Web3** (cryptographic primitives, Ethereum Virtual Machine opcodes, Solidity design patterns, and smart contract auditing)

Unlike legacy platforms that rely on passive 40-hour video autoplay loops and click-through completions, DevPulse is built on **active retrieval**, **living DAG simulation**, and **verifiable server-side mastery gates**.

---

## Curriculum Blueprint

| Track | Signature Accent | Modules | Est. Hours | Reference Focus & Milestones |
| :--- | :--- | :---: | :---: | :--- |
| **Track 0: Web Foundations** | **Mint** (`#5EEAD4`) | 6 | 18 hrs | **Internet, TCP/TLS, HTTP in Depth, Dev Env, Git Basics, GitHub Essentials**.<br />*Featured Reference*: Module 0.5 embeds the interactive in-browser Git DAG Visualizer. |
| **Track 1: Full-Stack Dev** | **Electric Blue** (`#8AB4FF`) | 9 | 42 hrs | **HTML/CSS/JS, Modern TypeScript, React Internals, Next.js RSC, APIs & REST, CORS & Security, PostgreSQL, Auth, Production Capstone**.<br />*Featured Reference*: Module 1.3 details React Fiber work loops and concurrent transitions. |
| **Track 2: Blockchain & Web3** | **Warm Amber** (`#F5B14C`) | 8 | 36 hrs | **Blockchain Concepts, Cryptography & Wallets, EVM Architecture, Solidity Patterns, Foundry Tooling, Full dApp, Smart Contract Security, Capstone dApp**. |

---

## Core Architectural Highlights

### Interactive Git Visualizer
Embedded directly into lesson flows and available standalone on the landing page:
- **Live DAG Rendering**: Visualizes commit nodes, parent hashes, branch labels, and `HEAD` pointer movements in real-time SVG.
- **Plumbing & Porcelain Engine**: Simulates `git commit`, `git branch`, `git checkout` / `git switch`, `git merge` (3-way merge commits), and `git reset`.
- **Integrated Terminal**: Includes an interactive shell with error states and autocompletion tips.

### Server-Scored Quiz Engine (80% Gate)
- **Zero Client-Side Grading**: Answers are never exposed in DOM or client bundles. Questions are stripped of answer keys upon retrieval.
- **Configurable Pass Mark**: Reads threshold dynamically from server configuration (`passPercentage = 80`).
- **Remediation & Shuffled Retries**: Failing attempts generate targeted concept breakdowns with explanatory guides for missed topics.
- **Automatic Unlocking**: Passing an attempt triggers celebratory confetti and unlocks the next module in the sequence.

### High-Craft MDX Reader
- **Zero-CLS Reading Progress Bar**: Smooth viewport scroll tracking using GPU-accelerated `transform: scaleX(...)`.
- **Sticky Scroll-Spy TOC**: Automatically tracks active section headers (`#learning-goals`, `#core-concept`, `#interactive-tool`, `#worked-example`, `#common-mistakes`, `#practice-task`, `#summary`, `#citations`).
- **Shiki Syntax Code Blocks**: Dark ink theme with copy-to-clipboard feedback, line numbers, line highlighting, and collapsible solution blocks.
- **Curated Video Cards**: Embedded YouTube players featuring creator credits, Creative Commons license badges, and clickable chapter timestamps.
- **Private Autosaved Study Notes**: Persistent local notes drawer with real-time saving status indicators.
- **One-Click Cheat Sheet Export**: Downloadable Markdown cheat sheets summarizing commands and idioms.

### Curated Free Certificates Directory
- Multi-dimensional filtering across categories (**Web**, **Cloud**, **Git**, **Security**, **Blockchain**, **AI**), difficulty, and cost.
### Gamified Engineering Learning System
- **10-Tier XP & Level Progression**: From *Level 1: Initiate* through *Explorer*, *Builder*, *Developer*, *Engineer*, *Architect*, *Protocol Expert*, *Chain Builder*, *Auditor*, to *Level 10: MIC Graduate*.
- **Telemetry Navbar HUD**: Real-time animated level badge, XP progress bar with glow pulses, active route indicators, and animated streak flame counter.
- **Daily Missions & Cohort Leaderboard**: Interactive daily objectives and real-time cohort benchmarking with instant XP gain feedback.
- **16-Week Learning Heatmap**: Visual activity timeline tracking daily lessons, DAG simulations, and quiz attempts with interactive date tooltips.
- **Kinetic Learning Trail**: Dynamic learning pathway with glowing active nodes, completed checkmarks, lock requirements, and progress fill animations.
- **Celebration & Mastery Feedback**: Multi-stage particle confetti bursts, XP gain toasts, and targeted concept reviews for unmastered quiz questions.

---

## Design Tokens & Motion Principles

DevPulse adheres to an Awwwards / Apple Design Award / Linear-grade craft standard:

- **Midnight Ground Palette**: Deep `#0A0B10` canvas ground, `#12141D` card surfaces (`--card`), and `rgba(255, 255, 255, 0.08)` hairline borders.
- **Tri-Track Color Hierarchy**:
  - `Track 0 (Web Foundations)`: Mint (`#5EEAD4`) — Glow: `rgba(94, 234, 212, 0.25)`
  - `Track 1 (Full-Stack Systems)`: Electric Blue (`#8AB4FF`) — Glow: `rgba(138, 180, 255, 0.25)`
  - `Track 2 (Blockchain & Web3)`: Warm Amber (`#F5B14C`) — Glow: `rgba(245, 177, 76, 0.25)`
- **Typography Cadence**: Space Grotesk (headings with `-0.03em` tracking), Inter (variable body), JetBrains Mono (code and commit hashes).
- **MIC 26-27 Hexagonal Heritage**: Hexagonal badge icons, path nodes, and subtle background textures honoring the team emblem.
- **Motion Budget**: Spring physics (`stiffness: 400, damping: 28`), 60fps execution, zero layout shifts (`CLS = 0`), and complete `prefers-reduced-motion` compliance.

*For complete token maps and design usage rules, read [DESIGN.md](DESIGN.md).*

---

## Project Directory Structure

```text
DevPulse/
├── docs/
│   └── api-contracts.md         # Typed REST API contracts for M1 (Backend) & M3 (Quiz)
├── public/                      # Static brand assets and favicons
├── scripts/
│   ├── capture-in-process.mjs   # In-process Next.js + Playwright screenshot engine
│   └── capture-visuals.mjs      # Multi-viewport visual verification suite
├── src/
│   ├── app/
│   │   ├── api/                 # Typed API routes (/tracks, /certificates, /quiz/submit)
│   │   ├── certificates/        # Filterable free certification directory
│   │   ├── dashboard/           # Student progress, resume card, 52-week heatmap
│   │   ├── learn/               # Curriculum overview
│   │   │   └── [track]/         # Track learning trail & module reader / quiz pages
│   │   ├── login/ & signup/     # Typed auth interface with 1-click demo login
│   │   ├── profile/             # Student achievements, badges, academic transcript
│   │   ├── storybook/           # Interactive in-app Design System component gallery
│   │   ├── error.tsx            # Dedicated 500 runtime error boundary
│   │   ├── layout.tsx           # Global shell with theme provider and fonts
│   │   ├── not-found.tsx        # Dedicated 404 coordinates recovery page
│   │   └── page.tsx             # Cinematic hero showcase landing page
│   ├── components/
│   │   ├── brand/               # MIC hexagonal logo and emblems
│   │   ├── global/              # CommandPalette (⌘K), ShortcutsModal (?)
│   │   ├── interactive/         # Interactive Git DAG Visualizer
│   │   ├── landing/             # 60fps HeroCanvas constellation
│   │   ├── layout/              # Navbar, Footer, ThemeToggle, ClientShell
│   │   ├── quiz/                # QuizPlayer shell, QuizResultView
│   │   ├── reader/              # TableOfContents, ReadingProgress, Callout, CodeBlock, VideoCard
│   │   ├── trail/               # LearningTrail, Hex Node markers
│   │   └── ui/                  # Button, Card, Badge, ProgressRing, ProgressBar, Dialog, Tabs, Toast
│   ├── lib/
│   │   ├── api/                 # Typed client adapter (Mock + Live HTTP swappable)
│   │   ├── contracts/           # Strict Zod schemas for all domain entities
│   │   ├── data/                # Seed data for tracks, modules, quiz banks, and certs
│   │   └── utils.ts             # Tailwind class merge (clsx + twMerge)
│   ├── stories/                 # Storybook story definitions
│   └── styles/
│       └── globals.css          # Semantic CSS variables, aurora mesh, hex grid
├── tests/
│   ├── e2e/                     # Playwright end-to-end tests (critical user flows)
│   └── unit/                    # Vitest unit tests (scoring logic & Zod contracts)
├── CONTRIBUTING.md               # Engineering guidelines & Git rules
├── DESIGN.md                     # Comprehensive design system & craft guide
├── tailwind.config.ts           # Token-driven Tailwind configuration
├── tsconfig.json                # Strict TypeScript configuration
└── vitest.config.ts             # Vitest test runner configuration
```

---

## Data Layer & Contract Boundaries

DevPulse enforces strict typed boundaries via **Zod schemas** in [`src/lib/contracts/index.ts`](src/lib/contracts/index.ts):
- `TrackSchema`, `ModuleMetaSchema`, `SourceCitationSchema`, `EmbeddedVideoSchema`
- `QuizQuestionSchema`, `QuizSubmissionSchema`, `QuizResultSchema`, `TopicBreakdownSchema`
- `CertificateResourceSchema`, `UserProfileSchema`, `BadgeSchema`

### Swappable API Client Adapter
All UI surfaces consume data through the [`ApiClient`](src/lib/api/api-client.ts) interface:
```typescript
import { api } from "@/lib/api/api-client";

// Retrieve curriculum tracks
const tracks = await api.getTracks();

// Submit quiz for server-side evaluation (never graded client-side)
const result = await api.submitQuiz({ moduleId, answers });
```

*For complete endpoint specifications, request payloads, and status codes for M1 and M3, refer to [docs/api-contracts.md](docs/api-contracts.md).*

---

## Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v24)
- **Package Manager**: npm v9+ or pnpm v8+

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/MIC-Development-Org/DevPulse.git
cd DevPulse

# 2. Check out your feature branch
git checkout feature/ishan-task

# 3. Create your local environment file
cp .env.example .env.local

# 4. Install dependencies
npm install

# 5. Launch the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Test Suites

DevPulse maintains a dual-test pyramid with **Vitest** for domain logic and **Playwright** for end-to-end browser flows:

```bash
# Run unit & contract validation tests (Vitest)
npm run test

# Run critical flow end-to-end integration tests (Playwright)
npm run test:e2e

# Run production build and static page generation
npm run build
```

### Verified Test Summary
- **Unit Tests**: 8/8 tests passing across quiz scoring algorithms, 80% pass threshold verification, and Zod contract boundary validation.
- **End-to-End Tests**: 5/5 Playwright tests passing across landing navigation, track trail node display, MDX reader interactions, quiz keyboard navigation, and certificate filtering.
- **Production Build**: 15/15 routes compiled with zero TypeScript warnings.

---

## Accessibility & Keyboard Navigation

DevPulse is engineered to achieve **WCAG 2.2 AA compliance**:
- **Contrast Ratios**: Minimum 4.5:1 for body copy; 7:1 for display titles.
- **Touch Target Sizing**: Minimum $44 \times 44\text{px}$ touch targets across all interactive buttons, segmented tabs, and links.
- **Screen Reader Semantics**: Complete ARIA roles (`role="progressbar"`, `role="alert"`, `aria-selected`, `aria-live`).
- **Keyboard Shortcuts**:
  - `⌘K` / `Ctrl+K`: Open global command search
  - `?`: Open keyboard shortcuts cheat sheet
  - `1`, `2`, `3`, `4`: Select quiz options directly
  - `Enter`: Confirm selection & advance to next question
  - `H`: Toggle question hint reveal
  - `R`: Open quiz review before submission
  - `Esc`: Close any open drawer, modal, or palette

---

## Team Structure & Ownership

DevPulse is developed by **MIC Development Dept, Team 5 (2026–2027)**:

| Member | Role | Ownership Area |
| :--- | :--- | :--- |
| **M1** | Backend Lead | PostgreSQL schema, auth integration, sessions, cloud deployment |
| **M2** | **Frontend Lead** | Design system, UI components, layouts, MDX engine, Git visualizer, modules 1.1/1.3/1.4 |
| **M3** | Quiz Engine Lead | Question banks, shuffle algorithms, server-side grading endpoints |
| **M4** | Blockchain Content Lead | Web3 curriculum, EVM architecture, Solidity contracts, auditing guides |
| **M5** | Content QA & Certifications | Curated free certifications data, editorial QA, accessibility review |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
<sub>Crafted with award-level care by MIC Development Dept, Team 5 • 2026–2027</sub>
</div>
