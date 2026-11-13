---
name: code-review
description: Staff-level code review of changes in a FastAPI + React/TypeScript or Kotlin Android repo, enforcing the repo's CLAUDE.md rules first. Use when asked to review a diff, PR, branch, commit, or files.
---

# FastAPI + React/TypeScript + Kotlin Android code review

Review like a staff engineer: find what would break, leak, or slow down in production, check it against the project's own rules, and give fixes the author can act on. Fewer real findings beat a long list of guesses.

**This skill only reviews.** Never edit files, stage, commit, push, run migrations against a real database, or run a seed script against anything but a throwaway database. If the user then asks for fixes, apply them following the repo's commit rules (with engineering-standards: show the change and wait for approval before every commit).

## 1. Decide the scope

Use what the user named. Otherwise, in this order:

| User says | Diff to review |
|---|---|
| A PR number or URL | `gh pr diff <n>` and `gh pr view <n>` (read the description) |
| A branch | `git diff <default-branch>...<branch>` |
| A commit or range | `git show <sha>` / `git diff <a>..<b>` |
| Files or a folder | those files in full |
| Nothing specific | uncommitted work: `git diff`, `git diff --staged`, and untracked files from `git status --porcelain`. If there is none, the last commit (`git show HEAD`), and say so |

State the scope in the first line of the review. If the diff is over ~1,500 changed lines, review the riskiest parts first (auth, money, data access, migrations, API contract) and list what was skipped.

## 2. Load the project's rules

1. Read every `CLAUDE.md` that applies: the repo root, `api/CLAUDE.md`, `web/CLAUDE.md`, `android/CLAUDE.md`, and any files they import (e.g. `.standards/rules/*.md`). **Project rules override this skill.** Where this checklist and the project disagree, follow the project.
2. Skim `docs/decisions.md` (or ADRs) for decisions touching the changed code. Never flag something a recorded decision explicitly allows; cite the decision instead if it matters.
3. Read `docs/requirements.md` when a change adds behaviour, to check it was asked for.
4. Config files are the source of truth for tooling (`pyproject.toml`, `Makefile`, `eslint.config.js`, `stylelint.config.js`, `tsconfig*.json`, `vite.config.ts`, `*.gradle.kts`, `libs.versions.toml`, detekt config), even if a doc quotes an older copy.

## 3. Understand the change before judging it

- Read each changed file **in full**, not only the hunks. Follow the change one level out: callers of a changed function, the router that uses a changed service, the components that use a changed hook or type.
- For an API change, open both sides of the contract: request and resource schemas, the TypeScript interface, `constants/api_endpoints.ts`, the API function, the query hook and its query keys.
- Note which tests were added or changed, and which behaviour has none.

## 4. Run the checks without modifying files

`make check` and `npm run check` run with `--fix` / `ruff format` / ktlint format, which **rewrite files**. During a review, run the read-only equivalents instead:

```bash
# api/
uv run ruff check .
uv run ruff format --check .
uv run mypy <the paths the Makefile's typecheck target uses>
uv run pytest -q            # add the Makefile's --cov options for a full-branch review

# web/
npx eslint .
npx stylelint "src/**/*.scss" --allow-empty-input
npx tsc -b --noEmit
npx vitest run

# android/
./gradlew ktlintCheck detekt lintDebug testDebugUnitTest   # check tasks only, never the format task
```

Run only the side(s) the change touches. If a tool is missing, say so and continue. Report the results in one block; don't turn each lint error into a separate finding. Spend the review on what tools can't catch.

## 5. Checklist

Work through it in priority order. Each item is a question; only raise a finding when the answer is a real problem in this diff.

### 5.1 Correctness and data integrity
- Does the code do what the change claims, including empty, null, boundary, and duplicate inputs?
- Pagination: off-by-one, a page beyond the last, 0 results (`total_pages: 0`)?
- Race conditions: double submits, a mutation finishing after navigation, a stale response overwriting a newer one?
- Money: never `float`, `Number()`, or `parseFloat`. Backend `Decimal` with the project's rounding; frontend formats the string only.
- Time: no naive `datetime.now()`, `date.today()`, browser-local date formatting, or Android `System.currentTimeMillis()` / `Instant.now()` without the injected `Clock`. Use the app's time-zone constant and clock helper.

