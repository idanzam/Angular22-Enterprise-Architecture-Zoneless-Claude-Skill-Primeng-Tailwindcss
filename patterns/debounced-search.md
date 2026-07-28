# Pattern: Debounced Search (Search-as-You-Type)

**Use when:** live search boxes, autocomplete backed by an API, filter inputs.
**Angular 22 ingredients:** `debounced()` (v22 experimental), `resource()`, `abortSignal`.
**Replaces:** the RxJS `debounceTime + distinctUntilChanged + switchMap` stack.

```typescript
import { Service, signal, resource } from '@angular/core';
import { debounced } from '@angular/core';

@Service()
export class SatelliteSearchStore {
  readonly query = signal('');
  private readonly debouncedQuery = debounced(this.query, 300);

  readonly results = resource({
    params: () => ({ q: this.debouncedQuery().trim() }),
    loader: async ({ params, abortSignal }) => {
      if (params.q.length < 2) return [];                    // gate — no junk queries
      const res = await fetch(
        `/api/satellites/search?q=${encodeURIComponent(params.q)}`,
        { signal: abortSignal },                             // stale request auto-cancel
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<SatelliteHit[]>;
    },
  });
}
```

```html
<span class="flex flex-col gap-2">
  <input pInputText placeholder="Search satellites…"
    (input)="store.query.set($any($event.target).value)" />

  @if (store.results.isLoading()) {
    <span class="text-muted-color animate-telemetry-pulse">Searching…</span>
  } @else if (store.results.hasValue() && store.query().length >= 2) {
    <p-listbox [options]="store.results.value()" optionLabel="name"
      (onChange)="select($event.value)" />
    @if (store.results.value().length === 0) {
      <span class="text-muted-color">No matches for “{{ store.query() }}”.</span>
    }
  }
</span>
```

## Why this beats the RxJS version

| Concern | RxJS stack | This pattern |
|---|---|---|
| Debounce | `debounceTime(300)` | `debounced(sig, 300)` |
| Cancel stale requests | `switchMap` | `abortSignal` (actual network cancel) |
| Loading state | manual `tap`/flags | `results.isLoading()` |
| Teardown | `takeUntilDestroyed` | automatic |
| Template | `async` pipe | direct signal calls |

## Notes

- `debounced()` is experimental in v22 — acceptable here because the blast
  radius is one import. If it changes, the pattern's shape survives.
- For PrimeNG `p-autocomplete`, bind its `completeMethod` output to
  `store.query.set($event.query)` and `[suggestions]="store.results.value()"`.
- Minimum-length gating lives in the **loader**, not the template — the
  resource is the single source of truth for "what runs".
