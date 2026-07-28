# Changelog

## 2.1.0 — 2026-07-28

**The Patterns release.**

- 🎯 `patterns/` — 15 complete production patterns, one file each, with
  when-to-use, ingredients, full code, and rules: signal-store,
  httpresource-crud, debounced-search, websocket-stream, polling,
  form-edit-resource, form-wizard, auth-flow, i18n-rtl, theme-switching,
  realtime-table, dialog-pattern, dashboard-shell, command-palette, lazy-feature
- ⛔ `anti-patterns/` — 12 detailed anti-patterns, each with a *why it's
  fatal in Angular 22 specifically* section and CI-ready detection greps
- ✅ `checklists/` — migration guide Angular 21→22 + PrimeNG 21→22,
  code-review checklist, production-readiness ship gate
- 🧬 `generators/` — CLI-first templates: store, smart/dumb component,
  complete lazy feature
- Community files: CONTRIBUTING, CHANGELOG, issue/PR templates

## 2.0.0 — 2026-07-28

**Initial Angular 22 edition** (successor of
[Angular21-Enterprise-Architecture-Zoneless-Claude-Skill](https://github.com/idanzam/Angular21-Enterprise-Architecture-Zoneless-Claude-Skill)).

- `CLAUDE.md` — Fifteen Non-Negotiables + decision tree
- `SKILL.md` — installable Claude skill entry
- `.mcp.json` — Angular CLI + PrimeNG + Tailwind MCP servers pre-wired
- `references/` — 12 deep guides: Angular 22 core, signals-only, zoneless/OnPush,
  Signal Forms (stable), resource/httpResource, PrimeNG 22, layout law,
  Tailwind 4.3, PrimeNG↔Tailwind integration, templates/control flow,
  architecture, anti-patterns digest
- `examples/` — "Mission Control" golden files (space-ops domain)
- Verified against: Angular 22.0 (2026-06-03), PrimeNG 22.0 (2026-07-15),
  Tailwind CSS 4.3.0 (2026-05-08)

### Doctrine changes vs the Angular 21 edition

- Signal Forms replace hand-rolled form state (stable in v22)
- `httpResource()` replaces raw fetch for reads; fetch stays for mutations
- The per-component translation guard is dead — shell-gated i18n resource
- `::ng-deep` fully banned — `[dt]`/`[pt]`/token presets replace it
- `styleClass`/`pTemplate` removed (PrimeNG 22)
- OnPush annotations removed (v22 default); `@Service()`/`injectAsync()` adopted
- WebSocket handling standardized on `resource({ stream })`
