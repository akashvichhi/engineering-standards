# Checklist: React + TypeScript frontend

Use when the change touches `web/`. Rules: `react-typescript.md`.

## Read-only checks

```bash
# web/
npx eslint .
npx stylelint "src/**/*.scss" --allow-empty-input
npx tsc -b --noEmit
npx vitest run
```

## Checklist
- **Types:** no `any`, no `as` casts or `!` assertions used to silence the compiler, no `@ts-ignore` / `eslint-disable` without a reason. Props through `I<Component>Props`; interfaces `I*`, type aliases `T*`; `useState<T>` generics given (lint can't check these).
- **Data flow:** types → API function → query/mutation hook → component. Components never import from `src/api/`. No `fetch`/`axios` outside `api_client.ts`. No data fetching in `useEffect`. Paginated params extend `IPaginationParams`.
- **React Query:** keys only from `constants/query_keys.ts` factories; mutations invalidate exactly the keys they affect; paginated lists use `keepPreviousData`; no global `throwOnError`.
- **Hooks:** rules of hooks; `exhaustive-deps` warnings fixed, not suppressed; no derived state in `useState` + `useEffect`; effects clean up; no stale closures.
- **Logic vs UI:** logic in hooks (one per file); `src/ui/` components are logic-free; a component needed by a second page is moved to `src/common/`, never imported across page folders or copied.
- **States:** skeletons shaped like the content; `error_state` with retry; `empty_state` with a hint; action buttons show `loading` and are disabled while pending; no page-blocking spinners; the full-screen loader only in the protected route.
- **URL state** for lists goes through the shared list-state hook; changing a filter or search resets to page 1.
- **Feedback:** every mutation notifies success and failure via the shared helper with constant texts; deletes confirm first, naming the record; 422 `details` map to form fields.
- **Routing:** new pages are lazy-loaded, default-exported, rendered through the route boundary; paths from `route_paths.ts`.
- **Security:** no tokens or user data in `localStorage`/`sessionStorage`/JS-readable cookies; no `dangerouslySetInnerHTML`; no secrets in `VITE_*` variables; no redirects built from untrusted input (URL parameters); no personal data in `console.*`.
- Money never passed through `Number()` or `parseFloat`; dates never formatted with the browser's local zone instead of the app's constant.
- **Accessibility:** visible labels, `aria-label` on icon-only buttons, keyboard-operable actions, status not shown by colour alone.
- **Styling:** Mantine components and theme-key props first; SCSS modules only when needed, using tokens; no static inline `style`, `!important`, or ID selectors; classes combined with `classnames`.
- **Performance:** memoisation per the project rules, but flag memoising trivial values as noise; stable `key`s (never indexes for changing lists); named imports for icons and libraries; debounced search.
- User-facing strings come from `src/constants/`.
- **Tests:** mock at the network edge (API module or MSW), query by role and label, and don't assert on CSS classes or React Query internals.
- **Never in the diff:** `.env`, `node_modules/`, `dist/`, coverage output.
