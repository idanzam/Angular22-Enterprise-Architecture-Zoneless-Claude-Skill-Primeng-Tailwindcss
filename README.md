<div align="center">

<img src="https://angular.dev/assets/images/press-kit/angular_wordmark_gradient.png" alt="Angular 22" height="80"/>

# Angular 22 Enterprise Architecture — Zoneless

### A production-grade Claude skill for the Angular 22 · PrimeNG 22 · Tailwind 4.3 era

[![Angular](https://img.shields.io/badge/Angular-22-red?style=for-the-badge&logo=angular)](https://angular.dev)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-22-blue?style=for-the-badge)](https://primeng.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.3-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Signal Forms](https://img.shields.io/badge/Signal_Forms-STABLE-purple?style=for-the-badge)](https://angular.dev/essentials/signal-forms)
[![Zoneless](https://img.shields.io/badge/Zoneless-default-green?style=for-the-badge)](https://angular.dev)
[![Zero RxJS](https://img.shields.io/badge/RxJS-0%25-black?style=for-the-badge)](references/signals-only.md)
[![MCP](https://img.shields.io/badge/MCP-3_servers_wired-orange?style=for-the-badge)](.mcp.json)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

> **Not a template. Not a boilerplate. Not prompts.**
>
> An opinionated, production-derived architecture system for AI-assisted
> Angular development — rebuilt from the ground up for Angular 22 (June 2026),
> PrimeNG 22 (July 2026) and Tailwind CSS 4.3.
>
> Successor of [Angular21-Enterprise-Architecture-Zoneless-Claude-Skill](https://github.com/idanzam/Angular21-Enterprise-Architecture-Zoneless-Claude-Skill),
> battle-tested on a live crypto exchange with 75+ trading pairs.

[Why v22 changes everything](#-why-v22-changes-everything) ·
[Quick start](#-quick-start) ·
[The rules](#-the-fifteen-non-negotiables) ·
[What's new here](#-new-in-this-skill-vs-the-angular-21-edition) ·
[Reference library](#-reference-library) ·
[MCP integration](#-mcp-integration)

</div>

---

## 🛰 Why v22 changes everything

Most AI assistants write Angular from 2023 muscle memory: `FormBuilder`,
`.subscribe()`, `styleClass`, `*ngIf`, `markForCheck()`. **Every one of those
is dead, removed, or banned in this stack.** Angular 22 is the release where
the signals era became the *only* era:

| | Angular 21 (Nov 2025) | **Angular 22 (Jun 2026)** |
|---|---|---|
| Signal Forms | experimental | ✅ **STABLE** — the only form system you need |
| `resource()` / `httpResource()` | experimental | ✅ **STABLE** — declarative data loading |
| Zoneless | ✅ default | ✅ default |
| Change detection | OnPush opt-in | ✅ **OnPush is the DEFAULT** |
| HTTP backend | XHR (fetch opt-in) | ✅ **fetch is the DEFAULT** |
| Incremental hydration | opt-in | ✅ default |
| `@angular/aria` | dev preview | ✅ **STABLE** |
| Test runner | Vitest default | Vitest + karma migration |
| New DI | — | `@Service()`, `injectAsync()` |
| New reactivity | — | `debounced()`, `linkedSignal` custom `set`, `chain()` |

Meanwhile **PrimeNG 22** removed `styleClass` and `pTemplate`, moved to
`primeng.dev`, shipped 8 new components (CommandMenu, Gallery, InputTags,
ScrollArea, the new compound Sidebar…), and **Tailwind 4.3** brought first-party
scrollbar styling, masks, text shadows, container-size queries and safe
alignment — in a config that lives entirely in CSS.

This skill teaches your AI assistant (and your team) the **2026 way** — and
explicitly deprograms the 2023 way.

---

## ⚡ Quick start

### As a Claude Code skill

```bash
npx skills add https://github.com/idanzam/Angular22-Enterprise-Architecture-Zoneless-Claude-Skill-Primeng-Tailwindcss
```

### As a project brain

```bash
git clone https://github.com/idanzam/Angular22-Enterprise-Architecture-Zoneless-Claude-Skill-Primeng-Tailwindcss skill
cp skill/CLAUDE.md skill/.mcp.json your-project/
cp -r skill/references your-project/
```

Then tell Claude:

```
Read CLAUDE.md and follow it for all Angular work.
```

### New project from zero

```bash
ng new mission-control --style tailwind      # CLI ≥21 wires Tailwind for you
npm i primeng @primeuix/themes @primeicons/angular tailwindcss-primeui
```

Copy `examples/app.config.ts` and `examples/styles.css` as your starting point —
they encode the full PrimeNG↔Tailwind layer contract.

---

## 📁 Repository structure

```text
├── CLAUDE.md                              ← the brain: 15 non-negotiables + decision tree
├── SKILL.md                               ← Claude skill entry (frontmatter + routing)
├── .mcp.json                              ← Angular CLI + PrimeNG + Tailwind MCP servers
│
├── references/
│   ├── angular22-core.md                  ← v22 facts: defaults, @Service, injectAsync, WebMCP
│   ├── signals-only.md                    ← zero-RxJS policy + complete migration map
│   ├── zoneless-onpush.md                 ← the v22 change-detection contract
│   ├── signal-forms.md                    ← STABLE Signal Forms — full API playbook
│   ├── resource-http.md                   ← httpResource / resource / stream / mutations
│   ├── primeng22.md                       ← renames, removals, tokens, dt/pt ladder
│   ├── primeng-layout.md                  ← the span-vs-div layout law
│   ├── tailwind4.md                       ← CSS-first config + the 4.1→4.3 arsenal
│   ├── primeng-tailwind-integration.md    ← CSS layers, primeui bridge, p-* variants
│   ├── templates-control-flow.md          ← @switch exhaustiveness, @defer, animate.enter
│   ├── architecture.md                    ← folders, signal stores, DI, auth, realtime
│   └── anti-patterns.md                   ← 15 ways to get a PR rejected
│
└── examples/                              ← "Mission Control" — space-ops golden files
    ├── app.config.ts                      ← zoneless + preset + CSS layers
    ├── styles.css                         ← the ONLY stylesheet an app needs
    ├── telemetry-store.service.ts         ← store: httpResource + debounced + stream
    ├── launch-form.component.ts           ← Signal Forms + cross-field + async validation
    ├── launch-form.html                   ← [formField] + PrimeNG 22 + p-invalid: variants
    └── mission-dashboard.html             ← layout law + @defer + container queries
```

---

## 📏 The Fifteen Non-Negotiables

The full list with rationale lives in [CLAUDE.md](CLAUDE.md). The headlines:

| # | Rule | The 2026 reason |
|---|---|---|
| 1 | **Zero RxJS** | signals + `httpResource` + `debounced()` closed the last gaps |
| 2 | **Zero zone.js** | zoneless is the default — re-adding it is a regression |
| 3 | **Zero CD annotations** | OnPush is the v22 default; `ChangeDetectorRef` is a smell |
| 4 | **Signal Forms only** | stable in v22 — `FormBuilder` is legacy |
| 5 | **Reads=`httpResource`, writes=`fetch`** | declarative in, imperative out |
| 6 | **No `<div>` inside PrimeNG** | block elements break internal flex — `<span>` + Tailwind |
| 7 | **Zero custom CSS** | tokens (`definePreset`/`[dt]`) + `pt` + utilities replaced `::ng-deep` |
| 8–10 | **No dead PrimeNG API** | `styleClass`/`pTemplate` removed; renames enforced |
| 11 | **No `@angular/animations`** | `animate.enter` / `animate.leave` are native now |
| 12 | **No `*ngIf`/`NgClass`** | `@if`/`@for` + v22 exhaustive `@switch` |
| 13–14 | **CLI generates, developer runs** | Claude writes code, never builds/deploys |
| 15 | **`inject()` only** | `@Service()` + `injectAsync()` for lazy heavy deps |

---

## 🆕 New in this skill vs the Angular 21 edition

What changed when the production architecture moved 21 → 22:

- **Forms**: hand-rolled signal state + template bindings → **stable Signal Forms**
  (`form()`, schemas, `validateHttp` with debounce, Zod via `validateStandardSchema`).
- **HTTP**: raw `fetch()` everywhere → **`httpResource()` for reads** (auto-cancel,
  SSR cache via `id`, `parse` validation), `fetch()` kept for mutations only.
- **The translation guard died**: the `effect` + `ChangeDetectorRef.markForCheck()`
  i18n pattern from the v21 skill is obsolete — a `httpResource` dictionary +
  one `@if (i18n.ready())` at the shell replaces it. Zero `cdr` in the codebase.
- **`::ng-deep` is banned** (the v21 skill still allowed it): PrimeNG 22's
  `[dt]` scoped tokens + `[pt]` pass-through + ~90 `p-*` Tailwind variants
  cover every customization on a supported API.
- **WebSocket handling**: manual `ws.onmessage` + signals → **`resource({ stream })`**
  with `abortSignal`-driven cleanup.
- **Polling**: `setInterval(loadData)` → `setInterval(() => resource.reload())`.
- **MCP-first accuracy**: `.mcp.json` ships three servers so the assistant
  *queries current docs* instead of guessing from training data — including
  `validate_usage`, which lints generated PrimeNG code against the real API.
- **RTL by construction**: Tailwind 4.2 logical properties (`ms-*`, `inset-s-*`)
  replace physical utilities — critical for EN/HE/RU products.

---

## 🔌 MCP integration

This repo ships a ready [`.mcp.json`](.mcp.json):

| Server | Package | Killer tools |
|---|---|---|
| `angular-cli` | `npx @angular/cli mcp` (official) | `get_best_practices`, `search_documentation`, `onpush_zoneless_migration`, `ai_tutor` |
| `primeng` | `@primeng/mcp` (official) | `get_component`, `get_example`, **`validate_usage`** — docs snapshot matches your installed version |
| `tailwindcss` | `tailwindcss-mcp-server` (community) | `get_tailwind_utilities`, `search_tailwind_docs`, `convert_css_to_tailwind` |

> Going deeper: PrimeNG also ships a full Claude Code plugin —
> `claude plugin marketplace add primefaces/primeui-plugins` →
> `claude plugin install primeng@primeui` (7 skills + MCP in one install).

---

## 🎓 Ten things in this stack most developers haven't met yet

1. `@Service()` — root DI without `@Injectable({providedIn:'root'})` ceremony (v22)
2. `injectAsync()` — lazy-loaded services with automatic code splitting (v22)
3. `debounced(signal, 300)` — search-as-you-type without RxJS (v22 experimental)
4. `@default never(x)` — compile-time exhaustive `@switch` in templates (v22)
5. `chain(resource)` — dependent resources without undefined-juggling (v22)
6. `validateStandardSchema()` — Zod/Valibot straight into Signal Forms (v22)
7. PrimeNG `p-commandmenu` — the ⌘K palette, first-party (PrimeNG 22)
8. `p-invalid:` / `p-checked:` / `p-today:` — Tailwind variants that style PrimeNG *internals* from your template (tailwindcss-primeui)
9. `scrollbar-thin scrollbar-thumb-*` — first-party scrollbar styling (Tailwind 4.3)
10. `@container-size` + `cqb/cqh` units — dashboard widgets that respond to their tile, not the viewport (Tailwind 4.3)

---

## ⚠️ Ecosystem honesty notes

- **PrimeNG 22 licensing changed.** It's the first release under the PrimeUI
  dual license (free Community tier with revenue/team thresholds; commercial
  keys verified fully offline). Review [primeui.dev/licenses](https://primeui.dev/licenses)
  before commercial use — or stay on PrimeNG 21 LTS (this skill's PrimeNG
  guidance is ~90% valid there; keep `styleClass`/`pTemplate` off regardless).
- `debounced()` and WebMCP are **experimental** — flagged as such in the references.
- Selectorless components are **not in v22** — any tutorial showing `<UserCard />`
  template syntax is describing the future, not the present.

---

## 🏆 Lineage

This architecture powers **Pool4Ever Exchange** — a live cryptocurrency
exchange (75+ trading pairs, realtime order books, JWT auth, EN/RU/HE i18n,
24/7 uptime). The Angular 21 edition of this skill was extracted from that
system; this edition upgrades every pattern to the Angular 22 stable APIs.

→ [pool4ever.com](https://pool4ever.com) ·
→ [Angular 21 edition](https://github.com/idanzam/Angular21-Enterprise-Architecture-Zoneless-Claude-Skill)

---

## 📄 License

MIT © [Idan Zamir Halevy](https://izh.pool4ever.com)

<div align="center">

**If this saved you a week of architecture decisions — star it ⭐**

Built from production. Verified against the July 2026 ecosystem. Zero theory.

</div>
