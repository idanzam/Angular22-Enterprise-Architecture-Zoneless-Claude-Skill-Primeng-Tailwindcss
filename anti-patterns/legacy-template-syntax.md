# ⛔ Anti-Pattern: Legacy Template Syntax

## The crime

2023 template idioms in a v22 codebase:

```html
<!-- ❌ structural directives -->
<div *ngIf="isLoading; else content">…</div>
<li *ngFor="let sat of satellites; trackBy: trackById">…</li>
<div [ngSwitch]="status">…</div>

<!-- ❌ class/style directive objects -->
<span [ngClass]="{ 'text-red-500': critical, 'font-bold': selected }">
<span [ngStyle]="{ 'width.px': pct * 3 }">
```

```typescript
// ❌ the ceremony they drag along
import { NgIf, NgFor, NgClass, NgStyle } from '@angular/common';
trackById(index: number, sat: Satellite) { return sat.id; }
// ❌ @angular/animations — deprecated package
trigger('fade', [transition(':enter', [style({opacity: 0}), animate('200ms')])])
```

## Why it's fatal

- Legacy control flow forfeits v22's compile-time power: `@switch`
  exhaustiveness (`@default never(x)`), better `?.` narrowing under
  default-on `strictTemplates`, `@empty` blocks, and `@defer`'s ecosystem.
- `NgClass`/`NgStyle` allocate and diff objects every check; `[class.x]` /
  `[style.x]` bindings are direct and read better with Tailwind class lists.
- `@angular/animations` is deprecated — a whole runtime module for what CSS +
  `animate.enter/leave` do natively.
- Mixed old/new syntax makes files unreviewable: which era's rules apply?

## The fix

```html
@if (store.fleet.isLoading()) { <p-skeleton height="12rem" /> }
@else { … }

@for (sat of store.fleet.value(); track sat.id) {
  <app-satellite-card [satellite]="sat" />
} @empty {
  <span class="text-muted-color">No satellites.</span>
}

@switch (sat.status) {
  @case ('online') { <p-tag severity="success" value="Online" /> }
  @case ('offline') { <p-tag severity="danger" value="Offline" /> }
  @default never(sat.status)
}

<span [class.text-red-500]="critical()" [class.font-bold]="selected()">
<span [style.width.px]="pct() * 3">

<p-card animate.enter="animate-fadein animate-duration-300"
        animate.leave="animate-fadeout">…</p-card>
```

`track` is part of the syntax — no trackBy methods. Animations are classes —
no triggers, no `provideAnimationsAsync` (PrimeNG 22 doesn't need it either).

## Migration (mechanical — run the official schematics)

```bash
ng generate @angular/core:control-flow
ng generate @angular/core:ngclass-to-class-migration
ng generate @angular/core:ngstyle-to-style-migration
```

## Detection

```bash
grep -rnE "\*ngIf|\*ngFor|\*ngSwitch|\[ngClass\]|\[ngStyle\]" src/app --include='*.html'
grep -rn "@angular/animations" src --include='*.ts'
```
