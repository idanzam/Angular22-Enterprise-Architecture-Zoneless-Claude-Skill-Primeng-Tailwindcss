# Pattern: Signal Store (Service as State Container)

**Use when:** any domain state shared by more than one component.
**Angular 22 ingredients:** `@Service()`, `signal`, `computed`, `linkedSignal`, `httpResource`.

## Shape

Every store has four zones, in this order: UI state → server state → derived → mutations.

```typescript
import { Service, signal, computed, linkedSignal, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Service()
export class FleetStore {
  private readonly auth = inject(AuthStore);

  // 1 ── UI state (writable signals)
  readonly orbitFilter = signal<'all' | 'LEO' | 'MEO' | 'GEO'>('all');
  readonly viewMode = signal<'table' | 'grid'>('table');

  // 2 ── Server state (resources — never manual fetch+set for reads)
  readonly fleet = httpResource<Satellite[]>(
    () => `/api/satellites?orbit=${this.orbitFilter()}`,
    { defaultValue: [] },
  );

  // 3 ── Derived state (computed / linkedSignal — never effects)
  readonly onlineCount = computed(() =>
    this.fleet.value().filter(s => s.status === 'online').length);

  readonly selectedId = linkedSignal<Satellite[], string | null>({
    source: () => this.fleet.value(),
    computation: (list, prev) =>
      list.some(s => s.id === prev?.value) ? prev!.value : (list[0]?.id ?? null),
  });

  readonly selected = computed(() =>
    this.fleet.value().find(s => s.id === this.selectedId()) ?? null);

  // 4 ── Mutations (async fetch → reload)
  async rename(id: string, name: string): Promise<boolean> {
    const res = await fetch(`/api/satellites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.auth.headers() },
      body: JSON.stringify({ name }),
    });
    if (res.ok) this.fleet.reload();
    return res.ok;
  }
}
```

## Consumption

```typescript
@Component({ /* ... */ })
export class FleetPage {
  protected readonly store = inject(FleetStore);   // smart component
}
```

```html
<p-select [options]="orbits" [(ngModel)]="store.orbitFilter" />  <!-- ❌ NO -->
<p-select [options]="orbits" [formField]="filterForm.orbit" />   <!-- ✅ via a form -->
<!-- or imperative UI state: -->
<p-selectbutton [options]="orbits" (onChange)="store.orbitFilter.set($event.value)" />
```

## Rules

1. All signals `readonly` on the field; writability controlled by exposing
   `WritableSignal` only where writes are legitimate.
2. Components never call `fetch()` — only store methods.
3. One store per domain; feature stores live in the feature folder,
   app-wide stores (auth, theme, i18n) in `core/stores/`.
4. Cross-store: reading another store's signals inside `computed` is fine;
   writing goes through that store's methods.
5. No NgRx. If a team demands structure, `@ngrx/signals` `signalStore` is the
   only acceptable library (RxJS-free) — but plain services scale further than
   most teams believe.

## Testing

```typescript
it('computes online count', async () => {
  const store = TestBed.inject(FleetStore);
  // resources are testable via HttpTestingController or by stubbing fetch
  store.fleet.set([{ id: '1', status: 'online' } as Satellite]);   // resource local set
  expect(store.onlineCount()).toBe(1);
});
```
