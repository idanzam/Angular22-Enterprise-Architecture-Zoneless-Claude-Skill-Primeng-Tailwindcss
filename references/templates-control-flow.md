# Templates, Control Flow, Defer, Animations — Angular 22

## Control flow — `@if / @for / @switch` only

```html
@if (store.fleet.hasValue()) {
  @for (sat of store.fleet.value(); track sat.id) {
    <app-satellite-card [satellite]="sat" (track)="follow($event)" />
  } @empty {
    <span class="flex flex-col items-center gap-2 p-8 text-muted-color">
      No satellites in this orbit.
    </span>
  }
} @else if (store.fleet.error()) {
  <p-message severity="error">Uplink failed.</p-message>
} @else {
  <p-skeleton height="10rem" />
}
```

- `track` is mandatory — `sat.id`, never `$index` for identity-bearing data.
- `@switch` with exhaustiveness (v22): unions can't silently miss a case.

```html
@switch (sat.status) {
  @case ('online') { <p-tag severity="success" value="Online" /> }
  @case ('degraded')
  @case ('maintenance') { <p-tag severity="warn" value="Limited" /> }   <!-- v21.1 fall-through -->
  @case ('offline') { <p-tag severity="danger" value="Offline" /> }
  @default never(sat.status)                                            <!-- compile error if a member is unhandled -->
}
```

`*ngIf` / `*ngFor` / `[ngClass]` / `[ngStyle]` are banned — use `@if` / `@for`,
`[class.x]` / `[style.x]`:

```html
<span [class.text-red-500]="sat.fuelPct < 10" [style.--gauge]="sat.fuelPct + '%'">
```

## Expression power-ups people don't know are legal now

```html
{{ callSign() ?? 'UNASSIGNED' }}                       <!-- nullish coalescing -->
{{ mass() ** 0.5 }}                                    <!-- exponent (v20+) -->
{{ 'thrust' in engine() ? engine().thrust : '—' }}     <!-- `in` operator -->
{{ /^[A-Z]{3}-\d+$/.test(sat.id) }}                    <!-- RegExp literals (v21) -->
{{ `${sat.name} · ${sat.orbit}` }}                     <!-- template literals -->
<p-button (onClick)="count = count + 1" />             <!-- assignments in events (v20.1+) -->
{{ format(...args()) }}                                <!-- spread in calls (v21.1) -->
<!-- v22: comments INSIDE tags -->
<input [value]="v()" <!-- (blur)="save()" — pending API --> />
```

v22 gotcha: `?.` returns `undefined` (not `null`) — aligned with TypeScript.

## `@defer` — ship less, hydrate less

```html
@defer (on viewport({ rootMargin: '200px' }); prefetch on idle) {
  <app-orbit-visualizer [fleet]="store.fleet.value()" />
} @placeholder {
  <p-skeleton height="24rem" />
} @loading (after 100ms; minimum 500ms) {
  <p-progressspinner />
} @error {
  <p-message severity="warn">3D view unavailable.</p-message>
}
```

- v22: `on idle(2000)` timeout form; v21: viewport IntersectionObserver options.
- Defer every below-the-fold heavy component (charts, editors, 3D, maps).
- Incremental hydration is default — `@defer (hydrate on viewport)` blocks
  skip hydration cost entirely until needed.

## Animations — `animate.enter` / `animate.leave` (the `@angular/animations` killer)

`@angular/animations` is deprecated. Native CSS animations + two bindings:

```html
<!-- classes applied on insert / before removal; removal waits for animation end -->
<p-card animate.enter="animate-fadein animate-duration-300"
        animate.leave="animate-fadeout animate-duration-200">
  ...
</p-card>

<!-- dynamic form -->
<span [animate.enter]="alertClass()">...</span>

<!-- event form for imperative APIs -->
<span (animate.leave)="runLeave($event)">...</span>
```

Pair with `tailwindcss-primeui` animate utilities or your own `--animate-*`
`@theme` tokens. For pure-CSS entry transitions, Tailwind's `starting:` variant
(`@starting-style`) needs no Angular API at all:

```html
<dialog open class="opacity-100 transition-discrete starting:open:opacity-0">
```

## i18n / RTL discipline

- Hebrew/Arabic support means **logical properties by default**: `ms-*`, `pe-*`,
  `text-start`, `inset-s-*` — never `ml-*`/`pl-*`/`left-*` in directional layouts.
- Translation loading is a resource; guard render with `@if (i18n.ready())` at
  the shell level — not per-component effects juggling `ChangeDetectorRef`
  (that was the Angular 21 pattern; zoneless v22 + signals made it obsolete).

```typescript
@Service()
export class I18nStore {
  readonly lang = signal<'en' | 'he' | 'ru'>('en');
  private readonly dict = httpResource<Translations>(() => `/i18n/${this.lang()}.json`);
  readonly ready = computed(() => this.dict.hasValue());
  readonly t = computed(() => this.dict.value() ?? {});
  readonly dir = computed(() => this.lang() === 'he' ? 'rtl' : 'ltr');
}
```

```html
<!-- shell -->
<main [attr.dir]="i18n.dir()">
  @if (i18n.ready()) { <router-outlet /> } @else { <p-progressspinner /> }
</main>
<!-- any component -->
<span>{{ i18n.t().navbar?.missions }}</span>
```
