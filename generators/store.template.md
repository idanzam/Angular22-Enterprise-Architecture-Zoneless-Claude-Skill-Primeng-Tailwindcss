# Generator Template: Signal Store

**Command first:** `ng g s features/{feature}/{feature}-store`
Then shape the generated service like this (replace `Entity`/`entity`):

```typescript
import { Service, signal, computed, linkedSignal, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';

import { AuthStore } from '../../core/stores/auth-store.service';
import { apiFetch } from '../../core/api/api-fetch';
import { EntityListSchema, type Entity } from './entity.model';

@Service()
export class EntityStore {
  // ── UI state ──────────────────────────────────────────────
  readonly filter = signal<EntityFilter>({ status: 'all' });

  // ── Server state ──────────────────────────────────────────
  readonly entities = httpResource<Entity[]>(
    () => `/api/entities?${toQuery(this.filter())}`,
    { defaultValue: [], parse: EntityListSchema.parse },
  );

  // ── Selection (survives refetch, resets on list identity change) ──
  readonly selectedId = linkedSignal<Entity[], string | null>({
    source: () => this.entities.value(),
    computation: (list, prev) =>
      list.some(e => e.id === prev?.value) ? prev!.value : (list[0]?.id ?? null),
  });

  // ── Derived ───────────────────────────────────────────────
  readonly selected = computed(() =>
    this.entities.value().find(e => e.id === this.selectedId()) ?? null);
  readonly count = computed(() => this.entities.value().length);

  // ── Mutations ─────────────────────────────────────────────
  async create(draft: EntityDraft): Promise<boolean> {
    const res = await apiFetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) this.entities.reload();
    return res.ok;
  }

  async update(id: string, patch: Partial<Entity>): Promise<boolean> {
    const before = this.entities.value();
    this.entities.update(list => list.map(e => (e.id === id ? { ...e, ...patch } : e)));
    const res = await apiFetch(`/api/entities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) this.entities.set(before); else this.entities.reload();
    return res.ok;
  }

  async remove(id: string): Promise<boolean> {
    const before = this.entities.value();
    this.entities.update(list => list.filter(e => e.id !== id));
    const res = await apiFetch(`/api/entities/${id}`, { method: 'DELETE' });
    if (!res.ok) this.entities.set(before);
    return res.ok;
  }
}
```

Checklist for the generated store:

- [ ] Four zones in order, signals `readonly`
- [ ] Zod schema imported from a sibling `*.model.ts`
- [ ] Mutations return `Promise<boolean>`, optimistic + `reload()`
- [ ] Polling (if needed) added in a constructor with visibility guard
- [ ] Spec file: test `computed`s and mutation rollback (stub `apiFetch`)
