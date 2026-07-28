# ⛔ Anti-Pattern: WebSocket Everywhere

## The crime

Live sockets on pages that don't need them:

```typescript
// ❌ homepage price ticker over WebSocket
// ❌ dashboard opening 4 sockets for 4 widgets
// ❌ a "realtime" list page whose data changes twice a minute
// ❌ raw ws in a component with ngOnDestroy bookkeeping
export class HomeComponent implements OnDestroy {
  private ws = new WebSocket(environment.wssUrl);
  ngOnDestroy() { this.ws.close(); }   // forgotten in 1 of 3 copies of this code
}
```

## Why it's fatal

- **Server cost:** every socket is held state on the backend — connection
  registries, heartbeats, sticky sessions. A thousand dashboard tabs = a
  thousand idle connections doing the work a cached GET does for free.
- **Client fragility:** sockets die on network blips, laptop sleep, proxies.
  Every socket page needs reconnect/backoff/resubscribe logic — per socket.
- **No caching, no CDN, no HTTP semantics:** polling rides ETags, gateway
  caches, and observability tooling; sockets bypass all of it.
- Component-owned sockets leak on navigation and multiply per component instance.

## The decision table (memorize)

| Data | Transport |
|---|---|
| Prices/tickers on public pages | REST polling 3–5s |
| Dashboards, admin lists | REST polling 10–30s |
| Notifications badge | polling 30–60s (or one app-wide SSE) |
| Order book / live trading | WebSocket — the page's purpose IS the stream |
| Live telemetry console | WebSocket |
| Chat | WebSocket |

Rule of thumb: a socket is justified when **sub-second freshness is the
feature**, not a nice-to-have.

## The fix

Polling (default): see patterns/polling.md —

```typescript
readonly stations = httpResource<Station[]>(() => '/api/ground-stations');
constructor() { setInterval(() => this.stations.reload(), 10_000); }
```

Sockets (earned): see patterns/websocket-stream.md — a `resource({ stream })`
in a store, cleanup via `abortSignal`, one socket per justified page:

```typescript
readonly telemetry = resource({
  params: () => ({ id: this.satelliteId() }),
  stream: async ({ params, abortSignal }) => { /* ws bound to abortSignal */ },
});
```

Because both shapes expose the same resource surface (`value/isLoading/error/
reload`), a page can graduate from polling to streaming later **without
touching its template** — so there is no "build it realtime just in case".

## Detection

```bash
grep -rn "new WebSocket" src/app --include='*.ts'
# every hit must be: (a) inside a store, (b) inside resource({stream}),
# (c) on a page whose purpose is live data. Anything else is this anti-pattern.
```
