# Backend rules (FastAPI)

Stack: Python 3.13+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, `uv`. Examples use an `employee` entity; replace it with your own.

Read [`common.md`](common.md) first. These rules add to it.

---

## Folder structure

Describe folders and their purpose, not every file, so this stays true as files are added.

```
api/
├── app/
│   ├── main.py        app factory: creates FastAPI, registers middleware, routers, exception handlers
│   ├── core/          cross-cutting infrastructure: config (the ONLY place env vars are read), database
│   │                  engine and session dependency, domain exceptions and their handlers, security
│   │                  (hashing, tokens), middleware, logging filters, money rules
│   ├── constants/     named constants, one file per domain; messages.py holds every user-facing message
│   ├── models/        SQLAlchemy ORM models: tables, indexes, constraints. No logic
│   ├── repositories/  database access: queries, filters, sorting, pagination, aggregation
│   ├── services/      business rules, orchestration, transactions
│   ├── schemas/
│   │   ├── requests/  input validation and normalisation (body and query params)
│   │   ├── resources/ output shapes: exactly which fields leave the API
│   │   └── common/    shared shapes: Money, DataResponse[T], PaginatedResponse[T], ErrorResponse
│   └── api/
│       ├── dependencies.py   wires repositories and services for Depends(), incl. get_current_user
│       └── v1/
│           ├── api_router.py all v1 routers, under /api/v1
│           └── routers/      the "controllers", one per resource
├── migrations/        Alembic
├── scripts/           seed and start scripts
├── tests/
│   ├── conftest.py    test database, client, fixtures
│   ├── factories.py   deterministic test-data builders
│   ├── unit/          mirrors app/
│   └── integration/   HTTP tests through the TestClient
├── pyproject.toml
├── Makefile           the check target
└── .env.example
```

## Naming
- Modules, functions, variables: `snake_case`. Classes: `PascalCase`. Constants: `UPPER_SNAKE_CASE`.
- Every layer file is `<entity>_<layer>.py` (`employee_model.py`, `employee_repository.py`, `employee_service.py`, `employee_router.py`, `employee_request.py`, `employee_resource.py`), so editor tabs never show five files called `employee.py`.
- Classes follow the same pattern: `EmployeeRepository`, `EmployeeService`, `EmployeeCreateRequest`, `EmployeeResource`.
- Tests: `test_<module>.py`; functions `test_<behaviour>`, e.g. `test_create_employee_rejects_duplicate_email`.

## Layer responsibilities

| Layer | Does | NEVER does |
|---|---|---|
| Router | Declares the route, parses input via request schemas, calls ONE service method, returns a resource with the right status code | Business logic, queries, domain `if` rules |
| Request schema | Validates and normalises shape and format (types, required fields, ranges, enums, codes) | Database lookups |
| Service | Business rules (uniqueness, existence), orchestration, transactions | SQL details, HTTP concerns. **NEVER** raises `HTTPException`; raises domain exceptions |
| Repository | Queries, filters, sorting, pagination, SQL aggregation | Business decisions |
| Resource schema | Defines exactly which fields leave the API | Logic, computed business values |
| Model | Columns, indexes, constraints | Logic |

- Services raise domain exceptions from `core/exceptions.py`; `core/exception_handlers.py` maps them (`NotFoundError` → 404, `ConflictError` → 409, `DomainValidationError` → 422, `UnauthenticatedError` → 401).
- Services and repositories receive dependencies through constructors, wired with `Depends()` in `api/dependencies.py`.
- Routers **NEVER** return ORM models; always a resource schema, declared with `response_model`.

## REST conventions
- Base path `/api/v1`. Resources are plural kebab-case nouns: `/employees`, `/salary-insights`.

| Action | Method and path | Success |
|---|---|---|
| List | `GET /employees?page=1&per_page=20&search=&sort=-salary` | 200 |
| Get one | `GET /employees/{id}` | 200 |
| Create | `POST /employees` | 201 |
| Update (partial) | `PATCH /employees/{id}` | 200 |
| Delete | `DELETE /employees/{id}` | 204, no body |

- Query parameters and JSON keys are `snake_case`.
- Sorting: `sort=<field>` ascending, `sort=-<field>` descending. Sort fields are an allow-listed enum.
- **NEVER** use data values as JSON object keys (`{ "India": {...} }`). Return arrays of objects (`[{ "country": "India", ... }]`). That keeps responses typed, ordered, and safe for the frontend's case conversion.
- `GET` endpoints **NEVER** change data.

## Response contract (identical for every endpoint)

```json
{ "data": { "id": 1, "full_name": "Asha Rao", "salary": "85000.00" } }
```
```json
{
  "data": [ { "id": 1, "full_name": "Asha Rao" } ],
  "meta": { "total_count": 10000, "current_page": 1, "per_page": 20, "total_pages": 500 }
}
```
```json
{ "error": "Employee not found" }
```
Validation errors (422), and any domain error about one field (e.g. a 409 for a taken email), may add `details`, so the UI can highlight the right input:
```json
{ "error": "Validation failed", "details": [ { "field": "salary", "message": "Salary must be greater than 0" } ] }
```

- **MUST** replace FastAPI's default `{ "detail": ... }` errors by registering handlers for `RequestValidationError`, `starlette.exceptions.HTTPException` (also covers unknown routes), the domain exceptions, and `Exception`.
- 500 responses return a generic message and log the stack trace (without personal data).

