# CLAUDE.md: <Project name>

<One or two sentences: what the product does and who uses it.> Requirements live in `docs/requirements.md`.

The project's general rules live in `docs/standards/` and are imported below; the rules in this file add to them or override them, with the reason.

@docs/standards/common.md
@docs/standards/api-contract.md

Keep the `api-contract.md` import only if the project has an HTTP API. Stack rules load from each app folder's `CLAUDE.md` when working in that folder.

## Repo layout

One line per app folder this project has.

```
<project>/
├── <app>/          <what it is and its stack>, one line per app folder
├── docs/           requirements, architecture, decisions, performance
│   └── standards/  general rules: common, API contract, one file per stack
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
- **Overrides:** <rule from docs/standards/> → <what this project does instead, and why>.
