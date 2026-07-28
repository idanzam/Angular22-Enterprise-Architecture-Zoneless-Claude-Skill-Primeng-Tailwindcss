# Pattern: WebSocket via Streaming Resource

**Use when:** pages whose PURPOSE is live data — live-ops console, trading screen, telemetry wall.
**Never on:** dashboards, lists, homepages (see anti-patterns/websocket-everywhere.md).
**Angular 22 ingredients:** `resource({ stream })`, `abortSignal`, `ResourceStreamItem`.

```typescript
import { Service, signal, resource, computed } from '@angular/core';
import type { ResourceStreamItem } from '@angular/core';

@Service()
export class LiveTelemetryStore {
  readonly satelliteId = signal<string | null>(null);

  readonly telemetry = resource<Telemetry, { id: string | null }>({
    params: () => ({ id: this.satelliteId() }),
    stream: async ({ params, abortSignal }) => {
      const out = signal<ResourceStreamItem<Telemetry>>({ value: EMPTY_TELEMETRY });
      if (!params.id) return out;

      const ws = new WebSocket(`wss://gs.mission.example/telemetry/${params.id}`);

      ws.onmessage = e => out.set({ value: JSON.parse(e.data) });
      ws.onclose  = e => { if (!e.wasClean) out.set({ error: new Error('link lost') }); };
      ws.onerror  = () => out.set({ error: new Error('telemetry link error') });

      // THE key line: param change OR component destroy closes the socket.
      abortSignal.addEventListener('abort', () => ws.close(1000, 'consumer gone'));
      return out;
    },
  });

  readonly signalStrength = computed(() => this.telemetry.value()?.signalDb ?? -Infinity);
}
```

```html
@if (store.telemetry.error()) {
  <p-message severity="warn">
    <span class="flex items-center gap-3">
      Telemetry link lost.
      <p-button label="Reconnect" size="small" (onClick)="store.telemetry.reload()" />
    </span>
  </p-message>
} @else if (store.telemetry.hasValue()) {
  <span class="grid grid-cols-3 gap-4 tabular-nums">
    <span>{{ store.telemetry.value().velocityKms }} km/s</span>
    <span>{{ store.signalStrength() }} dB</span>
    <span animate.enter="animate-fadein">{{ store.telemetry.value().timestamp | date:'HH:mm:ss' }}</span>
  </span>
}
```

## Reconnection with backoff (production version)

```typescript
stream: async ({ params, abortSignal }) => {
  const out = signal<ResourceStreamItem<Telemetry>>({ value: EMPTY_TELEMETRY });
  let attempt = 0;

  const connect = () => {
    if (abortSignal.aborted) return;
    const ws = new WebSocket(url(params.id));
    ws.onopen = () => { attempt = 0; };
    ws.onmessage = e => out.set({ value: JSON.parse(e.data) });
    ws.onclose = e => {
      if (abortSignal.aborted || e.wasClean) return;
      const delay = Math.min(30_000, 1_000 * 2 ** attempt++);
      setTimeout(connect, delay);                      // zoneless-safe: writes go to `out`
    };
    abortSignal.addEventListener('abort', () => ws.close(1000));
  };
  connect();
  return out;
}
```

## Rules

1. One socket per page, owned by a store, exposed only as a resource.
2. Cleanup is `abortSignal` — never `ngOnDestroy` bookkeeping.
3. Messages must be parsed/validated like any API response (Zod at the boundary).
4. `reload()` is the user-facing reconnect button for free.
5. High-frequency streams: coalesce in the socket callback (e.g. keep last
   frame per animation tick) before `out.set()` — signal writes are cheap but
   not free at 1000 msg/s.
