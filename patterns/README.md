# 🎯 Patterns

Production-shaped solutions, one file each. Every pattern states **when to use
it**, the **Angular 22 ingredients** it's built from, complete code, and hard rules.

| # | Pattern | One-liner |
|---|---|---|
| 1 | [signal-store.md](signal-store.md) | Service as state container — UI state / server state / derived / mutations |
| 2 | [httpresource-crud.md](httpresource-crud.md) | Reads via resource, writes via fetch, optimistic updates with rollback |
| 3 | [debounced-search.md](debounced-search.md) | Search-as-you-type with `debounced()` + auto-cancelling resource |
| 4 | [websocket-stream.md](websocket-stream.md) | Live data via `resource({ stream })` with abortSignal cleanup + backoff |
| 5 | [polling.md](polling.md) | The default freshness strategy — `reload()` on interval, visibility-aware |
| 6 | [form-edit-resource.md](form-edit-resource.md) | Edit form hydrated from a resource via `linkedSignal` |
| 7 | [form-wizard.md](form-wizard.md) | Multi-step wizard — one model, one form, `applyWhen` per step |
| 8 | [auth-flow.md](auth-flow.md) | JWT with single-flight refresh, retry-once, inactivity logout |
| 9 | [i18n-rtl.md](i18n-rtl.md) | Dictionary resource + shell gate + logical properties (RTL-proof) |
| 10 | [theme-switching.md](theme-switching.md) | Dark mode + runtime brand presets — one class flips everything |
| 11 | [realtime-table.md](realtime-table.md) | Live PrimeNG table — dataKey diffing, virtual scroll, flash-on-change |
| 12 | [dialog-pattern.md](dialog-pattern.md) | Confirm service, form dialogs, headless Tailwind dialogs |
| 13 | [dashboard-shell.md](dashboard-shell.md) | App shell with the NEW PrimeNG 22 compound `p-sidebar` |
| 14 | [command-palette.md](command-palette.md) | Global ⌘K palette with `p-commandmenu` + command registry store |
| 15 | [lazy-feature.md](lazy-feature.md) | Three-layer laziness: routes, `injectAsync()`, `@defer` |

**How to use with Claude / AI assistants:** reference the pattern file in your
prompt ("build the settings page following `patterns/form-edit-resource.md`").
The patterns compose — a real page is typically 3–4 of them.
