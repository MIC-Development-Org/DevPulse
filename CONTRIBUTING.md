# Contributing to DevPulse

Thank you for your interest in contributing. This document describes the workflow, standards, and quality gates used by the DevPulse engineering team.

## Repository Layout

The application lives in the `frontend/` directory. All Node.js, npm, build, and test commands must be run from there:

```bash
cd frontend
npm install
```

## Team Structure and Ownership

| Member | Ownership |
| :--- | :--- |
| M1 | Backend, database, authentication, API gateway |
| M2 (Frontend Lead) | Design system, UI components, layouts, content reader, accessibility, Git visualizer |
| M3 | Quiz engine logic and scoring algorithms |
| M4 | Blockchain curriculum and Web3 content |
| M5 | Certifications curation and content QA |

## Development Workflow

1. **Branching.** Create a feature branch from `main` using `feature/<area>-<description>` (for example, `feature/quiz-keyboard-nav`). Do not push directly to `main`; it is protected and accepts changes through pull requests only.
2. **Commit messages.** Follow the Conventional Commits format: `type(scope): description` (for example, `feat(reader): implement sticky scroll-spy TOC`).
3. **Pull requests.** Keep changes focused, describe the motivation and scope, and link related issues. Pull requests are reviewed before merging.

## Pre-Pull-Request Checklist

Run all checks from the `frontend/` directory:

- `npm run lint` passes without warnings
- `npm run test` (Vitest) passes
- `npm run test:e2e` (Playwright) passes
- WCAG 2.2 AA contrast and keyboard accessibility verified
- Zero layout shift (CLS = 0) verified in both dark and light themes

## Engineering Standards

- **Type safety.** TypeScript strict mode is mandatory. New code must be fully typed and must not introduce `any` without justification.
- **Data boundaries.** Never hardcode API responses inside components. Consume data through `@/lib/api/api-client` and validate payloads with the Zod schemas in `src/lib/contracts`.
- **Server-side grading.** Quiz correctness must be evaluated only in server routes. Answer keys must never be shipped to the client.
- **Accessibility.** Maintain contrast ratios, keyboard operability, ARIA semantics, and reduced-motion support for every interactive surface.
- **Testing.** Add or update unit tests for changed domain logic and contracts, and extend end-to-end coverage for changed user flows.

## Questions

If anything in this guide is unclear, open an issue in the repository and a maintainer will respond.
