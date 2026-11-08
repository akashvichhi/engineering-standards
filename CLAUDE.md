# CLAUDE.md: engineering-standards

This repo holds shared rules (`rules/`), project templates (`templates/`), and skills (`skills/`) for FastAPI + React/TypeScript projects. Projects use it as a git submodule at `.standards/`. See `README.md`.

## Rules for working in this repo
- Rules are for **every** project. Anything specific to one product (its entities, time zone, currency, hosting) belongs in that project's `CLAUDE.md`, not here. Examples may use a generic `employee` entity.
- Keep rules concrete and checkable: **MUST** / **NEVER** for hard rules, a short reason where it isn't obvious. No vague principles without a concrete rule.
- Config lives only in `templates/` (e.g. `templates/web/eslint.config.js`, `templates/web/vite.config.ts`). **NEVER** paste config contents into `rules/`; describe what it enforces and link to the template.
- When a template config changes, update the tested dependency versions in its header comment.
- Folder trees describe folders and their purpose, not individual files.
- When a rule changes, update in the same commit: the matching section of `skills/code-review/SKILL.md`, and any affected file in `templates/`.
- Paths inside `templates/` are written for the project they'll be copied into (`@.standards/...`, `@../.standards/...`).
- Markdown only; no build step. Keep each rules file readable on its own.

## Commits
- Conventional Commits: `<type>(<scope>): <summary>`, scopes `rules`, `templates`, `skills`, `readme`.
- **AI agents NEVER commit or push without the user's explicit approval.** Show the changed files, a summary, and the proposed commit message, then wait. Approval covers one commit; pushing needs its own approval every time.
- Stage files explicitly; **NEVER** `git add .` without checking `git status`.
- AI-assisted commits end with a `Co-Authored-By:` trailer.
