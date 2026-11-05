# DevPulse Design System & Craft Guidelines

> **DevPulse** (MIC Development Dept, Team 5, 2026-27)  
> **Philosophy**: Awwwards / Apple Design Award / Linear-grade precision. High information density without visual clutter. Dark-first with an immaculate light theme.

---

## 1. Visual Identity & Brand Motif

### 1.1 The Hexagonal Heritage
DevPulse echoes the hexagonal motif from the **MIC Development 26-27** emblem:
- **Module Nodes**: Hexagonal badges with radial status rings (`completed` = emerald glow, `unlocked` = accent pulse, `locked` = muted wireframe).
- **Subtle Ground Texture**: A geometric isometric hex grid at 3% opacity (`.hex-grid-pattern`) that catches ambient aurora lighting.
- **Brand Mark**: Interlocking dual-tri-hex polygon evoking code compilation and distributed network consensus.

---

## 2. Color Palette & Semantic Tokens

### 2.1 The Ink Palette (Midnight Ground)
| Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| `ink-950` | `#06070A` | Deepest background beneath canvas |
| `ink-900` | `#0A0B10` | Primary app canvas ground (Dark Mode) |
| `ink-850` | `#0E1017` | Subtle contrast panels |
| `ink-800` | `#12141D` | Standard card surface (`--card`) |
| `ink-700` | `#181B26` | Elevated cards, dialogs, dropdowns |
| `ink-600` | `#222634` | Hover states, active tabs |
| `ink-300` | `#6F7791` | Secondary metadata text |
| `ink-100` | `#D3D7E3` | Primary body text in dark mode |
| `ink-50` | `#F1F3F8` | Display headers and highlighted titles |

### 2.2 Track Signature Colors
Each track commands its own signature glow and semantic atmosphere:
- **Track 0: Web Foundations**: `Mint (#5EEAD4)`
  - Glow: `rgba(94, 234, 212, 0.25)` | Badge bg: `rgba(94, 234, 212, 0.08)`
- **Track 1: Full-Stack**: `Electric Blue (#8AB4FF)`
  - Glow: `rgba(138, 180, 255, 0.25)` | Badge bg: `rgba(138, 180, 255, 0.08)`
- **Track 2: Blockchain**: `Warm Amber (#F5B14C)`
  - Glow: `rgba(245, 177, 76, 0.25)` | Badge bg: `rgba(245, 177, 76, 0.08)`

### 2.3 Feedback States
- **Success / Pass**: Emerald `#10B981` (Quiz pass ring, completed module node)
- **Error / Missed**: Rose `#F43F5E` (Quiz retry notice, failed validation)
- **Warning / Review**: Amber `#F59E0B` (Prerequisite notices, critical security notes)

---

## 3. Typography Hierarchy

| Style | Font Family | Weight | Letter Spacing | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Space Grotesk | 700 / Bold | `-0.035em` | Landing headers, big numbers |
| **Section Heading** | Space Grotesk | 600 / SemiBold | `-0.025em` | Page titles, module headers |
| **Subheading** | Space Grotesk | 500 / Medium | `-0.015em` | Card titles, track labels |
| **Body Large** | Inter | 400 / Regular | `0em` | Module intro, lead copy |
| **Body Default** | Inter | 400 / Regular | `0em` | Standard paragraphs, explanations |
| **UI Small** | Inter | 500 / Medium | `+0.01em` | Buttons, badges, metadata |
| **Code / Data** | JetBrains Mono | 400 / 500 | `-0.01em` | Code blocks, terminal, hashes |

---

## 4. Motion & Animation Principles

> **60fps Law**: Every micro-interaction must render within a 16.6ms frame budget. Zero layout shift (`CLS = 0`).

1. **Spring Physics Over Easing Curves**:
   - Use spring physics for physical interactions (hover lift, modal open, drawer slide).
   - Stiff spring for buttons: `{ stiffness: 400, damping: 28 }`
   - Gentle spring for modal panels: `{ stiffness: 260, damping: 24 }`
2. **Micro-Interactions**:
   - Buttons feature a subtle magnetic pull and glowing border sweep on hover.
   - Code copy button exhibits instant haptic state change (`Copy` $\to$ `Copied!` with checkmark).
   - Module reader scroll progress bar tracks scroll position with CSS `transform: scaleX(...)` rather than `width` to prevent browser reflow.
3. **Respect `prefers-reduced-motion`**:
   - When reduced motion is requested, all translation and scale animations are replaced with pure instant opacity fades (`duration: 0.1s`).

---

## 5. Accessibility (WCAG 2.2 AA Minimum)

- **Contrast Ratios**: All text tokens exceed 4.5:1 against their surface. Muted text exceeds 3:1 for large display elements.
- **Touch Target**: All interactive controls maintain a minimum hit area of 44×44px.
- **Keyboard Navigation**:
  - Full keyboard control on every screen.
  - Quiz answers selectable via number keys `1`, `2`, `3`, `4`.
  - Next question triggered via `Enter`.
  - Command palette opened with `Cmd+K` / `Ctrl+K`.
  - Keyboard shortcuts cheat sheet opened with `?`.
  - Visible focus rings with 2px offset (`var(--ring)`).

