# Pattern: httpResource CRUD (Reads + Mutations + Optimistic Updates)

**Use when:** any entity list/detail screen with create/update/delete.
**Angular 22 ingredients:** `httpResource` (stable), `parse` with Zod, `reload()`, `update()`.

## Read side — declarative

```typescript
readonly missions = httpResource<Mission[]>(
  () => `/api/missions?status=${this.statusFilter()}`,
  { defaultValue: [], parse: MissionListSchema.parse },
);

// detail resource driven by selection — idles when nothing selected
readonly detail = httpResource<Mission>(() =>
  this.selectedId() ? `/api/missions/${this.selectedId()}` : undefined);
```

## Write side — imperative + reconciliation

```typescript
async create(draft: MissionDraft): Promise<boolean> {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...this.auth.headers() },
    body: JSON.stringify(draft),
  });
  if (res.ok) this.missions.reload();          // authoritative
  return res.ok;
}

async update(id: string, patch: Partial<Mission>): Promise<boolean> {
  // 1. optimistic — instant UI
  const before = this.missions.value();
  this.missions.update(list => list.map(m => m.id === id ? { ...m, ...patch } : m));

  // 2. server
  const res = await fetch(`/api/missions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...this.auth.headers() },
    body: JSON.stringify(patch),
  });

  // 3. rollback on failure, reconcile on success
  if (!res.ok) this.missions.set(before);
  else this.missions.reload();
  return res.ok;
}

async remove(id: string): Promise<boolean> {
  const before = this.missions.value();
  this.missions.update(list => list.filter(m => m.id !== id));
  const res = await fetch(`/api/missions/${id}`, { method: 'DELETE', headers: this.auth.headers() });
  if (!res.ok) this.missions.set(before);
  return res.ok;
}
```

## Template — all resource states, always

```html
@if (store.missions.isLoading()) {
  <p-skeleton height="16rem" />
} @else if (store.missions.error()) {
  <p-message severity="error">
    <span class="flex items-center gap-3">
      Failed to load missions.
      <p-button label="Retry" size="small" variant="text" (onClick)="store.missions.reload()" />
    </span>
  </p-message>
} @else {
  <p-table [value]="store.missions.value()">...</p-table>
}
```

## Rules

1. GET = resource. POST/PATCH/DELETE = `fetch()` in a store method. Never mix.
2. Optimistic updates always keep a `before` snapshot and roll back on `!ok`.
3. Always `reload()` after a successful mutation — optimistic state is a guess,
   the server is the truth.
4. `parse` (Zod/Valibot) on every resource — API drift becomes a loud error at
   the boundary instead of `undefined` deep in a template.
5. Dependent lookups use `chain()` (v22) instead of nested `computed` undefined-guards.
