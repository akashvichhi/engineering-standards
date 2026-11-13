# CLAUDE.md: engineering-standards

This repo holds shared rules (`rules/`), project templates (`templates/`), and skills (`skills/`). Projects never include the whole repo: they copy only the rules for the stacks they use into `docs/standards/`. The code-review skill is installed once per machine (`~/.claude/skills/`); it detects the project's stacks and ignores the other checklists. See `README.md`.

## Rules for working in this repo
- Rules are for **every** project of their stack. Anything specific to one product (its entities, time zone, currency, hosting) belongs in that project's `CLAUDE.md`, not here. Examples may use a generic `employee` entity.
- **Every file must make sense when copied alone with `common.md`.** `common.md` is stack-neutral: it never names a stack's paths, files, or commands; each stack file gives them in its **Paths and commands** table. A stack file never relies on another stack's file, except `api-contract.md` for stacks that serve or call an HTTP API.
- **Copied files never mention this repo.** Rules, templates, and the skill read as the project's own rules: no repo name or link, no commit SHA, no "copied" or "these standards" wording, no `templates/` paths, no other stacks named. Notes about this repo itself (how to copy, how templates evolve) go in this file or `README.md`.
- Rules files link only to other files in `rules/`, and refer to config by its path in the project (`web/vite.config.ts`), not by its template path.
- Keep rules concrete and checkable: **MUST** / **NEVER** for hard rules, a short reason where it isn't obvious. No vague principles without a concrete rule.
- Config lives only in `templates/` (e.g. `templates/web/eslint.config.js`, `templates/web/vite.config.ts`). **NEVER** paste config contents into `rules/`; describe what it enforces and name the config file by its project path.
- Config templates for a stack without one yet (e.g. Android's `Makefile`, detekt config, version catalog) are added to `templates/<app>/` once they've been tested in a project, with their tested versions in a header comment. Improvements found in a project's copy go back into the template.
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
