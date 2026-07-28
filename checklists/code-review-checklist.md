# Checklist: Code Review (Angular 22 · PrimeNG 22 · Tailwind 4.3)

Reviewer's pass order — each section gates the next. Link the matching
anti-pattern file in review comments instead of re-arguing settled rules.

## 1 — Reactivity (blocks merge)

- [ ] Zero RxJS (`subscribe|pipe|Subject`) outside interceptors/boundary adapters
- [ ] No effect writes signals — derived state is `computed`/`linkedSignal`
- [ ] No `ChangeDetectorRef`/`NgZone`/`Eager`/`setTimeout(0)` CD hacks
- [ ] Template-bound state is signals — no mutated plain fields
- [ ] `untracked()` used where a signal is read but shouldn't be tracked

## 2 — Data

- [ ] Reads are resources (`httpResource`/`resource`), writes are `fetch()` in stores
- [ ] No hand-rolled isLoading/hasError triplets
- [ ] All three resource states rendered (`isLoading`/`error`/`hasValue`)
- [ ] `parse` validation on new resources; optimistic updates snapshot + rollback
- [ ] Components don't fetch — stores do; polling in store constructors only
- [ ] WebSocket only via `resource({stream})` on pages that justify it

## 3 — Forms

- [ ] Signal Forms (`form()` + `[formField]`) — no FormBuilder/ngModel forms
- [ ] Validation in schema (incl. cross-field via `valueOf`), not in handlers
- [ ] Submission via `submit()`; button disabled on `invalid() || submitting()`
- [ ] Errors surfaced with `touched()` gating; async validators debounced

## 4 — PrimeNG

- [ ] No dead API: `styleClass`, `pTemplate`, renamed selectors (grep list in
      anti-patterns/dead-primeng-api.md)
- [ ] No deprecated-in-22 components in NEW code (MultiSelect, Galleria, ColorPicker…)
- [ ] Span-vs-div law inside all PrimeNG slots/templates
- [ ] Customization climbed the ladder: utility → class → preset → `[dt]` → `[pt]`
- [ ] Prime primitives over raw HTML (p-button, p-tag, p-divider…)

## 5 — Styling

- [ ] Component `.css` files empty; zero `::ng-deep`, zero `!important` wars
- [ ] Semantic token utilities for chrome (`text-color`, `bg-surface-*`, `border-surface`)
- [ ] Logical properties in directional layouts (`ms-*`, not `ml-*`)
- [ ] Dark mode holds: semantic utilities or paired `dark:` variants
- [ ] `tabular-nums` + `text-end` on numeric columns; no `text-sm` body text
- [ ] Arbitrary values (`w-[…]`) justified by comment or promoted to `@theme`

## 6 — Templates

- [ ] `@if/@for/@switch` only; `track` by identity; `@empty` handled
- [ ] Union switches end with `@default never(x)`
- [ ] Heavy below-fold components in `@defer` with placeholder + error blocks
- [ ] Animations via `animate.enter/leave` classes

## 7 — Architecture

- [ ] `inject()` only; root services `@Service()`; heavy optionals `injectAsync()`
- [ ] Features lazy; route params via `input()` binding
- [ ] Files CLI-generated (spec present, naming consistent)
- [ ] Store shape: UI state / server state / derived / mutations, signals `readonly`
- [ ] New public APIs typed — no `any` leaks

## 8 — Meta

- [ ] Uncertain PrimeNG usage was validated (`validate_usage` MCP tool)
- [ ] Tests: store logic + form schemas covered; zoneless style
      (`await fixture.whenStable()`, no `detectChanges()` loops)
