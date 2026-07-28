# Anti-Patterns — What Gets a PR Rejected

Each entry: the crime, why it's a crime in Angular 22, the fix.

## 1. RxJS anywhere

```typescript
// ❌
this.http.get<Sat[]>('/api/satellites').pipe(takeUntilDestroyed()).subscribe(s => this.sats = s);
// ✅
readonly sats = httpResource<Sat[]>(() => '/api/satellites', { defaultValue: [] });
```
Zoneless + OnPush means a `.subscribe()` writing plain fields renders **nothing**.
The "it works on my machine" cases are accidental — an unrelated signal triggered the view.

## 2. Effect that writes signals

```typescript
// ❌ effect-as-computed — ordering bugs, double renders, infinite loops
effect(() => { this.total.set(this.items().reduce((a, i) => a + i.mass, 0)); });
// ✅
readonly total = computed(() => this.items().reduce((a, i) => a + i.mass, 0));
```
Writable-derived? `linkedSignal()`. Effects are for the world outside Angular
(title, storage, analytics) — nothing else.

## 3. Hand-rolled loading state around HTTP

```typescript
// ❌ three signals + try/finally reinventing resource()
readonly isLoading = signal(false); readonly error = signal(false);
async load() { this.isLoading.set(true); try { ... } finally { this.isLoading.set(false); } }
// ✅ the resource IS the state machine
readonly fleet = httpResource<Sat[]>(() => '/api/satellites');
// template: fleet.isLoading() / fleet.error() / fleet.hasValue()
```

## 4. `ChangeDetectorRef` / `NgZone` / `Eager`

Any of `markForCheck()`, `detectChanges()`, `zone.run()`,
`ChangeDetectionStrategy.Eager` = a non-signal state mutation is hiding nearby.
Fix the state, not the symptom.

## 5. Reactive/Template forms in new code

```typescript
// ❌ 2023 called
this.form = this.fb.group({ email: ['', Validators.required] });
// ✅ Signal Forms (stable v22)
readonly model = signal({ email: '' });
readonly f = form(this.model, s => { required(s.email); email(s.email); });
```
Also rejected: `[(ngModel)]` in forms, and the early-experimental `[control]` /
`[field]` directive names from v21 tutorials — the stable directive is `[formField]`.

## 6. `<div>` inside PrimeNG

```html
<!-- ❌ breaks internal flex layout -->
<p-card><div class="flex gap-3">...</div></p-card>
<!-- ✅ -->
<p-card><span class="flex gap-3">...</span></p-card>
```

## 7. Dead PrimeNG API from training data

`styleClass="..."` (removed v22) · `pTemplate="header"` (removed v22) ·
`p-dropdown`/`p-calendar`/`p-sidebar`/`p-overlaypanel` (renamed v18, gone v20) ·
`@primeng/themes` import (removed v22 — use `@primeuix/themes`) ·
`p-multiselect` for new code (deprecated v22 — `p-select [multiple]`).
When in doubt run `validate_usage` on the primeng MCP server.

## 8. Custom CSS / `::ng-deep`

```css
/* ❌ specificity war you will lose at the next PrimeNG minor */
:host ::ng-deep .p-datatable .p-datatable-thead > tr > th { background: #1e293b; }
```
```html
<!-- ✅ tokens or pt -->
<p-table [pt]="{ headerCell: 'bg-surface-800 text-surface-0' }" />
```
The ladder: Tailwind utility → host `class` → `definePreset` → `[dt]` → `[pt]`.
`::ng-deep` is rung 6 and rung 6 does not exist.

## 9. CSS files with content

A component `.css` file containing rules means Tailwind + tokens were not tried.
`@apply` collections recreate the maintenance problem Tailwind removes —
repetition is solved by extracting a component.

## 10. `*ngIf` / `[ngClass]` / `@angular/animations`

Legacy syntax compiles but forfeits v22 compile-time checks (`@switch`
exhaustiveness, better narrowing) and marks the file as unmigrated.
`@angular/animations` is deprecated — `animate.enter` / `animate.leave`.

## 11. WebSocket sprawl

WebSocket/stream resources on dashboards, homepages, list pages = rejected.
Polling (`resource.reload()` on interval) is cheaper, cacheable, and resilient.
Realtime transport is reserved for pages whose purpose is live data, and it
must run through `resource({ stream })` so cleanup rides `abortSignal`.

## 12. Manual file creation & Claude running builds

Component files written by hand drift from CLI conventions (missing spec,
wrong naming). `ng g` or stop. Claude never runs `ng build` / `ng serve` /
deploy — code review is impossible when the reviewer is also the runtime.

## 13. Constructor injection & `@Injectable` boilerplate

```typescript
// ❌
constructor(private http: HttpClient, private auth: AuthStore) {}
// ✅
private readonly auth = inject(AuthStore);   // and @Service() on root services
```

## 14. Frozen colors in a token world

`text-gray-500` / `bg-slate-900` hardcode a palette that ignores theme and dark
mode. Use `text-muted-color`, `bg-surface-*`, `bg-primary` — they track the
active PrimeNG preset. Physical direction utilities (`ml-*`, `left-*`) in
RTL-capable apps: same crime, use logical (`ms-*`, `inset-s-*`).

## 15. `zone.js` resurrection

Adding `zone.js`, `provideZoneChangeDetection()`, or `setTimeout(..., 0)`
"to fix change detection" reanimates the architecture v21/v22 buried.
The fix is always: make the state a signal.
