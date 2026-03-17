# Accessibility Hardening Checklist (WCAG 2.1 AA)

## Scope
This checklist covers the dashboard frontend and role-based interaction flow.

## Keyboard Navigation
- [x] All interactive controls are reachable via keyboard (`button`, `a`, `input`, `select`).
- [x] A visible focus indicator is present (`:focus-visible` outline in `src/index.css`).
- [x] A skip link is available to jump to main content (`Skip to main content` in `src/App.tsx`).
- [x] Modal can be dismissed via `Escape` and close button (`Model Explanations` modal in `src/App.tsx`).

## Semantic Structure
- [x] Main layout uses semantic landmarks (`header`, `nav`, `main` in `src/App.tsx`).
- [x] Navigation landmark includes descriptive label (`aria-label="Primary navigation"`).
- [x] Dialog has `role="dialog"` and `aria-modal="true"` (`src/App.tsx`).

## Tables and Sortability
- [x] Data tables include captions (screen-reader only) (`DataTable.tsx`, `PredictionTable.tsx`).
- [x] Header cells declare `scope="col"`.
- [x] Sort state exposed via `aria-sort` on sortable columns.

## Status and Feedback
- [x] Prediction status has polite live region updates (`aria-live="polite"` in `src/App.tsx`).
- [x] Auth/login error messages are announced (`role="alert"` in `LoginForm.tsx`).

## Color and Contrast
- [x] Light/dark themes implemented and user-toggleable (`ThemeContext.tsx`).
- [ ] Automated contrast audit report not yet generated.

## Charts and Non-Text Content
- [ ] Full text alternatives for chart data are not yet provided.
- [ ] Keyboard-only equivalents for chart brushing require further enhancement.

## Manual QA Procedure
1. Use keyboard only: Tab from the top of the page, activate skip link, and confirm logical focus order.
2. Open Model Explanations modal and close with both `Escape` and close button.
3. Verify table sort announcements (`aria-sort`) with a screen reader.
4. Confirm live region updates while running prediction.
5. Validate contrast with browser accessibility tools.

## Remaining Work
- Add programmatic chart summaries for screen readers.
- Add keyboard controls for chart zoom/brush interactions.
- Produce an automated contrast check artifact.
