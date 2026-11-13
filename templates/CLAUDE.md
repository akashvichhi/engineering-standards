# CLAUDE.md: <Project name>

<One or two sentences: what the product does and who uses it.> Requirements live in `docs/requirements.md`.

This project follows [engineering-standards](https://github.com/akashvichhi/engineering-standards), copied at commit `<sha>` into `docs/standards/` (only the files for this project's stacks). The shared rules are imported below; the rules in this file add to them or override them, with the reason.

@docs/standards/common.md
@docs/standards/api-contract.md

Keep the `api-contract.md` import only if the project has an HTTP API. Stack rules load from each app folder's `CLAUDE.md` (`api/`, `web/`, `android/`, ...) when working in that folder.

## Repo layout

Keep only the folders this project has.

```
<project>/
├── api/            FastAPI project (SQLAlchemy + <database>)
├── web/            React project (TypeScript + Vite + Mantine)
├── android/        Android app (Kotlin + Jetpack Compose)
├── docs/           requirements, architecture, decisions, performance
│   └── standards/  the copied engineering-standards rules (update by copying again, never edit here)
├── .claude/skills/ the copied code-review skill (detects this project's stacks)
└── CLAUDE.md
```

## Project rules

Only what is specific to this project. Delete the examples that don't apply.

- **Time zone and formats:** <e.g. IST (Asia/Kolkata, UTC+05:30) everywhere; dates shown as DD/MM/YYYY>.
- **Currency:** <e.g. every amount is USD, so there is no currency field>.
- **Personal data in this app:** <e.g. salaries, emails, names>. Never logged (see common rules).
- **Soft-deleted tables:** <e.g. `employees`, filtered through `active_employees()` (decision 16)>.
- **Public endpoints (no session):** <e.g. POST /api/v1/auth/login, GET /api/health>.
- **Deployment:** <e.g. Render auto-deploys every push to `master`>.
- **Task log:** <e.g. after every task, add an entry to `docs/ai-workflow.md`: prompt, what the AI produced, what was changed and why, how it was verified>.
- **Overrides:** <rule from the standards> → <what this project does instead, and why>.
