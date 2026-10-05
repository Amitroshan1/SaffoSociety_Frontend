# Guard module (Frontend-Side)

UI is ported **1:1 from `Frontend` guard** (same pages, components, CSS).

## Difference from Frontend
- **No real API** — all `@/modules/guard/services/*` return mock data
- Auth/theme are shims (`shims/useAuth`, `shims/ThemeContext`)
- Light theme forced via `data-theme="light"` on `gm-root`

## Open
`/guard/dashboard` (also Sign In / Guard panel card on landing)

## Switch to real API later
Replace mock implementations in `services/` while keeping the same export names the pages already import.
