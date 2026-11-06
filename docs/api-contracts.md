# DevPulse API contracts — Tracks & Modules (Phase 4)

This document is the single source of truth for the Phase 4 learning-content
endpoints: their URL shapes, response contracts, ordering guarantees, error
envelopes and security properties. The runtime contracts themselves live in
**`shared/contracts`** (`@devpulse/contracts`) — both the Express backend and
the Next.js frontend import the same Zod schemas, so the definitions below can
never drift from executed code.

Phase 2 (authentication) documents live in `backend/docs/auth-integration.md`;
this file covers the Phase 4 **read-only learning content** API. User-scoped
flows (profile, progress, quiz submission/grading) are later-phase work and
keep their existing mock behavior until then.

---

## 1. Architecture: two sources of truth, composed server-side

| Source of truth | Owns |
| --------------- | ---- |
| **PostgreSQL** (`Module`/`Track`/`QuizQuestion` rows) | existence, ids, relationships, ordering (`position`), question counts |
| **shared/curriculum** (`TRACKS`, `QUIZ_BANKS` editorials) | editorial display content: subtitles, descriptions, levels, estimated minutes, outcomes, sources, media, question text/answer keys |

Express composes both **server-side** for every response. Composition rules:

- Database fields (id, slug, trackNumber/position, titles anchored to rows)
  always win — the curriculum package only contributes display content.
- **Drift guard**: if a database row has no matching curriculum entry, or a
  track's row count disagrees with its declared curriculum count, the endpoint
  logs the offending id server-side and answers `500
  {"error":"Curriculum content is unavailable"}`. Content is **never silently
  omitted** and responses are **never partially composed**
  (`backend/src/services/curriculum.service.ts`).
- Every composed payload is parsed through its shared contract schema before
  it is served: latent shape drift fails closed as a generic 500 envelope
  instead of leaking malformed data.
- Quiz payload mapping strips server-only fields by **explicit field
  mapping** (never by spreading row objects), so a future column addition
  cannot accidentally leak grading truth
  (`backend/src/services/quiz.service.ts`).

### Evaluated and rejected alternative: full DB denormalization

Duplicating all editorial content (descriptions, outcomes, sources, media
links, question bodies/keys) into Postgres columns was considered and
rejected:

1. Curricula are author-owned content with its own review workflow — keeping
   it in versioned TypeScript keeps diffs reviewable and the seed idempotent.
2. Doubled writes create two shapes of truth for the same text field; every
   content edit would require migrations or sync tooling.
3. The composition cost is negligible (payload assembly is O(modules)), and
   the drift guard above converts desyncs into hard 500s instead of stale or
   partial data.

If content ever becomes user-editable (an authoring UI), revisit this
decision and move to a CMS with migration discipline.

---

## 2. Endpoints

All endpoints are **public, read-only** (`backend/src/routes/curriculum.routes.ts`).
No authentication header is interpreted for content reads; content is not
user-scoped.

| # | Method | Backend path | Served by | Purpose |
| - | ------ | ------------ | --------- | ------- |
| 1 | GET | `/tracks` | `getTracks` | all tracks with nested modules |
| 2 | GET | `/tracks/:slug` | `getTrack` | one track with nested modules |
| 3 | GET | `/tracks/:trackSlug/modules` | `getTrackModules` | ordered module cards for one track |
| 4 | GET | `/tracks/:trackSlug/modules/:moduleSlug` | `getTrackModule` | full module reader payload |
| 5 | GET | `/tracks/:trackSlug/modules/:moduleSlug/quiz` | `getQuizQuestions` | public quiz questions (no grading truth) |

### 2.1 GET /tracks  →  `TrackListSchema` (=`TrackSchema[]`)

`200 OK` with **all tracks**, ordered by `Track.position` ascending, each with
its modules embedded ordered by `Module.position` ascending:

```json
[
  {
    "id": "track-0",
    "slug": "web-foundations",
    "trackNumber": 0,
    "title": "Web Foundations",
    "subtitle": "…",
    "description": "…",
    "color": "mint",
    "hexAccent": "#5EEAD4",
    "moduleCount": 6,
    "estimatedHours": 18,
    "level": "beginner",
    "icon": "Globe",
    "modules": [
      {
        "id": "mod-0-1", "slug": "packet-anatomy", "trackId": "track-0",
        "trackSlug": "web-foundations",
        "title": "…", "description": "…",
        "order": 1, "level": "beginner", "estimatedMinutes": 60,
        "prerequisites": [], "learningOutcomes": ["…"], "sources": ["…"],
        "hasGitVisualizer": false
      }
    ]
  }
]
```

