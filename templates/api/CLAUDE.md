# Backend rules: <Project name>

@../.standards/rules/fastapi.md

## Project-specific backend rules

Only what differs from or adds to the shared FastAPI rules. Delete what doesn't apply.

- **Database:** <e.g. SQLite with WAL, via SQLAlchemy 2.x>
- **Entities and their layer files:** <e.g. employee, salary_insight, user, session>
- **Aggregates computed in Python, not SQL:** <e.g. median, because SQLite has no median (decision 12)>
- **Indexes:** see `docs/architecture.md`
- **Public endpoints (no auth):** <e.g. POST /api/v1/auth/login, GET /api/health>
