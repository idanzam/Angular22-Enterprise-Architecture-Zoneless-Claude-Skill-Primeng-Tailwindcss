# ⛔ Anti-Pattern: RxJS in a Signals World

## The crime

Any `Observable`, `Subject`, `.subscribe()`, `.pipe()`, or RxJS operator in
application code.

## Why it's fatal in Angular 22 specifically

In zoneless + OnPush-default Angular 22, change detection runs when **signals
read by a template change**. A `.subscribe()` callback writing a plain class
field renders *nothing* — there is no zone to notice it. Code like this
"worked" in zone-full Angular by accident; in v22 it's a silent data-display bug:

```typescript
// ❌ compiles, runs, renders NOTHING in v22
this.http.get<Sat[]>('/api/satellites').subscribe(sats => this.sats = sats);
```

Beyond correctness: two reactivity systems double the mental model, leak
subscriptions, and make every review a "which world is this in?" audit.

## The violations and their fixes

```typescript
// ❌ state
private data$ = new BehaviorSubject<Item[]>([]);
// ✅
readonly data = signal<Item[]>([]);

// ❌ derived
readonly total$ = this.items$.pipe(map(i => i.reduce(sum, 0)));
// ✅
readonly total = computed(() => this.items().reduce(sum, 0));

// ❌ HTTP
this.http.get(url).subscribe(...)
// ✅ reads
readonly fleet = httpResource<Sat[]>(() => url);
// ✅ writes
const res = await fetch(url, { method: 'POST', ... });

// ❌ debounce
this.query$.pipe(debounceTime(300), switchMap(...))
// ✅
const q = debounced(this.query, 300); resource({ params: () => ({ q: q() }), ... })

// ❌ combineLatest
combineLatest([a$, b$]).pipe(map(([a, b]) => a + b))
// ✅
computed(() => this.a() + this.b())
```

## The two sanctioned exceptions

1. **HTTP interceptors** (`HttpInterceptorFn`) — framework-shaped, Observables
   never escape into your code.
2. **Third-party boundary adapters** — one documented `.subscribe()` that
   pours into a signal and unsubscribes on `DestroyRef`.

## Detection

```bash
grep -rnE "\.subscribe\(|\.pipe\(|BehaviorSubject|new Subject|rxjs" src/app --include='*.ts' \
  | grep -v interceptor
# CI: fail the build on any hit outside sanctioned files
```

ESLint: ban `rxjs` imports via `no-restricted-imports`, allowlist the interceptor file.
