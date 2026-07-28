# Data Loading — httpResource / resource / fetch

## The law

| Operation | API | Why |
|---|---|---|
| GET that drives UI | `httpResource()` | declarative, signal-native, auto-cancel, SSR cache |
| GET with custom transport | `resource()` + fetch loader | full control, same signal surface |
| Live streams (WS/SSE) | `resource({ stream })` | signal-native streaming |
| POST / PUT / PATCH / DELETE | `async fetch()` | mutations are imperative actions |
| Anything with `.subscribe()` | — | **banned** |

v22 made `httpResource` stable and switched `HttpClient` to the **fetch backend
by default** — interceptors still work, `provideHttpClient()` is implicit in
the root injector.

## `httpResource()` — reads

```typescript
import { httpResource } from '@angular/common/http';

@Service()
export class SatelliteStore {
  readonly filter = signal<'all' | 'online' | 'offline'>('all');

  // Reactive URL — refetches automatically when filter() changes, cancels stale requests
  readonly satellites = httpResource<Satellite[]>(
    () => `/api/satellites?status=${this.filter()}`,
    { defaultValue: [] },
  );

  // Full request object + response validation
  readonly telemetry = httpResource(() => ({
    url: `/api/telemetry/${this.selectedId()}`,
    params: { window: '5m' },
    headers: { 'X-Ground-Station': 'TLV-1' },
  }), { parse: TelemetrySchema.parse });   // Zod at the boundary — typed AND validated
}
```

Conditional fetch: return `undefined` from the URL function to idle the resource
(`() => this.id() ? \`/api/sat/${this.id()}\` : undefined`).

Variants: `httpResource.text()`, `httpResource.blob()`, `httpResource.arrayBuffer()`.

### Template consumption — handle all states, no isLoading booleans

```html
@if (store.satellites.isLoading()) {
  <p-skeleton height="12rem" />
} @else if (store.satellites.error()) {
  <p-message severity="error">Telemetry link lost — retrying…</p-message>
} @else if (store.satellites.hasValue()) {
  <p-table [value]="store.satellites.value()">...</p-table>
}
```

`hasValue()` is a type guard — inside the branch, `value()` is non-undefined.
Hand-rolled `isLoading = signal(false)` around HTTP calls is a rejected pattern:
the resource already exposes `status()`, `isLoading()`, `error()`.

## `resource()` — custom loaders & streams

```typescript
readonly missionLog = resource({
  params: () => ({ id: this.missionId() }),
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(`/api/missions/${params.id}/log`, { signal: abortSignal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<LogEntry[]>;
  },
  id: 'mission-log',        // v22: SSR TransferState caching — never for user-specific data
});
```

### Live telemetry via `stream` (replaces the RxJS WebSocket stack)

```typescript
readonly liveTelemetry = resource({
  params: () => ({ id: this.activeSatelliteId() }),
  stream: async ({ params, abortSignal }) => {
    const value = signal<ResourceStreamItem<Telemetry>>({ value: EMPTY_TELEMETRY });
    const ws = new WebSocket(`wss://gs.example.com/telemetry/${params.id}`);
    ws.onmessage = e => value.set({ value: JSON.parse(e.data) });
    ws.onerror = () => value.set({ error: new Error('link lost') });
    abortSignal.addEventListener('abort', () => ws.close());   // param change / destroy = clean close
    return value;
  },
});
```

Streaming resources are allowed **only on pages that justify realtime**
(live ops console, trading screen). Dashboards and public pages use REST polling:

```typescript
constructor() {
  setInterval(() => this.satellites.reload(), 5_000);
}
```

### Search-as-you-type — `debounced()` + resource

```typescript
readonly query = signal('');
private readonly debouncedQuery = debounced(this.query, 300);   // v22 experimental

readonly results = resource({
  params: () => ({ q: this.debouncedQuery() }),
  loader: ({ params, abortSignal }) =>
    params.q.length < 2 ? Promise.resolve([]) :
    fetch(`/api/search?q=${encodeURIComponent(params.q)}`, { signal: abortSignal })
      .then(r => r.json()),
});
```

### Dependent resources — `chain()` (v22)

```typescript
readonly operator = httpResource<Operator>(() => `/api/operators/${this.opId()}`);
// idle/loading/error of `operator` propagates — no undefined juggling
readonly fleet = httpResource<Satellite[]>(
  () => `/api/fleets/${chain(this.operator)?.fleetId}/satellites`);
```

## Mutations — `fetch()` + resource reload

```typescript
async decommission(id: string): Promise<boolean> {
  const res = await fetch(`/api/satellites/${id}`, {
    method: 'DELETE',
    headers: this.auth.headers(),
  });
  if (res.status === 401 && await this.auth.tryRefresh()) return this.decommission(id);
  if (res.ok) {
    // optimistic local update, then authoritative reload
    this.satellites.update(list => list.filter(s => s.id !== id));
    this.satellites.reload();
  }
  return res.ok;
}
```

Rules:
- Mutations live in store services, return `Promise<boolean>` or typed results.
- After a successful mutation: `resource.reload()` (authoritative) and/or
  `resource.update()` (optimistic). Never re-implement the GET.
- Auth: attach tokens in one place (an interceptor for httpResource, a helper
  for raw fetch). 401 → single refresh attempt → retry once → logout.
- Never swallow errors silently — set/throw so `error()` surfaces in UI.