(`video` and `cheatSheet` appear only when the module defines them; empty
tracks cannot occur in seeded data, but `[]` is a valid response.)

### 2.2 GET /tracks/:slug  →  `TrackDetailSchema` (=`TrackSchema`)

Identical to the nested element from `GET /tracks`. Statuses: `404
{"error":"Track not found"}` — and `400 {"error":"Invalid track slug"}` when
the URL segment is not a lowercase-kebab slug (validated before any database
hit).

### 2.3 GET /tracks/:trackSlug/modules  →  `ModuleListItemSchema[]`

`200 OK`, ordered by `position` ascending. The **light card** shape is trimmed
for listing surfaces (learning hub, palette):

```json
{
  "id": "mod-0-5",
  "slug": "git-basics",
  "trackId": "track-0",
  "trackSlug": "web-foundations",
  "title": "Git Basics & Object Model",
  "description": "…",
  "order": 5,
  "level": "beginner",
  "estimatedMinutes": 70,
  "hasGitVisualizer": true,
  "quizQuestionCount": 10
}
```

- `order` comes from the **database** row (`position`), not the content
  package.
- `quizQuestionCount` comes from a DB `COUNT` over `QuizQuestion` rows —
  `0` means the module has no authored bank (no placeholders are ever
  fabricated).
- Statuses: `404 {"error":"Track not found"}`, `400 {"error":"Invalid track slug"}`.

### 2.4 GET /tracks/:trackSlug/modules/:moduleSlug  →  `ModuleDetailSchema`

`ModuleMeta` (the full reader payload: prerequisites, learningOutcomes,
sources, optional video/cheatSheet) **plus `quizQuestionCount`**. Identities
are anchored to the rows: the module is only addressable *through* its track.

- Statuses: `404 {"error":"Module not found"}` — also returned when the module
  exists but belongs to a **different track** (no cross-track relationship
  disclosure); `400 {"error":"Invalid track or module slug"}` for malformed
  segments.

### 2.5 GET /tracks/:trackSlug/modules/:moduleSlug/quiz  →  `PublicQuizQuestionListSchema`

`200 OK` with the authored bank, in authored order (`position` ascending):

```json
[
  {
    "id": "q-05-1",
    "topic": "Git Object Model",
    "question": "In Git's internal object database, …",
    "options": ["Blob object", "Tree object", "Commit object", "Tag object"],
    "hint": "Think about the simplest object that holds raw bytes…"
  }
]
```

- **Empty array (`[]`) is a valid 200 response** meaning "no authored bank
  yet". Clients must render an honest "quiz coming soon" state; the backend
  never generates placeholder questions.
- Statuses: `404 {"error":"Module not found"}` (unknown or cross-track),
  `400 {"error":"Invalid track or module slug"}`, and `500
  {"error":"Quiz content is unavailable"}` when persisted rows violate the
  four-string-option invariant.

### Error envelope

Non-2xx responses always use the shared `ApiErrorEnvelope`:

```json
{ "error": "…human-readable, i18n-ready…" }
```

| Status | Meaning | Who produces it |
| ------ | ------- | --------------- |
| 400 | malformed URL segment (slug validation) | controllers, before Prisma |
| 404 | unknown track/module or cross-track mismatch | services (`HttpError`) |
| 500 | database failure, curriculum/quiz data drift, contract drift | central error handler; details stay server-side |

---

## 3. Contract definitions (shared/contracts)

Defined in `shared/contracts/src/index.ts` — the single source of truth
imported by backend services and frontend clients alike:

```ts
ModuleListItemSchema   // light card (2.3)
ModuleDetailSchema     // ModuleMetaSchema + quizQuestionCount (2.4)
TrackListSchema        // z.array(TrackSchema) (2.1)
TrackDetailSchema      // = TrackSchema (2.2)
PublicQuizQuestionSchema = QuizQuestionSchema, omitting
                         correctOptionIndex AND explanation (2.5)
PublicQuizQuestionListSchema = z.array(PublicQuizQuestionSchema)
```

