# Backend rules: <Project name>

@../docs/standards/fastapi.md

## Project-specific backend rules

Only what differs from or adds to the FastAPI rules in `docs/standards/`. Delete what doesn't apply.

- **Database:** <e.g. SQLite with WAL, via SQLAlchemy 2.x>
- **Entities and their layer files:** <e.g. employee, salary_insight, user, session>
- **Aggregates computed in Python, not SQL:** <e.g. median, because SQLite has no median (decision 12)>
- **Indexes:** see `docs/architecture.md`