### 5.2 Security and privacy
- **Personal data in logs or errors:** names, emails, salaries, or request/response bodies in `logger.*`, `print`, `console.*`, exception messages, or error responses. Always a blocker.
- New router or endpoint: covered by the router-level `Depends(get_current_user)`? Only the project's listed public endpoints may skip it.
- New write method (POST/PATCH/PUT/DELETE): covered by the origin-check middleware? Does any `GET` change data?
- SQL built from strings (`text(f"...")`, `.format`, `%`) with user input; `LIKE` without `autoescape=True`; sort or filter fields not taken from an allow-listed enum.
- Resources leaking fields (password hashes, session data, internal flags); routers returning ORM models.
- Frontend: tokens or user data in `localStorage`/`sessionStorage`/JS-readable cookies; `dangerouslySetInnerHTML`; secrets in `VITE_*` variables; redirects built from untrusted input (URL parameters).
- Secrets, `.env`, database files, or build output in the diff.

### 5.3 API contract (backend ↔ frontend)
- Every response uses the project shape: `{ data }`, `{ data, meta }`, `{ error, details? }`. No FastAPI default `{ detail }` leaking through.
- Status codes match the project's REST table (201 create, 204 delete with no body, 409, 422, 401 vs 403).
- Pagination built only with `PaginatedResponse.create`; list requests extend `PaginationRequest`; TS params extend `IPaginationParams`.
- No data values used as JSON keys.
- Schema ↔ interface parity: every field added, renamed, or removed on one side is mirrored on the other (snake_case ↔ camelCase), with money as a decimal string.
- Breaking change for an already-deployed client?

### 5.4 Backend (FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic)
- **Layering:** routers parse, call one service method, return a resource. Services hold rules and raise domain exceptions (**never** `HTTPException`). Repositories own queries. Models hold columns only.
- Dependencies injected via constructors and wired in `api/dependencies.py`; no module-level globals or sessions created inside services.
- **`def` vs `async def`:** with a synchronous driver, endpoints and dependencies are plain `def`. Flag any blocking call (DB, file, `time.sleep`, sync HTTP) inside `async def`.
- Pydantic: validation and normalisation live in request schemas (trim, reject blank, lowercase emails, uppercase codes, limits from constants). Partial updates use `model_dump(exclude_unset=True)`, not `exclude_none`.
- **Soft delete:** every query on a soft-deleted model goes through the project's filter helper (e.g. `active_employees()`), including counts, aggregates, option lists, and uniqueness checks.
- Queries: aggregates in SQL (`GROUP BY`), not Python loops over all rows (unless a recorded decision says otherwise). Watch for N+1 queries, counts that ignore the active filters, and loading whole rows when columns suffice.
- Indexes: a new filter, sort, or group column has an index (and a one-line reason in `docs/architecture.md`).
- Transactions: commit/rollback in one place (the service); no partial writes on error; uniqueness enforced by a DB constraint **and** a service check.
- **Migrations:** every model change has an Alembic migration; SQLite changes use `batch_alter_table`; new non-null columns on existing tables have a `server_default`; `downgrade()` works; no `create_all()` in app code.
- Settings read only through `core/config.py`; no `os.environ` / `os.getenv` elsewhere.
- Messages from `constants/messages.py`; numbers and strings from `constants/`.
- Typing: passes `mypy --strict` without new `# type: ignore` or `Any`; no untyped `dict` payloads for domain data.

