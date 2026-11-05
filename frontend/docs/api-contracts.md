# DevPulse API Contracts & Data Specifications

> **Target Audience**: M1 (Backend / DB / Auth Lead), M3 (Quiz Engine Lead)  
> **Author**: M2 (Frontend Lead & Design Engineer)  
> **Specification Version**: 1.0.0 (Production Candidate)

---

## 1. Architectural Boundaries

- **M2 Frontend Ownership**: UI/UX, client components, state adapters, MDX pipeline, responsive layouts, accessibility.
- **M1 Backend Ownership**: PostgreSQL schema, user authentication, profile persistence, certificate sync.
- **M3 Quiz Engine Ownership**: Question bank persistence, shuffle algorithms, server-side grading, topic breakdown calculations, next-module unlock orchestration.

> [!IMPORTANT]
> **Client-Side Grading Prohibition**: The frontend **never** evaluates quiz answers or determines whether a student passes or fails. The frontend posts user responses and receives the verified `QuizResult` payload from the server.

---

## 2. Global Conventions

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json; charset=utf-8`
- **Authentication**: Bearer JWT token in `Authorization: Bearer <token>` header (or secure HTTP-only session cookie).
- **Date Format**: ISO 8601 UTC strings (`2026-11-02T12:00:00Z`).

---

## 3. Endpoints

### 3.1 Tracks & Modules

#### `GET /api/tracks`
Returns list of all active learning tracks with nested module summaries.

**Response `200 OK`**:
```json
[
  {
    "id": "track-0",
    "slug": "web-foundations",
    "trackNumber": 0,
    "title": "Web Foundations",
    "subtitle": "From packet transport to professional developer workflows",
    "description": "Master how the physical and logical internet functions...",
    "color": "mint",
    "hexAccent": "#5EEAD4",
    "moduleCount": 6,
    "estimatedHours": 18,
    "level": "beginner",
    "icon": "Globe",
    "modules": [
      {
        "id": "mod-0-1",
        "slug": "how-the-internet-works",
        "trackId": "track-0",
        "trackSlug": "web-foundations",
        "title": "How the Internet Works",
        "description": "Undersea cables, BGP routing, DNS resolution chains...",
        "order": 1,
        "level": "beginner",
        "estimatedMinutes": 35,
        "prerequisites": [],
        "learningOutcomes": ["..."],
        "sources": [{"title": "...", "url": "...", "license": "..."}],
        "hasGitVisualizer": false
      }
    ]
  }
]
```

#### `GET /api/tracks/:trackSlug/modules/:moduleSlug`
Returns detailed module metadata including video embed data, cheat sheet, and learning outcomes.

**Response `200 OK`**:
```json
{
  "id": "mod-0-5",
  "slug": "git-basics",
  "trackId": "track-0",
  "trackSlug": "web-foundations",
  "title": "Git Basics & Object Model",
  "description": "The DAG of content-addressable blobs, trees, commits...",
  "order": 5,
  "level": "beginner",
  "estimatedMinutes": 55,
  "prerequisites": ["mod-0-4"],
  "learningOutcomes": [
    "Understand Git internals: SHA-1/SHA-256 hashes...",
    "Safely execute branch creation, fast-forward vs 3-way merge...",
    "Use the embedded visualizer to inspect DAG state mutation in real-time"
  ],
  "sources": [
    {
      "title": "Pro Git - Scott Chacon and Ben Straub",
      "url": "https://git-scm.com/book/en/v2",
      "license": "CC BY-NC-SA 3.0"
    }
  ],
  "video": {
    "title": "Git Internals - How Git Actually Works Under the Hood",
    "youtubeId": "f14QrUU84uw",
    "channel": "Computerphile",
    "license": "Creative Commons Attribution license (reuse allowed)",
    "chapters": [
      { "timestamp": "00:00", "title": "Introduction", "seconds": 0 },
      { "timestamp": "03:15", "title": "Blobs, Trees, and Commits DAG", "seconds": 195 }
    ]
  },
  "cheatSheet": {
    "title": "Git Core Commands Cheat Sheet",
    "summary": "Essential plumbing and porcelain commands...",
    "snippets": [
      {
        "title": "Branch & Switch",
        "code": "git switch -c feature/auth",
        "language": "bash",
        "explanation": "Creates and switches to a new branch atomically."
      }
    ]
  },
  "hasGitVisualizer": true
}
```

---

### 3.2 Quiz Engine (Owned by M3)

#### `GET /api/modules/:moduleId/quiz`
Fetches a dynamically sampled set of questions (default 8) drawn randomly from the module's pool (~15 questions).

> [!WARNING]
> **Strict Requirement**: The server **MUST omit** `correctOptionIndex` from this response. Only send `id`, `topic`, `question`, `options`, and `hint`.

**Response `200 OK`**:
```json
[
  {
    "id": "q-05-1",
    "topic": "Git Object Model",
    "question": "In Git's internal object database, which object stores file contents without metadata?",
    "options": [
      "Blob object",
      "Tree object",
      "Commit object",
      "Tag object"
    ],
    "hint": "Think about the simplest object that holds raw bytes rather than structure."
  }
]
```

#### `POST /api/modules/:moduleId/quiz/submit`
Submits user answers for server-side grading.

**Request Body**:
```json
{
  "moduleId": "mod-0-5",
  "answers": {
    "q-05-1": 0,
    "q-05-2": 0,
    "q-05-3": 1,
    "q-05-4": 0,
    "q-05-5": 0,
    "q-05-6": 0,
    "q-05-7": 0,
    "q-05-8": 0
  }
}
```

**Scoring Logic**:
- Pass Mark: Read from server config (`quizConfig.passPercentage = 80`). Never hardcoded.
- If `percentage >= passPercentage`:
  - Mark `passed = true`.
  - Calculate `unlockedNextModuleId` (next module in sequence).
  - Add module to student's `completedModuleIds` and `unlockedModuleIds` in database.
- If `percentage < passPercentage`:
  - Mark `passed = false`.
  - Return `missedTopics` with detailed explanations and review pointers.
  - Client prompts shuffled retry.

**Response `200 OK` (Pass Example)**:
```json
{
  "submissionId": "sub_1730563200_a81f",
  "moduleId": "mod-0-5",
  "score": 7,
  "totalQuestions": 8,
  "percentage": 88,
  "passed": true,
  "passMarkPercentage": 80,
  "topicBreakdown": [
    { "topic": "Git Object Model", "correct": 2, "total": 2, "percentage": 100 },
    { "topic": "Branches & HEAD", "correct": 0, "total": 1, "percentage": 0 },
    { "topic": "Merge Mechanics", "correct": 2, "total": 2, "percentage": 100 },
    { "topic": "Rebase vs Merge", "correct": 1, "total": 1, "percentage": 100 },
    { "topic": "Detached HEAD", "correct": 1, "total": 1, "percentage": 100 },
    { "topic": "Git Reset & Safety", "correct": 1, "total": 1, "percentage": 100 }
  ],
  "missedTopics": [
    {
      "topic": "Branches & HEAD",
      "explanation": "Branches in Git are lightweight 41-byte text files holding commit hashes.",
      "reviewConcept": "Review: What actually happens on disk when you run git branch?"
    }
  ],
  "unlockedNextModuleId": "mod-0-6",
  "message": "Outstanding work! You scored 88% (pass mark is 80%). The next module has been unlocked!"
}
```

---

### 3.3 User Profile & Progress (Owned by M1)

#### `GET /api/user/profile`
Returns current authenticated user profile, progress tracking, streak statistics, and earned badges.

**Response `200 OK`**:
```json
{
  "id": "user-devpulse-001",
  "name": "Alex Rivera",
  "username": "arivera_dev",
  "email": "alex.rivera@micdev.org",
  "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "streakDays": 14,
  "completedModuleIds": ["mod-0-1", "mod-0-2", "mod-0-3", "mod-0-4"],
  "unlockedModuleIds": ["mod-0-1", "mod-0-2", "mod-0-3", "mod-0-4", "mod-0-5"],
  "currentModuleId": "mod-0-5",
  "quizScores": {
    "mod-0-1": 100,
    "mod-0-2": 87.5,
    "mod-0-3": 100,
    "mod-0-4": 87.5
  },
  "weeklyActivity": {
    "2026-10-31": 1,
    "2026-11-01": 4,
    "2026-11-02": 3
  },
  "badges": [
    {
      "id": "badge-genesis",
      "title": "Genesis Commit",
      "description": "Enrolled in DevPulse and completed first module",
      "icon": "Sparkles",
      "unlockedAt": "2026-10-18T10:00:00Z"
    }
  ]
}
```

---

### 3.4 Certificates (Owned by M5)

#### `GET /api/certificates`
Returns curated free certification resources filterable by category, difficulty, and cost.

