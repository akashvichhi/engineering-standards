# Common rules (backend, frontend, and Android)

Rules for AI agents and humans in every project that uses these standards. **MUST** and **NEVER** are hard rules; everything else is the strong default. A project's own `CLAUDE.md` may add rules or override one explicitly, with the reason.

"Backend" means `api/` (FastAPI); "frontend" means `web/` (React + TypeScript); "Android" means `android/` (Kotlin + Jetpack Compose). Stack rules live in [`fastapi.md`](fastapi.md), [`react-typescript.md`](react-typescript.md), and [`kotlin-android.md`](kotlin-android.md). A project uses only the sides it has.

---

## Design
- **MUST** follow DRY: every piece of knowledge (a rule, a constant, a message, a type) has exactly one home. Extract a shared function, hook, or component the second time the same logic appears. Don't build abstractions for reuse that might happen later.
- **One job per unit:** one reason to change per file, class, or function. Routers handle HTTP, services hold business rules, repositories run queries, UI components render.
- **Extend, don't edit chains:** add behaviour by adding code (a new filter, a new strategy) instead of growing `if/else` chains.
- **Small interfaces:** focused props and constructor arguments; no "god" objects.
- **Inject dependencies:** depend on what is passed in (FastAPI `Depends`, constructor arguments, hook parameters), not on module-level globals. That makes everything testable.
- Keep it simple. Build only what the project's requirements ask for. No features or configuration options nobody requested.

## Organisation and readability
- **MUST** keep each file in the folder of its layer (see the stack rules). If it's unclear where a file belongs, the structure is wrong; fix the structure.
- File and folder names are **snake_case** (`employee_service.py`, `employee_table.tsx`). Exception: Kotlin sources follow Kotlin's conventions (see `kotlin-android.md`).
- Functions are small and do one thing. Prefer early returns over nested `if`s.
- No magic numbers or strings: put them in named constants.
- Names describe intent (`calculateAverageSalary`, not `calc`). No abbreviations except well-known ones (`id`, `url`, `api`).
- Comments explain *why*, never *what*. No commented-out code, no dead code, no TODO without context.
- Everything is typed: Python checked by `mypy --strict`; TypeScript `strict: true`; Kotlin with explicit types on public declarations. **NEVER** use `any` (TS), untyped `dict` payloads (Python), or `Any` (Kotlin) for domain data.

## Data
- **NEVER** use floats for money. Backend: `Decimal` / `Numeric(precision, scale)`. Wire format: a decimal **string** (`"85000.00"`). Frontend: format only, with `Intl.NumberFormat`; the backend does all arithmetic.
- Dates and times are ISO 8601 strings on the wire (`2026-10-31`, `2026-01-01T14:30:00+05:30`).
- The app's time zone and display formats are **one constant per app** (backend `constants/time_constants.py`, frontend `src/constants/time_constants.ts`, Android `constants/TimeConstants.kt`). **NEVER** depend on the server's, the browser's, or the device's local time zone. The project's `CLAUDE.md` states which zone and formats it uses.
- **Soft delete:** if a table uses soft delete, every query on it goes through **one** helper that applies the filter (e.g. `active_employees()`), including counts, aggregates, option lists, and uniqueness checks. A direct query on that model without the helper is a bug.

## Security, privacy, and configuration
- **NEVER** commit secrets, `.env` files, or database files. Commit a `.env.example` listing every variable.
- Configuration comes from environment variables (Android: build-time values), read in **exactly one place** per app (backend `core/config.py`, frontend `src/config/env.ts`, Android `config/AppConfig.kt`).
- Browser authentication uses server-side sessions in **httpOnly cookies** (see the stack rules). **NEVER** store tokens or session IDs anywhere JavaScript can read them.
- **Personal data:** **NEVER** log names, emails, salaries, or other personal data, or request/response bodies that contain them. Logs may contain IDs, routes, status codes, and timings only. Error messages never echo personal data back.
- **NEVER** show stack traces, SQL, file paths, or other internals to users.

## Dependencies
- Lock files are **always committed** (`api/uv.lock`, `web/package-lock.json`, Android `gradle.lockfile`), and installs use them (`uv sync --frozen`, `npm ci`, Gradle dependency locking).
- Pin exact versions; no `latest`, no ranges.
- Add a library only when it clearly beats a few lines of our own code. Every new runtime dependency gets a one-line reason in `docs/decisions.md`.
- Hold a tool back when its plugins don't support the newest major yet, and record why in `docs/decisions.md`.

