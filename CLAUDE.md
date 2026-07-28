# Angular 22 Enterprise Architecture — Claude Instructions

> Angular 22 · Zoneless · Signals-Only · Signal Forms · PrimeNG 22 · Tailwind CSS 4.3

You are working in an **Angular 22 zoneless, signals-only** codebase.
Read the reference files below **before writing any code**. They are the law of this repository.

## Read These First (In Order)

1. `references/angular22-core.md` — versions, setup, what changed in v22
2. `references/signals-only.md` — signal / computed / linkedSignal / effect / debounced
3. `references/zoneless-onpush.md` — zoneless + OnPush-by-default rules
4. `references/signal-forms.md` — Signal Forms (STABLE in v22) — the only form system allowed
5. `references/resource-http.md` — httpResource / resource / fetch — data loading law
6. `references/primeng22.md` — PrimeNG 22 API, renames, removals, theming tokens
7. `references/primeng-layout.md` — the span-vs-div layout law + slot rules
8. `references/tailwind4.md` — Tailwind 4.3 CSS-first config + modern utilities
9. `references/primeng-tailwind-integration.md` — CSS layers, tailwindcss-primeui, `p-*` variants
10. `references/templates-control-flow.md` — v22 template syntax, @defer, animate.enter/leave
11. `references/architecture.md` — folder structure, signal stores, DI patterns
12. `references/anti-patterns.md` — everything that gets a PR rejected

## The Fifteen Non-Negotiables

1. **ZERO RxJS** — no `Observable`, `Subject`, `BehaviorSubject`, `.subscribe()`, `.pipe()`. Reactivity is signals. Async is `async/await`. (`httpResource()` / `resource()` are signal APIs — they are the approved read path.)
2. **ZERO zone.js** — Angular 22 is zoneless by default. Never add `provideZoneChangeDetection()`. Never install `zone.js`.
3. **ZERO change-detection annotations** — `OnPush` is the v22 default. Never write `ChangeDetectionStrategy.Eager` (renamed legacy `Default`). Never inject `ChangeDetectorRef`.
4. **Signal Forms only** — `form()` + `[formField]` from `@angular/forms/signals`. No `ReactiveFormsModule`, no `FormBuilder`, no `FormGroup`, no template-driven `ngModel` in forms.
5. **Reads = `httpResource()`, writes = `fetch()`** — declarative signal-based loading for GET; `async/await fetch()` for mutations. Never `.subscribe()` an HTTP call.
6. **ZERO `<div>` inside PrimeNG slots/templates** — use `<span>` with Tailwind flex/grid classes. A block element inside a PrimeNG flex slot breaks its internal layout.
7. **ZERO custom CSS files with rules** — Tailwind utilities + PrimeNG design tokens cover everything. No hand-written CSS, no `::ng-deep` (v22 replacement: `[dt]` scoped tokens and `pt` pass-through).
8. **ZERO `styleClass`** — removed in PrimeNG 22. Use plain `class` on PrimeNG components.
9. **ZERO `pTemplate`** — removed in PrimeNG 22. Use `<ng-template #templateName>` reference syntax.
10. **ZERO deprecated PrimeNG selectors** — `p-calendar`→`p-datepicker`, `p-dropdown`→`p-select`, `p-sidebar`→`p-drawer`, `p-overlaypanel`→`p-popover`, `p-inputswitch`→`p-toggleswitch`. Also avoid the v22 deprecations: MultiSelect→Select `multiple`, Galleria/Image→Gallery, ColorPicker→InputColor, ScrollPanel→ScrollArea.
11. **ZERO `@angular/animations`** — deprecated. Use `animate.enter` / `animate.leave` with Tailwind/`tailwindcss-primeui` animation classes.
12. **ZERO structural directives** — no `*ngIf`, `*ngFor`, `*ngSwitch`, `[ngClass]`, `[ngStyle]`. Use `@if` / `@for` / `@switch`, `[class.x]` / `[style.x]` bindings.
13. **CLI-only file generation** — `ng g c`, `ng g s`, `ng g g`. Never hand-create component files. If the CLI cannot run — STOP and tell the developer.
14. **ZERO `ng build` / `ng serve` / deploy commands by Claude** — the developer runs the app. Claude writes code.
15. **Constructor-free DI** — `inject()` only. Root services use `@Service()` (v22). Heavy optional services use `injectAsync()`.

## Stack (Pinned)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Angular 22 (June 2026) | zoneless default, OnPush default, TS 6+, Node 22+ |
| UI | PrimeNG 22 (July 2026) | `@primeuix/themes` v3, design tokens, `pt`/`dt` |
| Styling | Tailwind CSS 4.3 | CSS-first `@theme`, Oxide engine, PostCSS plugin |
| Bridge | tailwindcss-primeui | `bg-primary`, `p-invalid:` variants, token mapping |
| Forms | Signal Forms (stable) | `@angular/forms/signals` |
| HTTP reads | `httpResource()` (stable) | fetch backend is v22 default |
| HTTP writes | native `fetch()` + async/await | — |
| State | Signal stores (services) | `signal` + `computed` + `linkedSignal` |
| Realtime | `resource({ stream })` / WebSocket | trade/live pages only — REST polling elsewhere |
| Testing | Vitest (default runner) | `await fixture.whenStable()` — never `detectChanges()` loops |

## MCP Servers (use them — do not guess APIs)

This repo ships `.mcp.json` wired to three official/ecosystem MCP servers.
When unsure about any API, **query the MCP server instead of guessing**:

- `angular-cli` — `get_best_practices`, `search_documentation`, `find_examples`, `onpush_zoneless_migration`
- `primeng` — `search`, `get_component`, `get_example`, `validate_usage` (run this on every PrimeNG snippet you produce)
- `tailwindcss` — `get_tailwind_utilities`, `search_tailwind_docs`, `convert_css_to_tailwind`

## Decision Tree (fast routing)

```text
Need state?              → signal() in a store service
Need derived state?      → computed()  (NEVER an effect that sets a signal)
Need writable-derived?   → linkedSignal()  (v22.1: custom `set` writes back to parent)
Need a side effect?      → effect()  (DOM title, logging, storage — nothing else)
Need to load data?       → httpResource(() => url)  (+ `parse` for validation)
Need search-as-you-type? → debounced(query, 300) + resource()
Need to save data?       → async fetch() POST/PUT — then reload()/update the resource
Need a form?             → form(model, schema) + [formField]
Need UI component?       → PrimeNG 22 first — query primeng MCP for current API
Need layout/spacing?     → Tailwind utilities on <span> wrappers inside PrimeNG
Need theme change?       → definePreset() design tokens — never CSS overrides
Need per-instance skin?  → [dt] scoped tokens  |  structural change → [pt] pass-through
Need animation?          → animate.enter / animate.leave + Tailwind classes
Need realtime?           → resource({ stream }) — ONLY on pages that justify it
```
