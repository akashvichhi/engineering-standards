---
name: code-review
description: Staff-level code review of changes in a repo that follows engineering-standards, enforcing the repo's CLAUDE.md rules first, with a checklist per stack the project uses. Use when asked to review a diff, PR, branch, commit, or files.
---

# Code review

Review like a staff engineer: find what would break, leak, or slow down in production, check it against the project's own rules, and give fixes the author can act on. Fewer real findings beat a long list of guesses.

**This skill only reviews.** Never edit files, stage, commit, push, run migrations against a real database, or run a seed script against anything but a throwaway database. If the user then asks for fixes, apply them following the repo's commit rules (with engineering-standards: show the change and wait for approval before every commit).

## Stack checklists

The `checklists/` folder next to this file holds one checklist per stack. The skill ships with all of them; before reviewing, **detect which stacks the project has** and use only those checklists. A checklist for a stack the project doesn't have is ignored entirely: never raise a finding from it.

| Checklist | Use it when the project has |
|---|---|
| `fastapi.md` | `fastapi` in a `pyproject.toml` (usually `api/pyproject.toml`) |
| `react-typescript.md` | `react` in a `package.json` dependencies (usually `web/package.json`) |
| `kotlin-android.md` | an Android Gradle project: `com.android.application` or `com.android.library` in a `build.gradle.kts` (usually under `android/`) |
| `api-contract.md` | any of the above serving or calling an HTTP API, or an `api-contract.md` among the project's copied rules |

If the project's `CLAUDE.md` files name its stacks, they win over detection. State the detected stacks in the review's first line (e.g. "Stacks: android, react, api-contract"). Then apply each detected checklist to the part of the change it covers (e.g. the React checklist to `web/` files only).

## 1. Decide the scope

Use what the user named. Otherwise, in this order:

| User says | Diff to review |
|---|---|
| A PR number or URL | `gh pr diff <n>` and `gh pr view <n>` (read the description) |
| A branch | `git diff <default-branch>...<branch>` |
| A commit or range | `git show <sha>` / `git diff <a>..<b>` |
| Files or a folder | those files in full |
| Nothing specific | uncommitted work: `git diff`, `git diff --staged`, and untracked files from `git status --porcelain`. If there is none, the last commit (`git show HEAD`), and say so |

State the scope and the detected stacks in the first line of the review. If the diff is over ~1,500 changed lines, review the riskiest parts first (auth, money, data access, migrations, API contract) and list what was skipped.

## 2. Load the project's rules

1. Read every `CLAUDE.md` that applies (the repo root and each app folder's) and every file they import (e.g. `docs/standards/*.md`). **Project rules override this skill.** Where a checklist and the project disagree, follow the project.
2. Skim `docs/decisions.md` (or ADRs) for decisions touching the changed code. Never flag something a recorded decision explicitly allows; cite the decision instead if it matters.
3. Read `docs/requirements.md` when a change adds behaviour, to check it was asked for.
4. Tooling config files (each stack's rules list them) are the source of truth for tooling, even if a doc quotes an older copy.

## 3. Understand the change before judging it

- Read each changed file **in full**, not only the hunks. Follow the change one level out: callers of a changed function, the code that uses a changed service, hook, type, or component.
- For an API change, open both sides of the contract: the server's request and response shapes and the client's types, endpoint constants, API functions, and data hooks.
- Note which tests were added or changed, and which behaviour has none.

## 4. Run the checks without modifying files

Each project's full check (`make check`, `npm run check`, ...) runs formatters and `--fix`, which **rewrite files**. During a review, run the read-only commands from each relevant checklist instead.

Run only the parts the change touches. If a tool is missing, say so and continue. Report the results in one block; don't turn each lint error into a separate finding. Spend the review on what tools can't catch.

## 5. Checklist

Work through it in priority order: these general items first, then each stack checklist that applies. Each item is a question; only raise a finding when the answer is a real problem in this diff.

### 5.1 Correctness and data integrity
- Does the code do what the change claims, including empty, null, boundary, and duplicate inputs?
- Pagination: off-by-one, a page beyond the last, 0 results?
- Race conditions: double submits, an action finishing after the user navigated away, a stale response overwriting a newer one?
- Money: never a float type or float parsing; arithmetic only where the data is owned, with the project's rounding.
- Time: never the real clock or the machine's local zone directly; the app's time-zone constant and injected clock instead.

### 5.2 Security and privacy
- **Personal data in logs or errors:** names, emails, salaries, file names, or request/response bodies in any log call, exception message, or error response. Always a blocker.
- Internals (stack traces, SQL, file paths) shown to users?
- Secrets, `.env` or local settings files, signing keys, database files, or build output in the diff.

### 5.3 Stack checklists
Apply each checklist for a detected stack to the part of the change it covers. Skip the others.

### 5.4 Tests
- New behaviour has a test named after the behaviour; bug fixes have a test that fails without the fix.
- Error paths are tested, not only the happy path.
- Tests are deterministic: no real clock, network, or unseeded randomness; each builds its own data with factories; no dependence on seed data or order.
- Coverage stays at the project threshold.

### 5.5 Project hygiene
- New runtime dependency: pinned exact version, lock file updated, a one-line reason in `docs/decisions.md`. Could a few lines of our own code replace it?
- Behaviour or setup changed → `README.md` / `docs/architecture.md` updated; significant design choice → ADR in `docs/decisions.md`; affected numbers → `docs/performance.md`; any project task log written.
- Commits (when reviewing commits): Conventional Commits, one logical change each, the TDD red → green order visible, no hand-written attribution text.
- No dead code, commented-out code, debug logging, or TODOs without context.
- Names, constants, and messages in their stack's single home (no inline strings or magic numbers).

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
| **Major** | Should fix before merge | wrong status or response shape, missing soft-delete filter, missing cache invalidation, N+1 on a list endpoint, no test for new behaviour |
| **Minor** | Fix soon; fine in a follow-up | missing reason in docs, inline string instead of a constant, weak test name |
| **Nit** | Optional polish | naming, small readability gains. **At most 5**; group the rest as one line |

Also allowed: **Question** (you need the author's intent to judge).

## 8. Output

```markdown
## Review: <scope, e.g. uncommitted changes in android/ and web/ (12 files)> · Stacks: <detected stacks>

**Verdict:** Request changes | Approve with suggestions | Approve
<one or two sentences: the overall state and the one thing that matters most>

### Blockers
1. **<short title>** — `<path>:<line>`
   - **Problem:** <what is wrong>
   - **Impact:** <concrete failure scenario>
   - **Rule:** <CLAUDE.md section, decision number, or general principle>
   - **Fix:**
     ```
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
| <each read-only check run> | ✅ / ❌ <count> |

### Done well
<1–3 specific things worth keeping, if any>

### Not reviewed
<files or areas skipped, and why>

### Summary
| # | Severity | File | Review comment |
|---|---|---|---|
| 1 | Blocker | `<path>:<line>` | <one line: the problem and the fix> |
| 2 | Major | `<path>:<line>` | ... |
```

Rules for the output:
- Always cite `path:line`. Quote at most a few lines of code.
- Order findings by severity, then by risk. Omit empty sections.
- End with the Summary table: one row per finding (questions included), in the same order and numbering as the sections above. Keep each cell to one line so the table reads in a terminal: one `path:line` per row (name any other locations in the detailed finding) and a comment of one short sentence. With no findings, write "No findings" instead of the table.
- Fixes are minimal and follow the project's conventions (names, layers, constants, typing).
- If there are no findings, say so plainly and still show the checks.
- After the table, offer to apply the fixes. Don't apply them unprompted.
