# ⛔ Anti-Pattern: Hand-Rolled Loading State

## The crime

Reimplementing what `resource()` already is — the isLoading/hasError/data
signal triplet around an HTTP call:

```typescript
// ❌ 20 lines of state machine that ships with the framework
readonly isLoading = signal(false);
readonly hasError = signal(false);
readonly data = signal<Sat[]>([]);

async load(): Promise<void> {
  this.isLoading.set(true);
  this.hasError.set(false);
  try {
    const res = await fetch('/api/satellites');
    if (!res.ok) throw new Error();
    this.data.set(await res.json());
  } catch {
    this.hasError.set(true);
  } finally {
    this.isLoading.set(false);
  }
}
```

## Why it's fatal

Beyond the boilerplate, the hand-rolled version is **wrong** in ways the
resource is right:

- No cancellation — a filter change mid-flight lets the stale response
  overwrite the fresh one (classic race).
- No `reloading` vs `loading` distinction — refreshes blank the UI.
- No request de-duplication, no SSR TransferState, no `parse` validation hook.
- Every service invents slightly different flag names — templates can't be uniform.

## The fix

```typescript
// ✅ the entire thing
readonly satellites = httpResource<Sat[]>(
  () => `/api/satellites?status=${this.filter()}`,
  { defaultValue: [], parse: SatListSchema.parse },
);
```

```html
@if (store.satellites.isLoading()) { <p-skeleton height="12rem" /> }
@else if (store.satellites.error()) { <p-message severity="error">…</p-message> }
@else { <p-table [value]="store.satellites.value()">…</p-table> }
```

Refetch = change a signal the URL reads, or `reload()`. Race-free by design
(`abortSignal` cancels the stale request).

## The "but I need custom logic" cases

| Need | Still a resource |
|---|---|
| Custom transport / headers dance | `resource({ loader })` with your fetch code inside |
| Transform the response | do it in the loader, or a `computed` over `value()` |
| Chain two calls | `chain()` (v22) or a loader that awaits both |
| Manual trigger only | param signal starts `undefined`; set it to fire |

## Detection

```bash
grep -rnE "isLoading\s*=\s*signal|loading\s*=\s*signal\(true|hasError\s*=\s*signal" src/app --include='*.ts'
# each hit adjacent to a fetch() read is this anti-pattern
```
