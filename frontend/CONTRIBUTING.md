# Contributing to DevPulse Frontend

Welcome to the DevPulse frontend engineering team! We operate under high craft standards (Linear, Vercel, Apple Design Award quality).

## Team Structure & Ownership
- **M1**: Backend, Database, Auth & API Gateway
- **M2 (Frontend Lead)**: Design system, UI components, layouts, MDX engine, responsive & a11y, Git visualiser, modules 1.1, 1.3, 1.4
- **M3**: Quiz engine logic & scoring algorithms
- **M4**: Blockchain curriculum & Web3 content
- **M5**: Certificates curation & content QA

## Development Workflow
1. **Branching**: Always branch off `develop` using `feature/<area>-<description>` (e.g., `feature/quiz-keyboard-nav`). Never push directly to `main` or `develop`.
2. **Conventional Commits**: Format commit messages as `type(scope): description` (e.g., `feat(reader): implement sticky scroll-spy TOC`).
3. **Pre-PR Quality Checklist**:
   - `npm run lint` passes without warnings
   - `npm run test` (Vitest) passes 100%
   - `npm run test:e2e` (Playwright) passes
   - WCAG 2.2 AA contrast and keyboard accessibility checked
   - Zero layout shift (CLS = 0) verified in both Dark and Light themes
4. **Data Boundaries**: Never hardcode API responses inside components; always consume data through `@/lib/api/api-client`.

