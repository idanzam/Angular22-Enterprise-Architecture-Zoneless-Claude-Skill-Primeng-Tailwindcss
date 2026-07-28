# Pattern: REST Polling (The Default for "Fresh" Data)

**Use when:** dashboards, market/list pages, status boards — anywhere data
should be recent but a socket is not justified.
**Angular 22 ingredients:** `httpResource` + `reload()` + visibility guard.

## Basic — resource + interval reload

```typescript
@Service()
export class GroundStationStore {
  readonly stations = httpResource<Station[]>(() => '/api/ground-stations', { defaultValue: [] });

  constructor() {
    setInterval(() => this.stations.reload(), 5_000);   // zoneless-safe: reload() drives signals
  }
}
```

That's the whole pattern. `reload()` no-ops while a request is already in
flight, keeps the previous `value()` during refresh (status becomes
`'reloading'`, not `'loading'`), so the UI never flickers.

## Production — pause when tab is hidden

```typescript
@Service()
export class GroundStationStore {
  readonly stations = httpResource<Station[]>(() => '/api/ground-stations', { defaultValue: [] });
  private readonly visible = signal(!document.hidden);

  constructor() {
    document.addEventListener('visibilitychange', () =>
      this.visible.set(!document.hidden));

    setInterval(() => {
      if (this.visible()) this.stations.reload();       // don't hammer the API from background tabs
    }, 5_000);

    effect(() => {
      if (this.visible()) this.stations.reload();       // instant refresh on tab return
    });
  }
}
```

## Distinguish refresh from first load in the template

```html
@if (store.stations.status() === 'loading') {
  <p-skeleton height="12rem" />                          <!-- first load only -->
} @else if (store.stations.hasValue()) {
  <span class="relative">
    @if (store.stations.status() === 'reloading') {
      <p-progressbar mode="indeterminate" class="absolute inset-x-0 top-0 h-1" />
    }
    <p-table [value]="store.stations.value()">...</p-table>
  </span>
}
```

## Choosing an interval

| Data | Interval |
|---|---|
| Prices / market tickers | 3–5s |
| Operational dashboards | 10–30s |
| Slowly-changing lists | 60s or on-focus only |
| Anything faster than 2–3s | you probably want `resource({ stream })` — justify it |

## Rules

1. Polling lives in the **store constructor**, never in components.
2. Never re-implement the GET inside the interval — always `reload()` the
   existing resource (single URL, single parse, single error path).
3. Respect `document.hidden` on anything ≤10s.
4. Server-driven cadence (e.g. `Retry-After`) beats hardcoded numbers when available.