### 5.5 Frontend (React 19, TypeScript, React Query, Mantine)
- **Types:** no `any`, no `as` casts or `!` assertions used to silence the compiler, no `@ts-ignore` / `eslint-disable` without a reason. Props through `I<Component>Props`; interfaces `I*`, type aliases `T*`; `useState<T>` generics given (lint can't check these).
- **Data flow:** types → API function → query/mutation hook → component. Components never import from `src/api/`. No `fetch`/`axios` outside `api_client.ts`. No data fetching in `useEffect`.
- **React Query:** keys only from `constants/query_keys.ts` factories; mutations invalidate exactly the keys they affect; paginated lists use `keepPreviousData`; no global `throwOnError`.
- **Hooks:** rules of hooks; `exhaustive-deps` warnings fixed, not suppressed; no derived state in `useState` + `useEffect`; effects clean up; no stale closures.
- **Logic vs UI:** logic in hooks (one per file); `src/ui/` components are logic-free; a component needed by a second page is moved to `src/common/`, never imported across page folders or copied.
- **States:** skeletons shaped like the content; `error_state` with retry; `empty_state` with a hint; action buttons show `loading` and are disabled while pending; no page-blocking spinners; the full-screen loader only in the protected route.
- **URL state** for lists goes through the shared list-state hook; changing a filter or search resets to page 1.
- **Feedback:** every mutation notifies success and failure via the shared helper with constant texts; deletes confirm first, naming the record; 422 `details` map to form fields.
- **Routing:** new pages are lazy-loaded, default-exported, rendered through the route boundary; paths from `route_paths.ts`.
- **Accessibility:** visible labels, `aria-label` on icon-only buttons, keyboard-operable actions, status not shown by colour alone.
- **Styling:** Mantine components and theme-key props first; SCSS modules only when needed, using tokens; no static inline `style`, `!important`, or ID selectors; classes combined with `classnames`.
- **Performance:** memoisation per the project rules, but flag memoising trivial values as noise; stable `key`s (never indexes for changing lists); named imports for icons and libraries; debounced search.
- User-facing strings come from `src/constants/`.

### 5.6 Android (Kotlin, Jetpack Compose, coroutines)
- **Layering:** composables render and forward events; ViewModels hold one `StateFlow<UiState>` and call use cases; use cases hold the rules; repositories own data access; `platform/` components stay thin. No `Context` or `View` held by a ViewModel.
- **Dependencies:** passed through constructors and wired in the `AppContainer`; no singletons or `object` state holders inside classes; dispatchers and `Clock` injected, never `Dispatchers.IO` or `Instant.now()` referenced directly.
- **Kotlin safety:** no `!!`; platform types given an explicit Kotlin type; no `Any` for domain data; explicit types on public declarations; `when` over sealed types without `else`.
- **Coroutines:** no `GlobalScope` or `runBlocking`; no disk, network, or database work on the main thread; `CancellationException` rethrown; streams handled in chunks, never loaded whole into memory.
- **UI state:** no exposed `MutableStateFlow`; state collected with `collectAsStateWithLifecycle()`; screens split into `<Screen>Route` and a stateless `<Screen>Screen`; no `LaunchedEffect` mirroring state; one-off events not lost while the screen is stopped; stable `key`s in lazy lists.
- **States and feedback:** placeholders shaped like content, error state with retry, empty state with a hint, action buttons show progress and are disabled while pending, no screen-blocking spinners, destructive actions confirm first.
- **Resources and accessibility:** user-facing text from `strings.xml` (plurals for counts); colours, type, and spacing from the theme, no hardcoded dp or hex; `contentDescription` on icon-only buttons; 48dp touch targets; no colour-only status.
- **Security and privacy:** no personal data, file names, or file contents in logs; no direct `android.util.Log` outside the logger wrapper; explicit `android:exported`; cleartext and other exceptions scoped and recorded; no secrets in the APK; immutable `PendingIntent`s; file names from outside sanitised; no `MANAGE_EXTERNAL_STORAGE`.
- **Permissions:** requested at the moment of use, denial and "don't ask again" handled, each manifest permission explained in `docs/architecture.md`.
- **Lifecycle and background:** state survives rotation (ViewModel) and process death where it matters (`SavedStateHandle`); foreground services declare their type and show a stop action; wake and Wi-Fi locks released in `finally`.
- **Persistence:** DataStore, not `SharedPreferences`; Room schema changes have a migration and a test; no `fallbackToDestructiveMigration()` in release.
- **Build:** versions only in `libs.versions.toml`, pinned; `gradle.lockfile` updated with dependency changes; keep rules commented; no keystores or `local.properties` in the diff.

### 5.7 Tests
- New behaviour has a test named after the behaviour; bug fixes have a test that fails without the fix.
- Error paths are tested (404, 409, 422, 401), not only the happy path.
- Tests are deterministic: no real clock, network, or unseeded randomness; each builds its own data with factories; no dependence on seed data or order.
- Frontend tests mock at the network edge (API module or MSW), query by role and label, and don't assert on CSS classes or React Query internals.
- Android tests use fakes over mocks, `runTest` with injected test dispatchers and a fixed `Clock`, assert on the emitted `UiState`, and find Compose nodes by text, content description, or role (`testTag` only as a last resort).
- Coverage stays at the project threshold.

### 5.8 Project hygiene
- New runtime dependency: pinned exact version, lock file updated, a one-line reason in `docs/decisions.md`. Could a few lines of our own code replace it?
- Behaviour or setup changed → `README.md` / `docs/architecture.md` updated; significant design choice → ADR in `docs/decisions.md`; affected numbers → `docs/performance.md`; any project task log written.
- Commits (when reviewing commits): Conventional Commits, one logical change each, the TDD red → green order visible, a `Co-Authored-By:` trailer on AI-assisted commits.
- No dead code, commented-out code, debug logging, or TODOs without context.

## 6. Verify every finding before reporting it

For each candidate finding:
1. Re-read the exact code and its surroundings. Check whether it's already handled elsewhere (a validator, middleware, wrapper, or recorded decision).
2. Write the concrete failure: *input or state → what goes wrong*. If you can't, it's a question or a nit, not a bug.
3. Where cheap, prove it: run the relevant test, or write a throwaway test outside the repo and run it.
4. Drop findings that are style preferences not backed by a project rule, or that a linter already reports.

## 7. Severity

| Level | Meaning | Examples |
|---|---|---|
| **Blocker** | Must fix before merge or push | personal data logged, unprotected endpoint, data loss, broken migration, money as float, failing checks |
| **Major** | Should fix before merge | wrong status or response shape, missing soft-delete filter, missing invalidation, N+1 on a list endpoint, no test for new behaviour |
| **Minor** | Fix soon; fine in a follow-up | missing index reason in docs, inline string instead of a constant, weak test name |
| **Nit** | Optional polish | naming, small readability gains. **At most 5**; group the rest as one line |

Also allowed: **Question** (you need the author's intent to judge).

## 8. Output

```markdown
## Review: <scope, e.g. uncommitted changes in api/ and web/ (12 files)>

**Verdict:** Request changes | Approve with suggestions | Approve
<one or two sentences: the overall state and the one thing that matters most>

### Blockers
1. **<short title>** — `api/app/services/employee_service.py:44`
   - **Problem:** <what is wrong>
   - **Impact:** <concrete failure scenario>
   - **Rule:** <CLAUDE.md section, decision number, or general principle>
   - **Fix:**
     ```python
     <smallest change that fixes it>
     ```

### Major
...
### Minor
...
### Nits
...
### Questions
...

### Checks
| Check | Result |
|---|---|
| ruff check / format --check | ✅ / ❌ <count> |
| mypy --strict | ... |
| pytest | ... passed, ... failed |
| eslint / stylelint / tsc / vitest | ... |

### Done well
<1–3 specific things worth keeping, if any>

### Not reviewed
<files or areas skipped, and why>

### Summary
| # | Severity | File | Review comment |
|---|---|---|---|
| 1 | Blocker | `api/app/services/employee_service.py:44` | <one line: the problem and the fix> |
| 2 | Major | `web/src/queries/employee_queries.ts:12` | ... |
```

Rules for the output:
- Always cite `path:line`. Quote at most a few lines of code.
- Order findings by severity, then by risk. Omit empty sections.
- End with the Summary table: one row per finding (questions included), in the same order and numbering as the sections above. Keep each cell to one line so the table reads in a terminal: one `path:line` per row (name any other locations in the detailed finding) and a comment of one short sentence. With no findings, write "No findings" instead of the table.
- Fixes are minimal and follow the project's conventions (names, layers, constants, typing).
- If there are no findings, say so plainly and still show the checks.
- After the table, offer to apply the fixes. Don't apply them unprompted.
