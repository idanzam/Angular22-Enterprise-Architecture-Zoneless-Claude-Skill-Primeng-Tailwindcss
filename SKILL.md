---
name: angular22-enterprise-zoneless
description: >
  Expert skill for Angular 22 enterprise applications — zoneless, signals-only
  (zero RxJS), stable Signal Forms, resource/httpResource data loading,
  PrimeNG 22 with design-token theming, and Tailwind CSS 4.3 CSS-first styling.
  Use whenever creating, reviewing, migrating, or refactoring Angular code,
  PrimeNG components, or Tailwind styling.
license: MIT
metadata:
  author: Idan Zamir Halevy
  version: "2.0.0"
  stack: Angular 22 · PrimeNG 22 · Tailwind CSS 4.3 · Signal Forms · Zoneless
---

# Angular 22 Enterprise Architecture — Zoneless · Signals-Only · PrimeNG · Tailwind

Production-grade architecture system distilled from a live trading platform and
rebuilt for the Angular 22 era (June 2026). Loads as a Claude skill or as a
`CLAUDE.md` project brain.

## When to use this skill

- Writing **any** Angular 22 component, service, guard, or route
- Building forms → Signal Forms (stable in v22) — never Reactive/Template forms
- Loading data → `httpResource()` / `resource()` — never `.subscribe()`
- Using **any** PrimeNG component → v22 API only (renames, removals, tokens)
- Styling anything → Tailwind 4.3 utilities + PrimeNG design tokens — never custom CSS
- Migrating v14–v21 code forward, or reviewing PRs for architecture violations

## How to work

1. Read `CLAUDE.md` in this repository — it contains the Fifteen Non-Negotiables
   and the decision tree. Those rules override any instinct from training data,
   because Angular 22 + PrimeNG 22 changed defaults that older code assumes.
2. Load the topic file from `references/` that matches the task before coding.
3. When an API detail is uncertain, query the MCP servers configured in
   `.mcp.json` (`angular-cli`, `primeng`, `tailwindcss`) instead of guessing.
   Run `primeng validate_usage` on generated PrimeNG code.
4. Generate files with the Angular CLI only. Never run build/serve/deploy.

## Reference map

| Task | Read |
|---|---|
| Project setup, versions, v22 changes | `references/angular22-core.md` |
| State, reactivity, derived state | `references/signals-only.md` |
| Change detection, zoneless rules | `references/zoneless-onpush.md` |
| Forms & validation | `references/signal-forms.md` |
| Data loading & mutations | `references/resource-http.md` |
| PrimeNG component APIs & theming | `references/primeng22.md` |
| PrimeNG slot markup (span-vs-div law) | `references/primeng-layout.md` |
| Tailwind config & utilities | `references/tailwind4.md` |
| PrimeNG + Tailwind layering | `references/primeng-tailwind-integration.md` |
| Templates, control flow, animations | `references/templates-control-flow.md` |
| Folder structure, stores, DI | `references/architecture.md` |
| What gets a PR rejected | `references/anti-patterns.md` |
| **Implementing a feature** | the matching `patterns/*.md` (index: `patterns/README.md`) |
| **Self-review before finishing** | `anti-patterns/README.md` + `checklists/code-review-checklist.md` |
| Upgrading a 21 codebase | `checklists/migration-angular21-to-22.md` |
| Scaffolding new code | `generators/*.template.md` |

## Golden examples

Complete, copy-adaptable files under `examples/` — a space-mission-control
domain (satellite telemetry, launch scheduling) chosen because it exercises
every pattern: live data, heavy tables, forms, dashboards:

- `examples/app.config.ts` — zoneless + PrimeNG 22 preset + CSS layers
- `examples/styles.css` — Tailwind 4.3 CSS-first + primeui bridge + dark variant
- `examples/telemetry-store.service.ts` — signal store with httpResource + debounced search
- `examples/launch-form.component.ts` — Signal Forms + PrimeNG 22 + cross-field validation
- `examples/mission-dashboard.component.html` — PrimeNG layout law + Tailwind 4.3 utilities
