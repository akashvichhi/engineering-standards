# CLAUDE.md: engineering-standards

This repo holds shared rules (`rules/`), project templates (`templates/`), and skills (`skills/`). Projects never include the whole repo: they copy only the rules for the stacks they use into `docs/standards/`. The code-review skill is copied whole into `.claude/skills/`; it detects the project's stacks and ignores the other checklists. See `README.md`.

## Rules for working in this repo
- Rules are for **every** project of their stack. Anything specific to one product (its entities, time zone, currency, hosting) belongs in that project's `CLAUDE.md`, not here. Examples may use a generic `employee` entity.
- **Every file must make sense when copied alone with `common.md`.** `common.md` is stack-neutral: it never names a stack's paths, files, or commands; each stack file gives them in its **Paths and commands** table. A stack file never relies on another stack's file, except `api-contract.md` for stacks that serve or call an HTTP API.
- Rules files link only to other files in `rules/`. Templates are referred to by name ("the engineering-standards template `templates/web/vite.config.ts`"), never by a relative link, because they aren't copied into projects.
- Keep rules concrete and checkable: **MUST** / **NEVER** for hard rules, a short reason where it isn't obvious. No vague principles without a concrete rule.
- Config lives only in `templates/` (e.g. `templates/web/eslint.config.js`, `templates/web/vite.config.ts`). **NEVER** paste config contents into `rules/`; describe what it enforces and point to the template.
- When a template config changes, update the tested dependency versions in its header comment.
- Folder trees describe folders and their purpose, not individual files.
- When a rule changes, update in the same commit: the matching checklist in `skills/code-review/checklists/` (or `SKILL.md` for a `common.md` rule), and any affected file in `templates/`.
- A new stack gets a rules file, a checklist with the same name, a detection row in `SKILL.md`'s stack table, a `templates/<app>/CLAUDE.md`, and a row in the README's "Which files a project needs" table.
- Paths inside `templates/` are written for the project they'll be copied into (`@docs/standards/...`, `@../docs/standards/...`).
- Markdown only; no build step.

## Commits
- Conventional Commits: `<type>(<scope>): <summary>`, scopes `rules`, `templates`, `skills`, `readme`.
- **AI agents NEVER commit or push without the user's explicit approval.** Show the changed files, a summary, and the proposed commit message, then wait. Approval covers one commit; pushing needs its own approval every time.
- Stage files explicitly; **NEVER** `git add .` without checking `git status`.
