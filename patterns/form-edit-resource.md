# Pattern: Edit Form Hydrated from a Resource

**Use when:** classic "load entity → edit → save" screens.
**Angular 22 ingredients:** `httpResource` + `linkedSignal` + Signal Forms.

The trap: Signal Forms need a writable model signal, but the data arrives
async from a resource. The bridge is `linkedSignal` — it resets the model when
a *different* entity loads, yet accepts the user's local edits.

```typescript
import { Component, signal, linkedSignal, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { form, FormField, submit, required, minLength } from '@angular/forms/signals';

@Component({
  selector: 'app-mission-edit',
  imports: [FormField /* + PrimeNG */],
  templateUrl: './mission-edit.html',
})
export class MissionEdit {
  // Route param bound by withComponentInputBinding
  readonly missionId = input.required<string>();

  private readonly store = inject(MissionStore);

  // 1 ── source of truth from the server
  private readonly mission = httpResource<Mission>(
    () => `/api/missions/${this.missionId()}`);

  // 2 ── writable model derived from the resource:
  //      re-seeds when a new mission arrives, keeps local edits otherwise
  protected readonly model = linkedSignal<Mission | undefined, MissionFormData>({
    source: () => this.mission.value(),
    computation: m => m
      ? { name: m.name, objective: m.objective, crewCount: m.crewCount }
      : { name: '', objective: '', crewCount: 0 },
  });

  // 3 ── form over the model
  protected readonly editForm = form(this.model, s => {
    required(s.name); minLength(s.name, 3);
    required(s.objective);
  });

  protected readonly loading = this.mission.isLoading.bind(this.mission);

  protected async save(): Promise<void> {
    await submit(this.editForm, async () => {
      const ok = await this.store.update(this.missionId(), this.model());
      if (!ok) throw new Error('Save failed');
      this.mission.reload();                       // reconcile with server truth
    });
  }
}
```

```html
@if (mission.isLoading()) {
  <p-skeleton height="20rem" />
} @else if (mission.error()) {
  <p-message severity="error">Mission not found.</p-message>
} @else {
  <span class="flex max-w-xl flex-col gap-4">
    <input pInputText [formField]="editForm.name" />
    <textarea pTextarea [formField]="editForm.objective" rows="4"></textarea>

    <span class="flex justify-end gap-2">
      <p-button label="Discard" severity="secondary" variant="text"
        (onClick)="model.set(modelFromServer())" />
      <p-button label="Save" (onClick)="save()"
        [disabled]="editForm().invalid() || editForm().submitting()"
        [loading]="editForm().submitting()" />
    </span>
  </span>
}
```

## Dirty-state guard for free

```typescript
readonly hasUnsavedChanges = computed(() => this.editForm().dirty());

// route guard
export const unsavedChangesGuard: CanDeactivateFn<MissionEdit> = cmp =>
  !cmp.hasUnsavedChanges() || confirm('Discard unsaved changes?');
```

## Rules

1. The resource is read-only truth; the `linkedSignal` model is the edit buffer.
2. Never `effect(() => this.model.set(...))` to copy resource → model —
   that's exactly what `linkedSignal` is for.
3. After save: `reload()` the resource. The linkedSignal re-seeds automatically
   with the fresh server state.
4. Map API entity → form data explicitly (step 2) — forms should not carry
   server-only fields like `id`, `createdAt`.
