# Pattern: Lazy Feature (Routes + injectAsync + @defer)

**Use when:** structuring every feature — lazy is the default, eager is the exception.
**Angular 22 ingredients:** lazy `loadChildren`, `withComponentInputBinding`
query-param binding, `injectAsync()` for heavy services, `@defer` for heavy widgets.

Three independent lazy layers. Use all three:

## Layer 1 — route-level code splitting

```typescript
// app.routes.ts — every feature lazy, guards functional
export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.routes') },
  { path: 'fleet', canActivate: [authGuard],
    loadChildren: () => import('./features/fleet/fleet.routes') },
  { path: 'launch', canActivate: [authGuard],
    loadComponent: () => import('./features/launch/launch-form/launch-form')
      .then(m => m.LaunchForm) },
];
```

```typescript
// features/fleet/fleet.routes.ts — default export = zero ceremony at the call site
export default [
  { path: '', component: FleetPage },
  { path: ':satelliteId', component: SatelliteDetail },
] satisfies Routes;
```

Route/query params flow straight into `input()` signals — no ActivatedRoute:

```typescript
// provideRouter(routes, withComponentInputBinding({ queryParams: true }))
export class SatelliteDetail {
  readonly satelliteId = input.required<string>();     // from /fleet/:satelliteId
  readonly tab = input<'telemetry' | 'log'>('telemetry'); // from ?tab=log

  private readonly sat = httpResource<Satellite>(
    () => `/api/satellites/${this.satelliteId()}`);
}
```

## Layer 2 — service-level splitting with `injectAsync()` (v22)

Heavy, rarely-used services (PDF export, chart engines, parsers) should not
ride the feature chunk:

```typescript
export class MissionReportPanel {
  private readonly exporter = injectAsync(
    () => import('./report-exporter').then(m => m.ReportExporter),
    { prefetch: 'onIdle' },          // warm it after the page settles
  );

  protected readonly exporting = signal(false);

  protected async exportPdf(): Promise<void> {
    this.exporting.set(true);
    try { (await this.exporter).toPdf(this.report()); }
    finally { this.exporting.set(false); }
  }
}
```

## Layer 3 — template-level splitting with `@defer`

```html
@defer (on viewport({ rootMargin: '200px' }); prefetch on idle) {
  <app-orbit-visualizer [fleet]="store.fleet.value()" />
} @placeholder { <p-skeleton height="24rem" /> }
@error { <p-message severity="warn">3D view unavailable.</p-message> }
```

With v22's default incremental hydration, deferred blocks also skip hydration
cost in SSR — free on both axes.

## What goes where

| Weight | Mechanism |
|---|---|
| A page/section | `loadChildren` / `loadComponent` |
| A heavy service used on click | `injectAsync()` |
| A heavy component below the fold | `@defer (on viewport)` |
| A heavy component behind a toggle | `@defer (when condition())` |

## Rules

1. `app.routes.ts` contains ONLY lazy pointers + guards — no components imported.
2. Feature route files use `export default [...] satisfies Routes`.
3. Params via `input()` binding — `ActivatedRoute` subscription code is legacy.
4. Charts/editors/3D/maps: never in an eager chunk. Layer 2 or 3, always.
5. Verify with `ng build --stats-json` + esbuild analyzer that the initial
   chunk stays lean (budget it in angular.json: `initial` ≤ 500kB warning).
