# Checklist: Production Readiness (Ship Gate)

Run before the first production deploy and quarterly after.

## Performance

- [ ] Initial bundle budgeted in `angular.json` (`initial` warn ≤ 500kB) and green
- [ ] Every feature route lazy; chart/editor/3D/map libs confirmed OUT of the
      initial chunk (`ng build --stats-json` + analyzer)
- [ ] `@defer` on below-the-fold heavy widgets; images sized + `NgOptimizedImage`/`p-image`
- [ ] Tables >100 rows virtualized; >1000 rows server-paginated
- [ ] Polling intervals reviewed (visibility-aware ≤10s); no accidental N-widgets×N-sockets
- [ ] `@for` tracks by identity everywhere (no `$index` on mutable lists)

## SSR / Hydration (if SSR enabled)

- [ ] Incremental hydration verified (default) — `@defer (hydrate on viewport)` on heavy islands
- [ ] Public resources use `id` for TransferState reuse; user-specific data does NOT
- [ ] No `window`/`document` access outside browser-guarded code paths

## Resilience

- [ ] Every resource's `error()` state renders something actionable (retry button)
- [ ] Mutations handle failure visibly (toast + rollback of optimistic state)
- [ ] Auth: single-flight refresh, retry-once, inactivity logout tested
- [ ] WebSocket pages reconnect with backoff; polling resumes on tab focus
- [ ] API drift guarded: Zod `parse` on external boundaries, failures logged

## Security

- [ ] Tokens only in `AuthStore` + wrappers; no tokens in URLs or logs
- [ ] CSP configured; `providePrimeNG({ csp: { nonce } })` wired to the server nonce
- [ ] `subresourceIntegrity` enabled in the build (v22 emits integrity import maps)
- [ ] Dependency audit clean (`npm audit --omit=dev` triaged)
- [ ] PrimeNG license status resolved (Community eligibility documented, or key installed)

## UX correctness

- [ ] Dark mode: full visual pass — no frozen-color islands
- [ ] RTL smoke test (`dir="rtl"`): layout mirrors, icons flipped where meaningful
- [ ] i18n: key-set diff across languages clean; shell gate prevents key flashes
- [ ] Loading: skeletons on first load, non-blanking `reloading` refreshes
- [ ] Empty states designed (`@empty`, `#emptymessage`) — not blank whitespace
- [ ] Keyboard: palette (⌘K), dialogs (Esc/trap), tables navigable —
      `@angular/aria` primitives where custom widgets exist

## Observability

- [ ] Global error handler (`provideBrowserGlobalErrorListeners`) reporting to your sink
- [ ] Resource errors + mutation failures tracked with context (URL, status)
- [ ] Web vitals reported (LCP/INP/CLS) from real users

## Process

- [ ] Anti-pattern CI sweep active and green (anti-patterns/README.md)
- [ ] `Eager` count zero (or ticketed with owners)
- [ ] `CLAUDE.md` + `.mcp.json` present in the repo so future AI work follows the law
