# Checklist: HTTP API contract

Use when the change touches an HTTP API or a client of one. Rules: `api-contract.md`.

- Every response uses the contract shape: `{ data }`, `{ data, meta }`, `{ error, details? }`. No framework default error body leaking through (unknown routes, wrong methods, validation, 500s).
- Status codes match the contract (201 create, 204 delete with no body, 401 vs 403, 404, 409, 422, 429).
- Paths: `/api/v1`, plural kebab-case resources; query parameters and JSON keys `snake_case`; no data values used as JSON keys; sort fields from an allow-listed enum.
- Pagination: `page` / `per_page` validated (above the maximum → 422); exactly the four `meta` fields; 0 results → `total_pages: 0`; a page beyond the last → 200 with `data: []`.
- Any `GET` that changes data?
- Server ↔ client parity: every field added, renamed, or removed on one side is mirrored on the other (snake_case ↔ camelCase), with money as a decimal string and dates as ISO 8601.
- Sessions: httpOnly cookie with the contract's attributes (or a recorded exception); no token or session ID in a response body; only a hash stored; every new route requires a session unless the project lists it as public.
- New write method (POST/PATCH/PUT/DELETE): covered by the origin check? CORS never `*`, and only in local development.
- When the server serves a frontend: missing assets → plain 404, unknown `/api/*` → JSON 404, everything else → `index.html` with `no-cache`; API routes matched first.
- Breaking change for an already-deployed client?
