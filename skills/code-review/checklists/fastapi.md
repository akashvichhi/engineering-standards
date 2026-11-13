# Checklist: FastAPI backend

Use when the change touches `api/`. Rules: `fastapi.md`.

## Read-only checks

```bash
# api/
uv run ruff check .
uv run ruff format --check .
uv run mypy <the paths the Makefile's typecheck target uses>
uv run pytest -q            # add the Makefile's --cov options for a full-branch review
```

## Checklist
- **Layering:** routers parse, call one service method, return a resource. Services hold rules and raise domain exceptions (**never** `HTTPException`). Repositories own queries. Models hold columns only. Routers never return ORM models.
- Dependencies injected via constructors and wired in `api/dependencies.py`; no module-level globals or sessions created inside services.
- **`def` vs `async def`:** with a synchronous driver, endpoints and dependencies are plain `def`. Flag any blocking call (DB, file, `time.sleep`, sync HTTP) inside `async def`.
- Pydantic: validation and normalisation live in request schemas (trim, reject blank, lowercase emails, uppercase codes, limits from constants). Partial updates use `model_dump(exclude_unset=True)`, not `exclude_none`.
- Pagination built only with `PaginatedResponse.create`; list requests extend `PaginationRequest`.
- **Security:** new routers covered by the router-level `Depends(get_current_user)`; SQL never built from strings with user input (`text(f"...")`, `.format`, `%`); `LIKE` uses `autoescape=True`; resources don't leak password hashes, session data, or internal flags.
- **Soft delete:** every query on a soft-deleted model goes through the project's filter helper (e.g. `active_employees()`), including counts, aggregates, option lists, and uniqueness checks.
- Queries: aggregates in SQL (`GROUP BY`), not Python loops over all rows (unless a recorded decision says otherwise). Watch for N+1 queries, counts that ignore the active filters, and loading whole rows when columns suffice.
- Indexes: a new filter, sort, or group column has an index (and a one-line reason in `docs/architecture.md`).
- Transactions: commit/rollback in one place (the service); no partial writes on error; uniqueness enforced by a DB constraint **and** a service check.
- **Migrations:** every model change has an Alembic migration; SQLite changes use `batch_alter_table`; new non-null columns on existing tables have a `server_default`; `downgrade()` works; no `create_all()` in app code.
- Money as `Decimal`; time never from naive `datetime.now()` or `date.today()`.
- Settings read only through `core/config.py`; no `os.environ` / `os.getenv` elsewhere. Messages from `constants/messages.py`.
- Typing: passes `mypy --strict` without new `# type: ignore` or `Any`; no untyped `dict` payloads for domain data.
- **Tests:** error paths (404, 409, 422, 401) tested, not only the happy path; data from `tests/factories.py`; auth changes keep the auth tests listed in `fastapi.md`.
- **Never in the diff:** `.env`, `.venv/`, database files, coverage output.
