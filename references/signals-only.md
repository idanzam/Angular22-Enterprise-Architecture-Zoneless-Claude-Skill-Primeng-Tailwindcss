# Signals-Only Reactivity — Zero RxJS

## The policy

RxJS is **banned** for application code. Not "discouraged" — banned.

```text
BANNED: Observable, Subject, BehaviorSubject, ReplaySubject
BANNED: .subscribe(), .pipe(), of(), from(), fromEvent(), interval(), timer()
BANNED: combineLatest, switchMap, mergeMap, debounceTime, takeUntilDestroyed
BANNED: rxResource (it exists for RxJS interop — we have no RxJS to interop with)
BANNED: async pipe fed by an Observable
```

Why: Angular 22 is zoneless + OnPush by default. Signals are the change-detection
contract. One reactivity system means one mental model, zero leaked subscriptions,
and templates that update precisely when their dependencies change.

## The complete migration map (RxJS → v22)

| RxJS pattern | Angular 22 replacement |
|---|---|
| `new BehaviorSubject(v)` | `signal(v)` |
| `subject.next(v)` | `sig.set(v)` / `sig.update(fn)` |
| `subject.getValue()` | `sig()` |
| `obs$.pipe(map(x => x.y))` | `computed(() => sig().y)` |
| `combineLatest([a$, b$])` | `computed(() => f(a(), b()))` |
| `obs$.subscribe(fn)` | `effect(() => fn(sig()))` |
| `debounceTime(300)` | `debounced(sig, 300)` *(v22 experimental)* |
| `switchMap` + HTTP | `resource()` — auto-cancels via `abortSignal` |
| `this.http.get(url)` | `httpResource(() => url)` |
| `webSocket(url)` | `resource({ stream })` |
| `takeUntilDestroyed()` | not needed — `effect()`/`resource()` self-clean |
| `async` pipe | call the signal: `{{ sig() }}` |
| writable derived state | `linkedSignal()` |

## The four primitives — exact roles

### `signal()` — source of truth

```typescript
readonly satellites = signal<Satellite[]>([]);
readonly selectedId = signal<string | null>(null);
```

Prefer `update()` over read-then-set. Signals holding arrays/objects must be
replaced immutably: `this.satellites.update(list => [...list, sat])`.

### `computed()` — ALL derived state

```typescript
readonly selected = computed(() =>
  this.satellites().find(s => s.id === this.selectedId()) ?? null);

readonly onlineCount = computed(() =>
  this.satellites().filter(s => s.status === 'online').length);
```

If a value can be calculated from other signals, it is a `computed`. Never an
`effect` that writes a signal — that is the #1 reviewed-and-rejected pattern.

### `linkedSignal()` — derived but writable

Resets when the source changes, yet accepts local writes. v22.1 adds a custom
`set` so writes flow back to the parent state:

```typescript
// Selection that survives list refresh but resets when the mission changes
readonly selectedPad = linkedSignal({
  source: this.mission,
  computation: mission => mission().defaultPad,
});

// v22.1 — writable view over a slice of a bigger signal
readonly maxRetries = linkedSignal(
  () => this.config().maxRetries,
  { set: value => this.config.update(c => ({ ...c, maxRetries: value })) },
);
```

### `effect()` — side effects ONLY

Legitimate uses: `document.title`, `localStorage`, analytics, imperative
third-party APIs, logging. Nothing else.

```typescript
constructor() {
  effect(() => {
    document.title = `${this.activeMission().name} · Mission Control`;
  });
}
```

Rules:
- An effect that calls `.set()` on any signal is an anti-pattern (use `computed`/`linkedSignal`).
- Use `untracked(() => ...)` to read a signal without subscribing to it.
- Effects created in injection context self-destroy with the component. No cleanup code.

## Component I/O — signal-based, always

```typescript
export class SatelliteCard {
  readonly satellite = input.required<Satellite>();   // NOT @Input()
  readonly compact = input(false);
  readonly track = output<string>();                  // NOT @Output()/EventEmitter
  readonly expanded = model(false);                   // two-way: [(expanded)]

  readonly uptime = computed(() => formatUptime(this.satellite().uptimeSec));
}
```

Queries are signals too: `viewChild()`, `viewChildren()`, `contentChild()`.
Host bindings read signals directly:

```typescript
@Component({
  host: {
    '[class.offline]': 'satellite().status === "offline"',
    '[attr.aria-busy]': 'telemetry.isLoading()',
  },
})
```

## The single allowed exception

A third-party library that only exposes Observables (rare in 2026 — PrimeNG 22
is signal-friendly). Convert to a signal **at the boundary, in one place**,
and never let the Observable escape:

```typescript
// boundary adapter — the only .subscribe() allowed in the codebase, documented
const sub = legacyLib.stream$.subscribe(v => this.bridgeSignal.set(v));
inject(DestroyRef).onDestroy(() => sub.unsubscribe());
```
