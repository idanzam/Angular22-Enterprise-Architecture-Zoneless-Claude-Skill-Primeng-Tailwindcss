# Pattern: Multi-Step Wizard with One Signal Form

**Use when:** onboarding flows, multi-step creation (mission setup, checkout).
**Angular 22 ingredients:** one model signal, one `form()`, `applyWhen` per step,
`p-stepper`, per-step validity via subtree state.

The core decision: **one model + one form for the whole wizard** — not a form
per step. Cross-step validation, final submission, and progress display all
fall out naturally.

```typescript
interface MissionWizard {
  step: never;                       // steps are UI state, NOT form data
  basics:  { name: string; objective: string };
  vehicle: { vehicleId: string | null; padId: string | null };
  crew:    { members: CrewMember[] };
}

@Component({ /* ... */ })
export class MissionWizardPage {
  protected readonly step = signal(0);                     // UI state, outside the form

  protected readonly model = signal<MissionWizardData>({
    basics:  { name: '', objective: '' },
    vehicle: { vehicleId: null, padId: null },
    crew:    { members: [] },
  });

  protected readonly wizard = form(this.model, s => {
    required(s.basics.name); minLength(s.basics.name, 3);
    required(s.basics.objective);

    required(s.vehicle.vehicleId);
    required(s.vehicle.padId);
    // cross-step rule — pad must support the chosen vehicle
    validate(s.vehicle.padId, ({ value, valueOf }) =>
      isCompatible(valueOf(s.vehicle.vehicleId), value())
        ? undefined
        : { kind: 'incompatible', message: 'Pad does not support this vehicle' });

    applyEach(s.crew.members, member => {
      required(member.name);
      required(member.role);
    });
  });

  // per-step validity = the subtree's field state
  protected readonly stepValid = computed(() => [
    this.wizard.basics().valid(),
    this.wizard.vehicle().valid(),
    this.wizard.crew().valid(),
  ]);

  protected next(): void {
    if (this.stepValid()[this.step()]) this.step.update(v => v + 1);
    else this.wizard().markAsTouched();          // surface the step's errors
  }

  protected async launch(): Promise<void> {
    await submit(this.wizard, async () => {
      const ok = await this.store.createMission(this.model());
      if (!ok) throw new Error('Creation failed');
    });
  }
}
```

```html
<p-stepper [value]="step() + 1" class="max-w-3xl">
  <p-step-list>
    <p-step [value]="1">Basics</p-step>
    <p-step [value]="2">Vehicle</p-step>
    <p-step [value]="3">Crew</p-step>
  </p-step-list>
</p-stepper>

@switch (step()) {
  @case (0) {
    <span class="flex flex-col gap-4" animate.enter="animate-fadein">
      <input pInputText [formField]="wizard.basics.name" placeholder="Mission name" />
      <textarea pTextarea [formField]="wizard.basics.objective" rows="3"></textarea>
    </span>
  }
  @case (1) { <app-vehicle-step [form]="wizard.vehicle" /> }
  @case (2) { <app-crew-step [form]="wizard.crew" /> }
  @default never(step())
}

<span class="mt-6 flex justify-between">
  <p-button label="Back" severity="secondary" variant="text"
    [disabled]="step() === 0" (onClick)="step.set(step() - 1)" />
  @if (step() < 2) {
    <p-button label="Continue" (onClick)="next()" />
  } @else {
    <p-button label="Launch mission" icon="pi pi-send" (onClick)="launch()"
      [disabled]="wizard().invalid() || wizard().submitting()"
      [loading]="wizard().submitting()" />
  }
</span>
```

## Rules

1. Step index is a plain UI signal — never part of the form model.
2. Field subtrees (`wizard.basics`) pass to child step components as inputs —
   children bind `[formField]` on the subtree's fields, no prop-drilling of values.
3. "Continue" gates on the subtree's `valid()`; final button on the whole form.
4. Draft persistence: `effect(() => localStorage.setItem('wizard', JSON.stringify(this.model())))`
   — one line, debounce with `debounced(this.model, 1000)` if the model is large.
