# engineering-standards

Shared rules and a code review skill for my FastAPI + React/TypeScript projects. They're written for AI coding agents (Claude Code reads them through `CLAUDE.md`) and work just as well for humans.

## What's here

```
engineering-standards/
├── rules/
│   ├── common.md              design, data, privacy, dependencies, docs, testing, checks, commits
│   ├── fastapi.md             backend: structure, layers, REST and response contract, auth, data, migrations
│   └── react-typescript.md    frontend: structure, types, data fetching, UI states, styling, error boundaries
├── templates/
│   ├── CLAUDE.md              root CLAUDE.md for a project (imports the common rules)
│   ├── api/CLAUDE.md          imports the FastAPI rules
│   ├── api/Makefile           the check target (ruff, mypy, pytest with coverage)
│   ├── web/CLAUDE.md          imports the React rules
│   ├── web/eslint.config.js   ESLint flat config enforcing the frontend rules
│   └── web/vite.config.ts     @src alias, hashed build output, vendor chunks, Vitest
└── skills/
    └── code-review/SKILL.md
```

Each project keeps its own `CLAUDE.md` for what's specific to it (time zone, currency, deployment, overrides). The shared rules stay here, so a fix is made once.

## Use it in a project

### 1. Add the standards as a submodule

```bash
git submodule add https://github.com/akashvichhi/engineering-standards .standards
```

Update later with `git submodule update --remote .standards`, then commit the new pointer.

### 2. Add the CLAUDE.md files

Copy the templates and fill in the project section:

```bash
cp .standards/templates/CLAUDE.md CLAUDE.md
cp .standards/templates/api/CLAUDE.md api/CLAUDE.md
cp .standards/templates/web/CLAUDE.md web/CLAUDE.md
```

They import the shared rules with `@` paths (`@.standards/rules/common.md`), which Claude Code loads together with the file. Claude Code reads `api/CLAUDE.md` and `web/CLAUDE.md` only when it works in those folders, so a frontend task doesn't load the backend rules.

### 3. Add the frontend configs

```bash
cp .standards/templates/web/eslint.config.js web/eslint.config.js
cp .standards/templates/web/vite.config.ts web/vite.config.ts
```

Install the dev dependencies listed at the top of each file, and add `"paths": { "@src/*": ["./src/*"] }` to `web/tsconfig.app.json`.

### 4. Add the checks

- Backend: copy `templates/api/Makefile`, or add its `check` target to your own.
- Frontend: add the `check` script to `web/package.json` (see the Tooling section of `rules/react-typescript.md`).

### 5. Add the code review skill

Link the skill into the project, so it updates with the submodule:

```bash
mkdir -p .claude/skills
ln -s ../../.standards/skills/code-review .claude/skills/code-review
```

Or copy the folder instead of linking it, or put it in `~/.claude/skills/` to use it in every project on your machine. Then ask Claude Code to "review my changes", or run `/code-review`.

## Without a submodule

Copy `rules/*.md` into the project (for example into `docs/standards/`) and change the `@` paths in the CLAUDE.md files to match. You then update the copies by hand.

## Changing the standards

- Rules here apply to every project. Anything specific to one project goes in that project's `CLAUDE.md`.
- Keep rules concrete and checkable. Don't paste config files in; describe what they enforce and why.
- When a rule changes, check that `templates/` and the review skill still match it.
