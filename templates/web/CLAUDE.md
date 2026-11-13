# Frontend rules: <Project name>

@../docs/standards/react-typescript.md

## Project-specific frontend rules

Only what differs from or adds to the React rules in `docs/standards/`. Delete what doesn't apply.

- **Pages:** <e.g. login, employee_list, salary_insights>
- **Lists loaded from the API, never copied:** <e.g. countries, departments, job titles from GET /api/v1/employee-options>
- **Date display format constant:** <e.g. APP_DATE_FORMAT = 'DD/MM/YYYY' in constants/time_constants.ts>
- **Demo-only env vars:** <e.g. VITE_DEMO_LOGIN_EMAIL, prefilled on the login form; only ever the demo account>
