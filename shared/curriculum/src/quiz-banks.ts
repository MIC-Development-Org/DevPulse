/**
 * DevPulse quiz banks (Phase 4) — single authoring source.
 *
 * Moved verbatim from frontend/src/lib/data/mock-data.ts so backend seeding
 * and frontend consumers share one source. Question ids ("q-05-1", "q-13-8")
 * are stable editorial ids: the seed upserts by id, so re-runs never
 * duplicate or renumber rows.
 *
 * SECURITY: correctOptionIndex and explanation are SERVER-ONLY fields. The
 * public quiz contract (@devpulse/contracts — PublicQuizQuestionSchema)
 * omits both; only seeded database rows and graded results may carry them,
 * and public responses must always be composed through that contract.
 */

import type { QuizQuestion } from "@devpulse/contracts";

export const QUIZ_BANKS: Record<string, QuizQuestion[]> = {
  "mod-0-5": [
    {
      id: "q-05-1",
      topic: "Git Object Model",
      question: "In Git's internal object database, which object stores file contents without metadata like filenames or file permissions?",
      options: ["Blob object", "Tree object", "Commit object", "Tag object"],
      correctOptionIndex: 0,
      explanation: "Blobs ('Binary Large Objects') store only the raw file data compressed with zlib. Filenames, directory hierarchy, and permission modes are stored in Tree objects.",
      hint: "Think about the simplest object that holds raw bytes rather than structure.",
    },
    {
      id: "q-05-2",
      topic: "Git Object Model",
      question: "How does Git calculate the SHA-1 or SHA-256 identifier for any stored object?",
      options: [
        "It hashes the content combined with a header containing the object type and byte size.",
        "It hashes the timestamp of when the commit was created.",
        "It combines the author email with the file's last modified date.",
        "It generates a pseudorandom UUID upon every `git add`.",
      ],
      correctOptionIndex: 0,
      explanation: "Git objects are content-addressable. The hash is calculated as `hash(type + ' ' + size + '\\0' + content)`. If two identical files exist, they share the exact same blob hash.",
      hint: "Git uses content-addressable storage where the payload dictates the hash.",
    },
    {
      id: "q-05-3",
      topic: "Branches & HEAD",
      question: "What actually happens on disk when you run `git branch feature-auth`?",
      options: [
        "Git creates a 41-byte text file in `.git/refs/heads/` containing the 40-character commit hash of HEAD.",
        "Git duplicates all source files in the project into a separate hidden folder.",
        "Git compiles a new delta patch against the remote origin.",
        "Git locks the staging area index to prevent concurrent edits.",
      ],
      correctOptionIndex: 0,
      explanation: "Branches in Git are merely lightweight moveable pointers to a commit hash! Creating a branch simply creates a tiny text file with a 40-byte hash.",
      hint: "Git branches are famously lightweight pointers, not file copies.",
    },
    {
      id: "q-05-4",
      topic: "Merge Mechanics",
      question: "When is a 'Fast-Forward' merge possible in Git?",
      options: [
        "When the target branch HEAD is a direct ancestor of the branch being merged in.",
        "Only when both branches have exactly one commit each.",
        "Only when you use the `--rebase` flag during merge.",
        "Whenever there are no conflicting line changes between two branches.",
      ],
      correctOptionIndex: 0,
      explanation: "A fast-forward merge occurs when there has been no divergent commit history on the target branch. Git can simply move the branch pointer forward without generating a merge commit.",
      hint: "Consider when a linear path exists without diverging parent commits.",
    },
    {
      id: "q-05-5",
      topic: "Three-Way Merge",
      question: "In a true 3-way merge commit (`git merge`), which three snapshots does Git compare to resolve changes?",
      options: [
        "The common ancestor commit (merge base), the HEAD of your current branch, and the tip of the incoming branch.",
        "The working directory, the staging index, and the stash.",
        "The remote tracking branch, the local branch, and the origin/main branch.",
        "The first commit of the repository, the previous commit, and the current commit.",
      ],
      correctOptionIndex: 0,
      explanation: "Git finds the best common ancestor (merge base) between the two branches and computes the differences from that base to both branch tips to generate the merge commit.",
      hint: "Think about finding where the history split (the merge base) and the two endpoints.",
    },
    {
      id: "q-05-6",
      topic: "Rebase vs Merge",
      question: "What does `git rebase main` fundamentally do to the commits on your feature branch?",
      options: [
        "It replays your feature commits one-by-one on top of the latest main commit, giving them brand new commit hashes.",
        "It combines all commits into a single commit and deletes the original author attribution.",
        "It permanently deletes untracked files in the working directory.",
        "It creates a merge commit with two parent pointers.",
      ],
      correctOptionIndex: 0,
      explanation: "Rebasing recalculates the parent for each commit in your series and re-applies the diffs on the new base. Because parents change, their commit hashes change completely.",
      hint: "Remember that changing a commit's parent changes its content-addressable hash.",
    },
    {
      id: "q-05-7",
      topic: "Detached HEAD",
      question: "What does it mean when Git displays the message 'You are in detached HEAD state'?",
      options: [
        "HEAD points directly to a specific commit hash rather than a named branch reference.",
        "The `.git` directory has been corrupted and files are missing.",
        "Your working tree has unsaved merge conflicts that cannot be stashed.",
        "Git has disconnected from the remote GitHub repository.",
      ],
      correctOptionIndex: 0,
      explanation: "Normally HEAD points to a symbolic ref (e.g., `ref: refs/heads/main`). When you checkout a specific commit SHA or tag, HEAD points directly to that hash without a branch pointer.",
      hint: "HEAD normally points to a branch name, but here it points directly to a commit.",
    },
    {
      id: "q-05-8",
      topic: "Git Reset & Safety",
      question: "What is the difference between `git reset --soft HEAD~1` and `git reset --hard HEAD~1`?",
      options: [
        "`--soft` moves the branch pointer back but keeps your changes staged in the index, while `--hard` resets index and wipes working directory changes.",
        "`--soft` only changes the commit message; `--hard` deletes the entire branch.",
        "`--soft` pushes changes to the remote branch; `--hard` drops the connection.",
        "`--soft` creates a backup tag; `--hard` skips garbage collection.",
      ],
      correctOptionIndex: 0,
      explanation: "`git reset --soft` rewinds HEAD while leaving your files in the staging area. `--hard` resets HEAD, index, and disk files, irreversibly dropping uncommitted modifications.",
      hint: "Consider what happens to the files currently in your staging area and working directory.",
    },
    {
      id: "q-05-9",
      topic: "Staging Index",
      question: "What role does the Git 'index' (staging area) play between the working directory and the commit history?",
      options: [
        "It is a binary cache (`.git/index`) that prepares the exact tree object that will constitute the next commit.",
        "It is an external cloud backup created by GitHub CLI.",
        "It stores temporary zip archives of modified files before compression.",
        "It only tracks deleted files waiting for garbage collection.",
      ],
      correctOptionIndex: 0,
      explanation: "The index is a binary cache mapping paths to blob SHAs and file mode bits. When you commit, Git writes the index directly into tree objects without having to scan the whole disk.",
      hint: "It acts as the blueprint for the next tree object.",
    },
    {
      id: "q-05-10",
      topic: "Git Plumbing",
      question: "Which low-level plumbing command allows you to inspect the type and content of any object by hash?",
      options: ["`git cat-file -p <hash>`", "`git inspect --object <hash>`", "`git read-tree --print <hash>`", "`git blob-dump <hash>`"],
      correctOptionIndex: 0,
      explanation: "`git cat-file -p` (pretty-print) detects the object type (blob, tree, commit, tag) and prints its formatted contents directly.",
      hint: "Think of the Unix `cat` command prefixed with Git's internal naming.",
    },
  ],
  "mod-1-3": [
    {
      id: "q-13-1",
      topic: "Fiber Reconciliation",
      question: "What primary architectural problem did React Fiber solve over the legacy Stack Reconciler?",
      options: [
        "It broke rendering work into incremental units, allowing the browser to pause work for higher-priority user input and animations.",
        "It eliminated the need for virtual DOM comparisons by compiling directly to WebAssembly.",
        "It replaced JavaScript with an internal C++ rendering thread in node_modules.",
        "It allowed state to be shared globally across browser tabs without storage events.",
      ],
      correctOptionIndex: 0,
      explanation: "The old Stack Reconciler was synchronous and recursive; if a component tree was large, it blocked the main thread. Fiber transformed reconciliation into a linked-list work loop with interruptible priority lanes.",
      hint: "Think about smoothness, 60fps animations, and frame budget.",
    },
    {
      id: "q-13-2",
      topic: "Double Buffering",
      question: "How does React Fiber use 'Double Buffering' during the render and commit phases?",
      options: [
        "It maintains a `current` tree (displayed on screen) and a `workInProgress` tree (built in memory), swapping pointers upon commit.",
        "It renders two copies of every HTML element for fast undo/redo actions.",
        "It duplicates state into both localStorage and memory for offline recovery.",
        "It renders alternating frames using two WebGL shaders.",
      ],
      correctOptionIndex: 0,
      explanation: "Just like graphics rendering pipelines, React builds the new UI off-screen in the `workInProgress` fiber tree. When rendering finishes, React simply swaps the pointer in the commit phase with zero flash.",
      hint: "Think of video game rendering pipelines with back buffers and front buffers.",
    },
    {
      id: "q-13-3",
      topic: "Rules of Hooks",
      question: "Why must React hooks never be placed inside loops, conditions, or nested functions?",
      options: [
        "Because React relies on the exact invocation order of hooks across re-renders to match each hook with its linked-list node on the fiber.",
        "Because JavaScript closures lose scope inside conditional blocks.",
        "Because TypeScript cannot infer union types inside if statements.",
        "Because the V8 compiler refuses to optimize functions with dynamic hooks.",
      ],
      correctOptionIndex: 0,
      explanation: "Each Fiber node contains a singly-linked list of hook states (`memoizedState -> next`). React tracks the current hook by advancing an internal pointer on each hook call; dynamic order corrupts the list.",
      hint: "Remember that React stores hooks in an ordered singly-linked list on the fiber.",
    },
    {
      id: "q-13-4",
      topic: "Concurrent Features",
      question: "What is the key purpose of React 18's `useTransition` hook?",
      options: [
        "To mark a state update as a non-urgent transition, letting high-priority interactions (like typing or clicks) interrupt it.",
        "To animate CSS properties with keyframe physics.",
        "To switch between light and dark mode themes with smooth opacity.",
        "To pause network requests until the user scrolls into view.",
      ],
      correctOptionIndex: 0,
      explanation: "`useTransition` assigns the update to a lower priority lane. If urgent input arrives while rendering the transition, React yields to handle the input first.",
      hint: "Consider how user typing should never lag behind large search query computations.",
    },
    {
      id: "q-13-5",
      topic: "Memoization Traps",
      question: "In what scenario can overuse of `useMemo` or `useCallback` actually degrade application performance?",
      options: [
        "When the computation being cached is trivial, causing the overhead of dependency array allocation and shallow comparison to exceed the calculation cost.",
        "Whenever a component has more than 5 props.",
        "When using Next.js instead of vanilla Vite.",
        "When rendering SVG icons inside button elements.",
      ],
      correctOptionIndex: 0,
      explanation: "Memoization is not free: each call allocates dependency arrays and executes array equality checks on every render. If the memoized function or computation is cheap, memoization adds net overhead.",
      hint: "Remember that array allocations and dependency checks have real CPU costs.",
    },
    {
      id: "q-13-6",
      topic: "useEffect Lifecycles",
      question: "When does the cleanup function returned by `useEffect` execute?",
      options: [
        "Before the effect runs again on re-render, and when the component unmounts.",
        "Only when the browser window closes.",
        "Immediately after the JSX renders to the screen before paint.",
        "At the start of the next user mouse movement.",
      ],
      correctOptionIndex: 0,
      explanation: "React cleans up effects from the previous render before executing the effect for the new render, as well as on complete component unmount.",
      hint: "Think about preventing stale listeners before a new subscription is attached.",
    },
    {
      id: "q-13-7",
      topic: "Custom Hook Design",
      question: "What is the primary benefit of custom hooks in modern React architecture?",
      options: [
        "They decouple stateful logic and side effects from UI rendering, making logic reusable and testable.",
        "They allow functional components to inherit from class components.",
        "They automatically bypass React's virtual DOM reconciliation.",
        "They run state mutations inside dedicated Web Workers.",
      ],
      correctOptionIndex: 0,
      explanation: "Custom hooks extract stateful logic (fetching, timers, form bindings) into pure reusable functions while allowing components to focus purely on JSX presentation.",
      hint: "Consider separating 'what to do' (logic) from 'how it looks' (markup).",
    },
    {
      id: "q-13-8",
      topic: "State Collocation",
      question: "What is 'State Collocation' and why is it recommended over global state for everything?",
      options: [
        "Keeping state as close as possible to the components that consume it, reducing unnecessary re-render propagation.",
        "Storing all application data in a single global Redux slice.",
        "Writing all state definitions in a dedicated `state.ts` root folder.",
        "Synchronizing local state with server state on every keystroke.",
      ],
      correctOptionIndex: 0,
      explanation: "Collocation ensures that updates to state only trigger re-renders in the subtrees that actually read that state, avoiding massive top-level re-render waterfalls.",
      hint: "Collocation means placing data where it is actually used.",
    },
  ],
};
