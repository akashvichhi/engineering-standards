# CLAUDE.md: <Project name>

<One or two sentences: what the product does and who uses it.> Requirements live in `docs/requirements.md`.

This project follows [engineering-standards](https://github.com/akashvichhi/engineering-standards). The shared rules are imported below; the rules in this file add to them or override them, with the reason.

@.standards/rules/common.md

Backend rules load from `api/CLAUDE.md` and frontend rules from `web/CLAUDE.md` when working in those folders.

## Repo layout

```
<project>/
├── api/            FastAPI project (SQLAlchemy + <database>)
├── web/            React project (TypeScript + Vite + Mantine)
├── docs/           requirements, architecture, decisions, performance
├── .standards/     engineering-standards (git submodule; don't edit here)
├── Dockerfile
└── CLAUDE.md
```

## Project rules

Only what is specific to this project. Delete the examples that don't apply.

- **Time zone and formats:** <e.g. IST (Asia/Kolkata, UTC+05:30) everywhere; dates shown as DD/MM/YYYY>.
- **Currency:** <e.g. every amount is USD, so there is no currency field>.
- **Personal data in this app:** <e.g. salaries, emails, names>. Never logged (see common rules).
- **Soft-deleted tables:** <e.g. `employees`, filtered through `active_employees()` (decision 16)>.
- **Deployment:** <e.g. Render auto-deploys every push to `master`>.
- **Task log:** <e.g. after every task, add an entry to `docs/ai-workflow.md`: prompt, what the AI produced, what was changed and why, how it was verified>.
- **Overrides:** <rule from the standards> → <what this project does instead, and why>.
