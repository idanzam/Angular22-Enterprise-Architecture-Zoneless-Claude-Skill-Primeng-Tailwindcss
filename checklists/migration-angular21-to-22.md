# Checklist: Migrating Angular 21 → 22 (+ PrimeNG 21 → 22)

Ordered. Each step is safe to land separately.

## 0 — Prerequisites

- [ ] Node **22+**, TypeScript **6.0+** (v22 dropped Node 20 / TS 5.9)
- [ ] Green test suite on Vitest (default runner since v21; run
      `ng update` migration `migrate-karma-to-vitest` if still on Karma)

## 1 — Framework update

- [ ] `ng update @angular/core@22 @angular/cli@22`
- [ ] Review what the migration stamped: components without explicit change
      detection got `ChangeDetectionStrategy.Eager` to preserve behavior —
      **each `Eager` is now a ticket**, not a keeper
- [ ] Optional-chaining semantics: `?.` returns `undefined` now; the migration
      wraps affected expressions — search `$safeNavigationMigration` and clean up
- [ ] Router breaking changes: `paramsInheritanceStrategy` now `'always'`;
      `canMatch` guards take `currentSnapshot` — fix signatures
- [ ] `strictTemplates` is on by default — fix what it surfaces (it's right)

## 2 — Delete what became default

- [ ] Remove `provideZonelessChangeDetection()` (implicit)
- [ ] Remove `withFetch()` (fetch backend is default; deprecated)
- [ ] Remove `withIncrementalHydration()` (default)
- [ ] Remove `changeDetection: ChangeDetectionStrategy.OnPush` lines (default)
- [ ] Remove `provideAnimationsAsync()` if only PrimeNG needed it (it doesn't anymore)
- [ ] `reportProgress` → `reportUploadProgress`/`reportDownloadProgress` (+ `withXhr()` for upload progress)

## 3 — Adopt the stable APIs (the payoff)

- [ ] Forms: new forms on Signal Forms immediately; migrate touched Reactive
      Forms via `compatForm()`; template directive is **`[formField]`**
      (kill any `[control]`/`[field]` from v21 experiments)
- [ ] Data: hand-rolled fetch+isLoading triplets → `httpResource()` (see
      anti-patterns/manual-loading-state.md); add `parse` with Zod
- [ ] `debounced()` for search inputs, `chain()` for dependent resources,
      `resource({ id })` for SSR-cached public data
- [ ] DI: `ng generate @angular/core:inject`; root services → `@Service()`;
      heavy click-path services → `injectAsync()`
- [ ] Templates: run `control-flow`, `ngclass-to-class`, `ngstyle-to-style`
      migrations if any legacy syntax survives; add `@default never(x)` to
      union switches
- [ ] Animations: `@angular/animations` triggers → `animate.enter`/`animate.leave`

## 4 — PrimeNG 21 → 22

- [ ] `npm i primeng@22 @primeuix/themes@3 @primeicons/angular@8`
- [ ] **License decision:** verify Community-tier eligibility or obtain a key
      (`providePrimeNG({ license })`) — see primeui.dev/licenses
- [ ] Imports: `@primeng/themes` → `@primeuix/themes`
- [ ] Sweep removed API (build will help): `styleClass` → `class`,
      `pTemplate="x"` → `<ng-template #x>`, camelCase selectors → kebab-case,
      pButton `icon`/`label` props → content/`iconOnly`
- [ ] Deprecation wave (schedule before v24): MultiSelect→Select multiple,
      Galleria/Image→Gallery, ColorPicker→InputColor, ScrollPanel→ScrollArea,
      Password→InputPassword, Chart/Editor→PRO decision
- [ ] **16px base font:** either embrace it (audit dense screens) or pin
      `-compat` presets (`@primeuix/themes/aura-compat`) — compat dies June 2027,
      put a date on the follow-up
- [ ] Carousel usages → new compound API if touched

## 5 — Tailwind check (if still on 4.0/4.1)

- [ ] `npm i tailwindcss@^4.3 @tailwindcss/postcss@^4.3 tailwindcss-primeui@^0.6`
- [ ] Replace any scrollbar plugin with first-party `scrollbar-*` utilities
- [ ] Adopt logical properties in RTL-bound code (`ms-*`, `inset-s-*`) —
      `start-*`/`end-*` are deprecated in 4.2+

## 6 — Verify

- [ ] `ng build` clean, zero deprecation warnings you didn't schedule
- [ ] Anti-pattern scan green (see anti-patterns/README.md CI sweep)
- [ ] MCP `validate_usage` pass over changed PrimeNG templates
- [ ] Visual pass on dark mode AND rtl (`document.dir='rtl'` smoke test)
- [ ] `Eager` count: tracked, trending to zero
