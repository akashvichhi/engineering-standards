# engineering-standards

Shared rules and a code review skill for my projects. They're written for AI coding agents (Claude Code reads them through `CLAUDE.md`) and work just as well for humans.

A project **copies only the files for the stacks it uses**. It never includes this whole repo: a project without FastAPI has no FastAPI rules, and a project without Android has no Android rules.

## What's here

```
engineering-standards/
├── rules/
│   ├── common.md              every project: design, data, privacy, dependencies, docs, testing, checks, commits
│   ├── api-contract.md        projects with an HTTP API (server or client): REST, response shapes, pagination, sessions
│   ├── fastapi.md             FastAPI backend: structure, layers, Pydantic, SQLAlchemy, migrations
│   ├── react-typescript.md    React frontend: structure, types, data fetching, UI states, styling, error boundaries
│   └── kotlin-android.md      Android app: structure, layers, coroutines, Compose UI state, security, testing
├── templates/
│   ├── CLAUDE.md              root CLAUDE.md for a project (imports the common rules)
│   ├── api/                   CLAUDE.md (imports the FastAPI rules) and the Makefile check target
│   ├── web/                   CLAUDE.md (imports the React rules), ESLint and Vite configs
│   └── android/               CLAUDE.md (imports the Android rules)
└── skills/
    └── code-review/
        ├── SKILL.md           the review process; detects the project's stacks
        └── checklists/        one checklist per stack, used only when the project has that stack
```

Each rules file stands on its own for its stack. `common.md` never names a stack's paths or commands; each stack file has a **Paths and commands** table with them.

## Which files a project needs

| The project has | Copy these rules |
|---|---|
| Anything | `common.md` |
| An HTTP API, as server or client | `api-contract.md` |
| A FastAPI backend | `fastapi.md` |
| A React frontend | `react-typescript.md` |
| An Android app | `kotlin-android.md` |

Example: an Android app that hosts a small HTTP server with a React page copies `common.md`, `api-contract.md`, `kotlin-android.md`, and `react-typescript.md`, and nothing about FastAPI.

The code review skill is the one exception: it's copied whole, with every checklist, because it detects the project's stacks and ignores the checklists that don't apply.

## Use it in a project

### 1. Copy the rules

Copy the rules files from the table into the project's `docs/standards/`:

```bash
mkdir -p docs/standards
cp <standards>/rules/common.md <standards>/rules/<stack>.md ... docs/standards/
```

Record the standards commit you copied from in the project's root `CLAUDE.md`, so it's clear which version the project follows.

### 2. Add the CLAUDE.md files

Copy the root template and the template of each app folder the project has, then fill in the project sections:

```bash
cp <standards>/templates/CLAUDE.md CLAUDE.md
cp <standards>/templates/<app>/CLAUDE.md <app>/CLAUDE.md      # api, web, android: only the ones the project has
```

They import the copied rules with `@` paths (`@docs/standards/common.md`, `@../docs/standards/fastapi.md`), which Claude Code loads together with the file. Claude Code reads an app folder's `CLAUDE.md` only when it works in that folder, so a frontend task doesn't load the backend rules. Remove the `api-contract.md` import from the root `CLAUDE.md` if the project has no HTTP API.

### 3. Add the tooling configs

Copy the config templates for the project's stacks:
- FastAPI: `templates/api/Makefile` (or add its `check` target to your own).
- React: `templates/web/eslint.config.js` and `templates/web/vite.config.ts`. Install the dev dependencies listed at the top of each file, add `"paths": { "@src/*": ["./src/*"] }` to `web/tsconfig.app.json`, and add the `check` script to `web/package.json` (see the Tooling section of `react-typescript.md`).
- Android: add an `android/Makefile` with a `check` target (see the Tooling section of `kotlin-android.md`; a template follows once it's been tested in a project).

After copying, the project's config files are its source of truth.

### 4. Add the code review skill

Copy the whole skill folder. It detects the project's stacks (FastAPI from `pyproject.toml`, React from `package.json`, Android from its Gradle files) and uses only the matching checklists, so the same folder works in every project:

```bash
mkdir -p .claude/skills
cp -r <standards>/skills/code-review .claude/skills/code-review
```

Or put it in `~/.claude/skills/` once to use it in every project on your machine. Then ask Claude Code to "review my changes", or run `/code-review`.

### Updating a project

When the standards change, copy the changed files for the project's stacks again, update the recorded commit, and commit that as one `chore(standards): ...` change. Never edit the copies in the project; improve the standards here and copy them again.

## Changing the standards

- Rules here apply to every project of that stack. Anything specific to one project goes in that project's `CLAUDE.md`.
- Keep each stack's rules in its own file; `common.md` stays stack-neutral.
- Keep rules concrete and checkable. Don't paste config files in; describe what they enforce and why.
- When a rule changes, check that `templates/` and the matching review checklist still match it.