## Pagination
- Every paginated endpoint uses two generic schemas: `PaginationRequest` (`page ≥ 1`, `per_page` between 1 and `MAX_PER_PAGE`, an `offset` property) and `PaginatedResponse[T]` (`data`, `meta`) with a `create(items, total_count, pagination)` class method.
- Defaults live in `constants/`: `DEFAULT_PAGE = 1`, `DEFAULT_PER_PAGE = 20`, `MAX_PER_PAGE = 100`. Above the max → 422.
- A list's query schema **extends** `PaginationRequest` with its filters (`EmployeeListRequest(PaginationRequest)`), and its route declares `response_model=PaginatedResponse[EmployeeResource]`.
- The repository returns `(items, total_count)`. The service builds the response **only** with `PaginatedResponse.create(...)`. **NEVER** build `meta` by hand or redefine its fields per feature.
- Edge cases: 0 results → `data: []`, `total_pages: 0`. A page beyond the last → 200 with `data: []` and the real `meta`, not a 404.

## Input normalisation
Happens in request schemas (Pydantic validators), so services and the database only see clean data:
- trim every text field; reject strings that are empty after trimming
- lowercase emails
- uppercase codes (country, currency) and validate them against the allowed list
- limits come from constants, never inline numbers

Partial updates use `request.model_dump(exclude_unset=True)`, never `exclude_none` (which can't clear a field and silently drops explicit nulls).

## Data, queries, and performance
- **Endpoints and dependencies are plain `def`, not `async def`, while the database driver is synchronous.** FastAPI runs `def` in a thread pool; a blocking call inside `async def` freezes the event loop for every request. Use `async def` only for code that awaits truly async I/O.
- Aggregations (count, min, max, avg per group) run in **SQL** (`GROUP BY`), never by loading all rows into Python. If the database lacks a function (e.g. median in SQLite), compute it in Python on the filtered rows and record the decision.
- Index every column used for filtering, sorting, or grouping, plus composite indexes for common filter combinations. Every index gets a one-line reason in `docs/architecture.md`.
- Search with `LIKE` uses `autoescape=True` (or explicit escaping), so `%` and `_` match literally.
- **NEVER** build SQL from strings with user input (`text(f"...")`, `.format`, `%`).
- Watch for N+1 queries; load only the columns a query needs.
- Uniqueness is enforced **twice**: a unique index (the guarantee) and a service check (the friendly 409).
- Responses are compressed with `GZipMiddleware` (with a `minimum_size`).
- Timestamps (`created_at`, `updated_at`) are set by the database layer (column defaults, `onupdate`), never by hand in services, and are time-zone aware on the wire.
- Seed scripts use bulk inserts and a fixed random seed.

## Migrations
- Every model change has an Alembic migration. **NEVER** `create_all()` in application code.
- SQLite: use `batch_alter_table`; apply `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` on every connection in `core/database.py`.
- A new non-null column on an existing table has a `server_default`.
- `downgrade()` works and is tested by a migration round-trip test.

## Authentication (server-side sessions in httpOnly cookies)
- On login, create a session row and set a cookie holding only a random session ID. **NEVER** use JWTs or bearer tokens for the browser, and **NEVER** return a token or session ID in a response body.
- Session ID: `secrets.token_urlsafe(32)`. Store only its **SHA-256 hash**.
- Cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`, `Max-Age` = session lifetime. Name, lifetime, and the `Secure` flag come from `core/config.py` (`Secure` on everywhere except local development).
- Endpoints: `POST /api/v1/auth/login` (200 + `Set-Cookie`, or 401), `POST /api/v1/auth/logout` (204, always succeeds), `GET /api/v1/auth/me` (200 or 401).
- Login: the same generic error for a wrong email or a wrong password; a new session ID on every login; rate-limit failed attempts per email and IP → 429.
- Passwords: Argon2, in `core/security.py`. **NEVER** stored, logged, or returned in plain text.
- **Protect routes at router level:** `APIRouter(dependencies=[Depends(get_current_user)])`, so a new endpoint can't be left public by accident. Only explicitly public endpoints (login, health) skip it.
- 401 = not logged in or expired. 403 = logged in but not allowed.
- CSRF: `SameSite=Lax`, plus an origin-check middleware that rejects `POST`/`PATCH`/`PUT`/`DELETE` from origins not in `ALLOWED_ORIGINS` → 403.
- CORS (local development only): an explicit `allow_origins` list (**NEVER** `*`) with `allow_credentials=True`. In production, serve the frontend from the same origin.
- Expired sessions are rejected and deleted when used.

## Serving the frontend and health check
- In production FastAPI serves the built React app:
  - `/assets/*` → static files with `Cache-Control: public, max-age=31536000, immutable`. A missing asset returns a plain **404**, never `index.html`.
  - `/api/*` → the API. Unknown `/api/*` paths return the JSON 404, never `index.html`.
  - any other path → `index.html` with `Cache-Control: no-cache`, so client-side routing and reloads after a deploy work.
- Register the API router **before** the frontend fallback.
- `GET /api/health` (outside `/api/v1`, no auth) returns `200 { "data": { "status": "ok" } }` after `SELECT 1`.

## Testing
- `pytest` + `pytest-cov`. Unit tests for services and repositories (in-memory database); integration tests for the HTTP contract, including the error shape and status codes.
- Each test builds its own data with `tests/factories.py`. Tests never depend on seed data or on each other.
- Auth tests cover: cookie attributes, the same 401 for wrong email and wrong password, 401 without a cookie and with an expired session, logout invalidates the session, the origin check rejects a foreign write, the rate limit returns 429.
- An `authenticated_client` fixture keeps other tests from repeating the login steps.

## Tooling
- `uv` for Python and dependencies; `ruff check` + `ruff format`; `mypy --strict` with the Pydantic plugin; `pytest`.
- `api/Makefile` (start from [`templates/api/Makefile`](../templates/api/Makefile)): `check` runs `ruff check --fix`, `ruff format`, `mypy --strict`, and `pytest --cov --cov-fail-under=<threshold>`.
