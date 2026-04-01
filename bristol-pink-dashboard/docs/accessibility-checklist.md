# Accessibility Hardening Checklist (WCAG 2.1 AA)

## Scope

This checklist covers the dashboard frontend and role-based interaction flow.

## Keyboard Navigation

- [X] All interactive controls are reachable via keyboard (`button`, `a`, `input`, `select`).
- [X] A visible focus indicator is present (`:focus-visible` outline in `src/index.css`).
- [X] A skip link is available to jump to main content (`Skip to main content` in `src/App.tsx`).
- [X] Modal can be dismissed via `Escape` and close button (`Model Explanations` modal in `src/App.tsx`).

## Semantic Structure

- [X] Main layout uses semantic landmarks (`header`, `nav`, `main` in `src/App.tsx`).
- [X] Navigation landmark includes descriptive label (`aria-label="Primary navigation"`).
- [X] Dialog has `role="dialog"` and `aria-modal="true"` (`src/App.tsx`).

## Tables and Sortability

- [X] Data tables include captions (screen-reader only) (`DataTable.tsx`, `PredictionTable.tsx`).
- [X] Header cells declare `scope="col"`.
- [X] Sort state exposed via `aria-sort` on sortable columns.

## Status and Feedback

- [X] Prediction status has polite live region updates (`aria-live="polite"` in `src/App.tsx`).
- [X] Auth/login error messages are announced (`role="alert"` in `LoginForm.tsx`).

## Color and Contrast

- [X] Light/dark themes implemented and user-toggleable (`ThemeContext.tsx`).
- [ ] Automated contrast audit report.

## Charts and Non-Text Content

- [X] Full text alternatives for chart data are provided (screen-reader and visible summary in `SalesChart.tsx` and `PredictionChart.tsx`).
- [ ] Keyboard-only equivalents for chart brushing require further enhancement.
