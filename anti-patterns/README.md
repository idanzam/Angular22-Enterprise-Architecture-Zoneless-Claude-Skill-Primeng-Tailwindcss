# ⛔ Anti-Patterns

Twelve ways to get a PR rejected. Each file: the crime, **why it's fatal in
Angular 22 specifically**, the fix, and a detection command you can wire into CI.

| # | Anti-pattern | The crime in one line |
|---|---|---|
| 1 | [rxjs-in-signals-world.md](rxjs-in-signals-world.md) | Any Observable/subscribe/pipe in app code — renders nothing under zoneless OnPush |
| 2 | [effect-writes-signals.md](effect-writes-signals.md) | `effect()` deriving state — glitch frames, ordering bugs; use `computed`/`linkedSignal` |
| 3 | [manual-loading-state.md](manual-loading-state.md) | Hand-rolled isLoading/hasError around HTTP — races that `httpResource` already solved |
| 4 | [zone-resurrection.md](zone-resurrection.md) | zone.js, `ChangeDetectorRef`, `NgZone`, `Eager` — confessions of non-signal state |
| 5 | [legacy-forms.md](legacy-forms.md) | `FormBuilder`/`ngModel`/dead `[control]` syntax now that Signal Forms are stable |
| 6 | [div-inside-primeng.md](div-inside-primeng.md) | Block `<div>` in PrimeNG slots — breaks internal flex; `<span>` + display classes |
| 7 | [dead-primeng-api.md](dead-primeng-api.md) | `styleClass`, `pTemplate`, `p-dropdown`… — removed API from training-data memory |
| 8 | [css-overrides-ng-deep.md](css-overrides-ng-deep.md) | `::ng-deep` + `!important` wars — tokens/`[dt]`/`[pt]` replaced all of it |
| 9 | [legacy-template-syntax.md](legacy-template-syntax.md) | `*ngIf`/`NgClass`/`@angular/animations` — forfeits v22 compile-time checks |
| 10 | [websocket-everywhere.md](websocket-everywhere.md) | Sockets on pages that need polling — server cost + client fragility for nothing |
| 11 | [frozen-design-decisions.md](frozen-design-decisions.md) | Hardcoded colors & physical directions — forks the design system, breaks RTL |
| 12 | [constructor-di-boilerplate.md](constructor-di-boilerplate.md) | Constructor injection — field initializers (signals!) need `inject()`; `@Service()` enforces it |
| — | [manual-files-and-builds.md](manual-files-and-builds.md) | Workflow: hand-made files & assistant-run builds — conventions drift, verification theater |

## CI sweep

Concatenate the detection blocks from each file into `scripts/anti-pattern-scan.sh`
and fail the pipeline on hits. The greps are intentionally high-recall — a few
false positives per repo beat one silent zoneless rendering bug in production.
