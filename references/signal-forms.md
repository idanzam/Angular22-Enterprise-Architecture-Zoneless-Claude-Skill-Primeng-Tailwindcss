# Signal Forms — STABLE in v22 — The Only Form System

> Import path: `@angular/forms/signals`. Stable since Angular 22.0 (June 2026).
> `ReactiveFormsModule`, `FormBuilder`, `FormGroup`, `FormControl`,
> template-driven `ngModel` forms — **all banned** in new code.

## Mental model

A form is **derived from a plain signal model**. No parallel form-state tree to
keep in sync — the model signal IS the state; the schema attaches validation.

```typescript
import { Component, signal } from '@angular/core';
import {
  form, FormField, submit,
  required, email, minLength, min, minDate,
  validate, validateHttp, disabled, hidden, debounce, applyWhen,
} from '@angular/forms/signals';

interface LaunchRequest {
  mission: string;
  contactEmail: string;
  crewCount: number;
  windowStart: Date | null;
  hasPayload: boolean;
  payloadMassKg: number;
}

@Component({
  selector: 'app-launch-form',
  imports: [FormField /* + PrimeNG components */],
  templateUrl: './launch-form.html',
})
export class LaunchForm {
  readonly model = signal<LaunchRequest>({
    mission: '', contactEmail: '', crewCount: 1,
    windowStart: null, hasPayload: false, payloadMassKg: 0,
  });

  readonly launchForm = form(this.model, s => {
    required(s.mission, { message: 'Mission name is required' });
    minLength(s.mission, 3);

    required(s.contactEmail);
    email(s.contactEmail, { message: 'Enter a valid email' });

    min(s.crewCount, 1);
    minDate(s.windowStart, new Date(), { message: 'Launch window must be in the future' });  // NEW in v22

    // conditional structure — fields exist, logic applies conditionally
    hidden(s.payloadMassKg, ({ valueOf }) => !valueOf(s.hasPayload));
    applyWhen(s, ({ value }) => value().hasPayload, sub => {
      min(sub.payloadMassKg, 0.1, { message: 'Payload mass required' });
    });

    // cross-field custom validation
    validate(s.crewCount, ({ value, valueOf }) =>
      value() > 3 && valueOf(s.payloadMassKg) > 20_000
        ? { kind: 'overweight', message: 'Crew + payload exceeds vehicle limit' }
        : undefined);

    // async server-side validation with built-in debounce (v22)
    validateHttp(s.mission, {
      request: ({ value }) => `/api/missions/name-available?name=${value()}`,
      errors: (available: boolean) =>
        available ? undefined : { kind: 'taken', message: 'Mission name already used' },
      debounce: 400,
    });
  });

  async submit(): Promise<void> {
    await submit(this.launchForm, async () => {
      await fetch('/api/launches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.model()),
      });
    });
  }
}
```

## Template binding — `[formField]`, nothing else

```html
<!-- naming gotcha: early v21 tutorials show [control] or [field] — both are DEAD.
     The stable v22 directive is FormField / [formField]. -->
<input pInputText [formField]="launchForm.mission" />

@if (launchForm.mission().touched() && launchForm.mission().invalid()) {
  <p-message severity="error" size="small" variant="simple">
    {{ launchForm.mission().errors()[0]?.message }}
  </p-message>
}

<p-button label="Schedule Launch" (onClick)="submit()"
  [disabled]="launchForm().invalid() || launchForm().submitting()" />
```

PrimeNG 22 form components accept `[formField]` directly (`pInputText`,
`p-select`, `p-datepicker`, `p-checkbox`, `p-inputnumber`, ...). Pair with the
`invalid` input for styling: `[invalid]="launchForm.mission().invalid() && launchForm.mission().touched()"`.

## Field state — everything is a signal

`launchForm.mission` is the field node; **calling it** gives state:

| Signal | Meaning |
|---|---|
| `value()` | `WritableSignal` of the field value |
| `valid()` / `invalid()` | validation result |
| `errors()` | `ValidationError[]` — `{ kind, message? }` |
| `pending()` | async validation in flight |
| `touched()` / `dirty()` | interaction state |
| `disabled()` / `readonly()` / `hidden()` | schema-driven UI state |

Form-level: `launchForm().valid()`, `launchForm().value()`, `launchForm().submitting()`.
`submit()` auto-marks all fields touched — no manual `markAllAsTouched()` dance.

## Schema toolbox (full stable surface)

- Built-in validators: `required`, `email`, `min`, `max`, `minLength`,
  `maxLength`, `pattern`, `minDate`, `maxDate` — all accept
  `{ message }` (string or `ctx => string`) and `{ when }` conditions.
- Logic: `disabled()`, `readonly()`, `hidden()`, `debounce(path, 300)` or
  `debounce(path, 'blur')` (v22).
- Structure: `applyWhen(path, cond, schemaFn)`, `applyEach(arrayPath, itemFn)`
  for form arrays, `schema()` for reusable schema fragments.
- Custom: `validate` (sync), `validateAsync({ params, factory, onSuccess, onError })`
  (resource-powered), `validateHttp`, `validateTree` (subtree errors),
  `validateStandardSchema(path, zodSchema)` — **Zod/Valibot plug straight in**.
- Utilities: `customError({ kind, message })`, `getError()`, `reloadValidation()`,
  `metadata()` for attaching arbitrary data to fields.

## Reusable schemas — the enterprise pattern

```typescript
// shared/schemas/contact.schema.ts
export const contactSchema = schema<Contact>(c => {
  required(c.name);
  required(c.email);
  email(c.email);
});

// anywhere
readonly crewForm = form(this.crewModel, f => {
  applyEach(f.members, member => contactSchema(member));
});
```

## Custom form controls

Implement `FormValueControl` (or `FormCheckboxControl`) — works for components
AND directives; `ControlValueAccessor` interop exists for legacy widgets:

```typescript
export class ThrustSlider implements FormValueControl<number> {
  readonly value = model.required<number>();
  readonly disabled = input(false);
  readonly touch = output<void>();       // v22: touched is input+touch output
}
```

## Migration from Reactive Forms

- Gradual path: `@angular/forms/signals/compat` → `compatForm()` wraps an
  existing `FormGroup` while templates move to `[formField]`.
- Global error-CSS mapping replaces scattered `ng-invalid` CSS:

```typescript
provideSignalFormsConfig({
  classes: { 'is-invalid': f => f.state().invalid() && f.state().touched() },
});
```

## Hard rules

1. Model is a single `signal<T>` of a plain interface — no class instances.
2. Never read `.value` imperatively into component fields — bind signals.
3. Async validation goes through `validateHttp`/`validateAsync` — never a
   hand-rolled effect watching a field.
4. One `form()` per logical form. Wizards: one model, `applyWhen` per step,
   or one form per step feeding a parent signal.
5. Submission always goes through `submit()` — it manages `submitting()`,
   touched-marking, and server-error routing.