Documented deviation (approved): endpoints 1–2 return **nested modules** —
existing pages consume one hop of the full structure today; switching to
lightweight summaries would redesign those surfaces for no functional gain.

---

## 4. quiz answer-key security model

1. `correctOptionIndex` and `explanation` are authoring/grading data. They are
   stored in the `QuizQuestion` table (server-owned) and remain in
   `shared/curriculum` for authoring, but the **public contract omits both**
   (`PublicQuizQuestionSchema`).
2. The quiz service maps rows field-by-field; grading truth physically cannot
   reach the composed payload.
3. The frontend's `HttpApiClient` validates quiz responses against the same
   schema, and the BFF proxy (`app/api/business/…/quiz/route.ts`)
   re-validates before re-serializing — so even a malicious upstream
   regression is caught in two more places before it reaches the browser.
4. Tests assert the property at every layer:
   - `backend/tests/integration/tracks.api.test.ts` — serialized response
     contains neither `correctOptionIndex` nor `explanation`, and the exact
     public key set is asserted.
   - `frontend/tests/unit/scoring.test.ts` — both fields are `undefined`
     (type-level and runtime-level) in adapter results.

Phase 5 will add graded-results (`explanation` re-enters only through
authenticated submissions, server-graded).

---

## 5. Browser access paths (BFF)

The browser never talks to Express directly (Phase 3 invariant, unchanged):

| Browser (same-origin) | BFF route handler | Backend |
| --------------------- | ----------------- | ------- |
| `GET /api/business/tracks` | `app/api/business/tracks/route.ts` | `GET /tracks` |
| `GET /api/business/tracks/:slug` | `…/tracks/[slug]/route.ts` | `GET /tracks/:slug` |
| `GET /api/business/tracks/:slug/modules/:moduleSlug` | `…/[slug]/modules/[moduleSlug]/route.ts` | endpoint 4 |
| `GET /api/business/tracks/:slug/modules/:moduleSlug/quiz` | `…/[slug]/modules/[moduleSlug]/quiz/route.ts` | endpoint 5 |

- Proxies forward backend envelopes **verbatim** (status + body) and
  re-validate success payloads against the shared contracts.
- Backend endpoint 3 (`/tracks/:trackSlug/modules`) is contract-tested on the
  backend but intentionally has no BFF proxy: no frontend client consumes it
  yet (`listModulesByTrack` remains available for future surfaces).
- React Server Components (learn pages) call Express **directly** via
  `backendFetchJson`/`withNotFound` (`frontend/src/lib/bff.ts`), skipping the
  same-origin hop; unknown slugs map to `notFound()`, everything else bubbles
  to the error boundary. **No page ever falls back to mock data when a real
  request fails.**

---

## 6. Data guarantees

- **Stable ids**: tracks/modules/questions keep their editorial ids
  (`track-0`, `mod-0-5`, `q-05-1`); seeding upserts by primary key, so
  re-runs never renumber or duplicate rows.
- **Ordering**: all list responses derive order from database `position`
  columns; content-package order never influences responses.
- **Counts**: current seeded volume is 3 tracks / 23 modules / 18 quiz
  questions (`mod-0-5` → 10, `mod-1-3` → 8). Modules without an authored bank
  report `quizQuestionCount: 0` and `[]` from the quiz endpoint.
- **Shape drift fails closed**: services validate final payloads through the
  shared schemas; database failures produce generic 500 envelopes (no
  internals leak).

## 7. Test coverage map

| Layer | File |
| ----- | ---- |
| Backend endpoints (ordering, 404s, contract parse, answer-key absence, DB-failure envelopes) | `backend/tests/integration/tracks.api.test.ts` |
| Frontend adapter (mock/hybrid selection, public quiz shape, empty banks) | `frontend/tests/unit/api-adapter.test.ts`, `frontend/tests/unit/scoring.test.ts` |
| Frontend security boundaries (proxies replace mock gates, contract list, e2e topology) | `frontend/tests/unit/security-boundaries.test.ts` |
| E2E (real DB flows) | `frontend/tests/e2e/*` via `NEXT_PUBLIC_API_MOCK=false` |