## Docs
- A significant design decision or trade-off gets an ADR-style entry in `docs/decisions.md`: context, options considered, decision, consequences. Number the entries; code comments and reviews refer to them ("decision 16").
- Behaviour or setup changes update `README.md` or `docs/architecture.md` in the same commit.
- Performance claims are proven with measured numbers in `docs/performance.md`, never guesses. Update them when a change affects them.
- Config files (`pyproject.toml`, `Makefile`, `eslint.config.js`, `stylelint.config.js`, `tsconfig*.json`, `vite.config.ts`, `*.gradle.kts`, `libs.versions.toml`, detekt config) are the source of truth for tooling. **NEVER** copy their contents into `CLAUDE.md` or docs; link to them, and explain only rules whose reason isn't obvious.

## Testing
- **Test first (TDD):** write a failing test, make it pass, then refactor.
- Tests are fast, deterministic (no network, no real clock, fixed random seeds), independent, and named after the behaviour they check.
- While working, run only the tests related to the change (e.g. `uv run pytest tests/unit/services/test_employee_service.py`, `npx vitest run src/utils`, `./gradlew testDebugUnitTest --tests "*EmployeeRepositoryTest"`).

## Quality checks
- Run the full checks **once, when the work is finished and before committing**, not after each edit. Run only the side(s) the change touched:
  - Backend: `make check` (`ruff check --fix`, `ruff format`, `mypy --strict`, `pytest` with the coverage threshold)
  - Frontend: `npm run check` (ESLint, Stylelint, type check, tests)
  - Android: `make check` in `android/` (ktlint, detekt, Android Lint, unit tests with the Kover coverage threshold)
- If a check fails, fix it and run the full check again.
- Coverage is enforced, not just reported: `make check` fails below the project threshold (default 90%). Keep the threshold out of pytest's default options, so a single-file run doesn't fail on coverage.
- **Definition of done:** all checks pass, docs are updated if behaviour changed, and any project-specific log (e.g. `docs/ai-workflow.md`) is written.

## Commits
- **One commit = one logical change.** Never mix a feature, a refactor, and a formatting change.
- **The TDD rhythm is visible in the history** for every behaviour:
  1. `test(employees): add failing test for duplicate email` (red)
  2. `feat(employees): reject duplicate email` (green)
  3. `refactor(employees): extract email normaliser` (only when there's something to refactor)
- A red commit is allowed only when the green commit follows it directly. **NEVER** push a branch whose last commit fails the checks.
- **Message format** (Conventional Commits):
  ```
  <type>(<scope>): <summary in imperative mood, lowercase, no full stop, max 72 chars>

  <optional body: WHY the change was made, not what; wrap at 72>
  ```
  - Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore` (tooling, deps, config), `perf`, `style` (formatting only).
  - Scopes: `api`, `web`, `android`, or a feature (`employees`, `auth`), e.g. `feat(web/employees): add salary filter`.
- AI-assisted commits end with a `Co-Authored-By:` trailer naming the AI tool.
- **Stage files explicitly** (`git add api/app/services/employee_service.py ...`). **NEVER** `git add .` or `git add -A` without checking `git status` first.
- **NEVER commit:** `.env` files, database files, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`, coverage output, Android `build/`, `.gradle/`, `local.properties`, keystores (`*.jks`, `*.keystore`). They go in `.gitignore` before the first commit that adds code or config.
- `.gitattributes` forces LF line endings (`* text=auto eol=lf`).
- Docs change in the same commit as the behaviour they describe (or in a `docs:` commit right after it).

### AI agents: approval before every commit and push
- **AI agents NEVER commit or push without the user's explicit approval.** For each commit:
  1. Finish the change (for a red commit: the failing test only).
  2. Stop and show the files changed, a short summary of what and why, the proposed commit message, and the check results (for a red commit: the failing test output).
  3. Wait. If the user gives more instructions, apply them and show the result again.
  4. Commit only after the user says so ("commit", "looks good, commit"). Approval covers that one commit only.
- Red and green commits are proposed and approved separately, in that order.
- Pushing needs its own explicit approval, every time.

## Code review
- Review changes with the [`code-review`](../skills/code-review/SKILL.md) skill before asking for commit approval on anything non-trivial.
