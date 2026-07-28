# Pattern: Dialogs (Confirm, Form Dialog, Headless)

**Use when:** confirmations, quick-create/edit modals, custom overlays.
**Angular 22 ingredients:** `p-dialog` + signal `visible` model, `p-confirmdialog`
service, Signal Forms inside dialogs, `#headless` for full-custom.

## Visibility is a signal — always

```typescript
@Component({ /* ... */ })
export class FleetPage {
  protected readonly createOpen = signal(false);
}
```

```html
<p-button label="New satellite" icon="pi pi-plus" (onClick)="createOpen.set(true)" />

<p-dialog [visible]="createOpen()" (visibleChange)="createOpen.set($event)"
  [modal]="true" [draggable]="false" [style]="{ width: '32rem' }">

  <ng-template #header>
    <span class="text-xl font-semibold">Register satellite</span>
  </ng-template>

  <app-satellite-create-form (saved)="createOpen.set(false)" />

</p-dialog>
```

The form is its **own component** — the dialog is chrome. This keeps the form
testable without a dialog harness and reusable as a page.

## Form-in-dialog: reset on open

```typescript
export class SatelliteCreateForm {
  readonly saved = output<void>();
  private readonly store = inject(FleetStore);

  protected readonly model = signal(EMPTY_DRAFT);
  protected readonly createForm = form(this.model, satelliteDraftSchema);

  protected async save(): Promise<void> {
    await submit(this.createForm, async () => {
      const ok = await this.store.create(this.model());
      if (!ok) throw new Error('Registration failed');
      this.model.set(EMPTY_DRAFT);      // reset for next open
      this.saved.emit();
    });
  }
}
```

## Confirmations — the service, not a hand-rolled dialog

```typescript
private readonly confirm = inject(ConfirmationService);   // provide once in app.config

decommission(sat: Satellite): void {
  this.confirm.confirm({
    message: `Decommission ${sat.name}? This cannot be undone.`,
    header: 'Confirm decommission',
    icon: 'pi pi-exclamation-triangle',
    acceptButtonProps: { label: 'Decommission', severity: 'danger' },
    rejectButtonProps: { label: 'Cancel', severity: 'secondary', variant: 'text' },
    accept: () => this.store.decommission(sat.id),
  });
}
```

```html
<!-- once, in the shell -->
<p-confirmdialog />
<p-toast />
```

## Headless dialog (fully Tailwind-styled)

```html
<p-dialog [visible]="open()" (visibleChange)="open.set($event)" [modal]="true">
  <ng-template #headless let-visible>
    <span class="flex w-96 flex-col gap-4 rounded-border bg-surface-0 p-6
                 dark:bg-surface-900 shadow-2xl"
          animate.enter="animate-fade-in-scale">
      <span class="text-lg font-semibold text-color">Abort launch sequence?</span>
      <span class="text-muted-color">Countdown will halt at the current mark.</span>
      <span class="flex justify-end gap-2">
        <p-button label="Stay on count" severity="secondary" variant="text"
          (onClick)="open.set(false)" />
        <p-button label="Abort" severity="danger" (onClick)="abort()" />
      </span>
    </span>
  </ng-template>
</p-dialog>
```

## Rules

1. `[visible]` + `(visibleChange)` with a signal — never a boolean field.
2. Dialog content = dedicated component with `output()` events. The page
   decides what closing means.
3. Destructive actions go through `ConfirmationService` with a `danger` accept button.
4. One `<p-confirmdialog />` + one `<p-toast />` in the shell — never per-page.
5. Span-vs-div law applies inside all dialog templates.
