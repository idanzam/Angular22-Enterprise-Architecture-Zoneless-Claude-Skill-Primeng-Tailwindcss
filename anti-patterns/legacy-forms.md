# ⛔ Anti-Pattern: Legacy Forms in New Code

## The crime

Starting new forms with the 2016–2023 stack now that Signal Forms are stable:

```typescript
// ❌ Reactive Forms — legacy as of v22
this.form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.minLength(8)],
});
// ❌ template-driven
<input [(ngModel)]="user.email" required email />
// ❌ dead experimental names from v21 tutorials
<input [control]="form.email" />      // never stable
<input [field]="form.email" />        // renamed in 21.1
```

## Why it's fatal

- Reactive Forms hold state in an Observable-based parallel tree —
  `valueChanges` subscriptions drag RxJS back in, and the model/form sync
  problem ("patchValue vs setValue vs reset") is a permanent bug farm.
- Weak typing at the edges; cross-field validation is ceremony; conditional
  fields are `enable()/disable()` choreography.
- Signal Forms invert it: **the model signal IS the state**, the schema is
  declarative, every state flag is a signal the template reads directly —
  which is precisely what zoneless OnPush rendering wants.
- The `[control]`/`[field]` names are landmines: code generated from v21-era
  tutorials fails on stable v22. The directive is **`FormField` / `[formField]`**.

## The fix

```typescript
readonly model = signal({ email: '', password: '' });
readonly loginForm = form(this.model, s => {
  required(s.email); email(s.email);
  minLength(s.password, 8);
});
```

```html
<input pInputText [formField]="loginForm.email" />
<p-button [disabled]="loginForm().invalid() || loginForm().submitting()" />
```

Cross-field, conditional, async — all declarative: `validate` with `valueOf`,
`hidden`/`applyWhen`, `validateHttp({ debounce })`. Zod plugs in via
`validateStandardSchema`. See references/signal-forms.md.

## Existing Reactive Forms code

Don't big-bang. Route through the compat layer:

```typescript
import { compatForm } from '@angular/forms/signals/compat';
// wraps an existing FormGroup; template moves to [formField] now,
// the FormGroup dies in a later pass
```

Priority order: new forms → Signal Forms immediately; touched forms → migrate
while you're there; untouched working forms → backlog.

## Detection

```bash
grep -rnE "FormBuilder|FormGroup|FormControl|ReactiveFormsModule|NgForm" src/app --include='*.ts'
grep -rnE "\[\(ngModel\)\]" src/app --include='*.html' | grep -v selectbutton   # UI-state ngModel on widgets is tolerated
grep -rnE "\[control\]=|\[field\]=" src/app --include='*.html'                  # dead experimental syntax
```
