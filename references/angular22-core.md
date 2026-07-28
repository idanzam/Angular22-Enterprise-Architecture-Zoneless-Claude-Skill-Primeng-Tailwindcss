# Angular 22 Core — What Changed and Why It Matters

> Angular 22.0.0 released **June 3, 2026**. Requires **TypeScript 6.0+** and **Node 22+**.

## The headline: v22 is the "stability release"

Everything the signals era promised is now **stable**:

| Feature | v21 status | v22 status |
|---|---|---|
| Signal Forms (`@angular/forms/signals`) | experimental | **STABLE** |
| `resource()` / `httpResource()` / `rxResource` | experimental | **STABLE** |
| `@angular/aria` (headless a11y primitives) | dev preview | **STABLE** |
| Zoneless change detection | **default since v21** | default |
| `ChangeDetectionStrategy.OnPush` | opt-in | **DEFAULT** |
| Fetch HTTP backend | opt-in `withFetch()` | **DEFAULT** (`withFetch()` deprecated) |
| Incremental hydration | opt-in | **DEFAULT** |
| Vitest test runner | default since v21 | default (+ karma→vitest migration) |

## Defaults you must NOT re-declare

Angular 22 made the right thing the default. Re-declaring it marks the code as legacy:

```typescript
// ❌ LEGACY NOISE in v22 — all of this is default now
@Component({
  standalone: true,                                  // default since v19
  changeDetection: ChangeDetectionStrategy.OnPush,   // default since v22
})
providers: [
  provideZonelessChangeDetection(),                  // default since v21
  provideHttpClient(withFetch()),                    // fetch is default, withFetch deprecated
]

// ✅ v22 — clean
@Component({
  selector: 'app-mission-panel',
  imports: [Card, Button],
  templateUrl: './mission-panel.html',
})
```

`ChangeDetectionStrategy.Default` was renamed to `Eager` and is a code smell —
never introduce it. Never inject `ChangeDetectorRef`.

## New in v22 that most developers have not seen yet

### `@Service()` decorator — root services without the ceremony

```typescript
import { Service } from '@angular/core';

@Service()                       // shorthand for @Injectable({ providedIn: 'root' })
export class TelemetryStore {
  // inject()-style DI only — @Service() forbids constructor parameters
  private readonly log = inject(MissionLogger);
}
```

### `injectAsync()` — lazy services with automatic code splitting

```typescript
export class ReportPanel {
  // The chunk containing ReportExporter is only downloaded when first awaited
  private exporter = injectAsync(() => import('./report-exporter').then(m => m.ReportExporter), {
    prefetch: 'onIdle',
  });

  async export(): Promise<void> {
    (await this.exporter).exportPdf(this.rows());
  }
}
```

### `debounced()` — experimental signal debouncing (kills a whole RxJS use case)

```typescript
import { debounced } from '@angular/core';

readonly query = signal('');
readonly debouncedQuery = debounced(this.query, 300);

readonly results = resource({
  params: () => ({ q: this.debouncedQuery() }),
  loader: ({ params, abortSignal }) =>
    fetch(`/api/satellites?q=${params.q}`, { signal: abortSignal }).then(r => r.json()),
});
```

### Template comments inside tags (v22)

```html
<input
  [value]="callSign()"
  <!-- (blur)="normalize()"  — disabled until ground-station sync lands -->
  type="text" />
```

### Stricter templates by default (v22)

- `strictTemplates: true` is the default.
- Optional chaining `?.` now returns `undefined` (TypeScript-aligned, was `null`) with better type narrowing.
- `@switch` supports exhaustiveness checking: `@default never(status)` errors at compile time when a union member is unhandled.
- New compile errors: duplicate input/output names (NG1054), multiple component selector matches (NG8023).

### Router changes (v22 — breaking)

- `paramsInheritanceStrategy` default flipped `'emptyOnly'` → `'always'`.
- `canMatch` guards receive a required `currentSnapshot` parameter.
- `withComponentInputBinding({ queryParams: true })` binds query params to component inputs.
- `RouterLink` gained `browserUrl` input.
- Standalone `isActive('/missions')` returns a computed signal — no more `routerLinkActive` gymnastics in TS.

### Resource SSR caching (v22)

`resource({ id: 'mission-list', ... })` caches resolved values in `TransferState`
so hydration reuses the server response. Never use `id` for user-specific data.

### WebMCP (experimental, v22)

Expose app functionality as tools to in-browser AI agents via `navigator.modelContext`:
`provideExperimentalWebMcpTools()`, `provideExperimentalWebMcpForms()`, or per-form:

```typescript
launchForm = form(this.model, s => { required(s.mission); }, {
  experimentalWebMcpTool: { name: 'scheduleLaunch', description: 'Schedules a launch window.' },
});
```

## Deprecations & removals checklist (v22)

| Gone / deprecated | Use instead |
|---|---|
| `withFetch()` | nothing — fetch backend is default |
| `reportProgress` | `reportUploadProgress` / `reportDownloadProgress` (upload progress needs `withXhr()`) |
| `ChangeDetectionStrategy.Default` | nothing — OnPush is default (`Eager` exists for legacy only) |
| `withIncrementalHydration()` | nothing — default (`withNoIncrementalHydration()` to opt out) |
| `@angular/animations` | `animate.enter` / `animate.leave` (see templates-control-flow.md) |
| Karma | Vitest (`ng update` migration: `migrate-karma-to-vitest`) |
| Node 20 / TS 5.9 | Node 22+ / TS 6+ |

`*ngIf` / `*ngFor` / `NgClass` / `NgStyle` still compile but are banned here —
run the official migrations (`ng generate @angular/core:control-flow`,
`ngclass-to-class-migration`, `ngstyle-to-style-migration`).

## NOT in v22 (do not hallucinate these)

- **Selectorless components** — still an RFC/prototype. Components still need
  `selector` + `imports`. Do not emit `<UserCard />` template syntax.
- Zone.js is deprecated *in spirit* but not removed — legacy apps opt in with
  `provideZoneChangeDetection()`. New code never touches it.

## Version pins for a new project

```bash
ng new mission-control --style tailwind    # v21+ CLI generates Tailwind wiring
```

```jsonc
// package.json — expected major versions (July 2026)
{
  "@angular/core": "^22.0.0",
  "primeng": "^22.0.0",
  "@primeuix/themes": "^3.0.0",
  "@primeicons/angular": "^8.0.0",
  "tailwindcss": "^4.3.0",
  "@tailwindcss/postcss": "^4.3.0",
  "tailwindcss-primeui": "^0.6.1"
}
```

> **PrimeNG 22 licensing note:** v22 is the first release under the PrimeUI
> dual license (Community/Commercial). Community tier is free below defined
> revenue/team thresholds; commercial keys go in
> `providePrimeNG({ license: '...' })`. Verification is fully offline — no
> telemetry. Check https://primeui.dev/licenses before shipping commercially.
