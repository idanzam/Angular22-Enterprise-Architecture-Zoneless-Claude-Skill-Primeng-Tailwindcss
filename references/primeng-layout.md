# PrimeNG Layout Law — span-vs-div and Slot Discipline

## The rule that survived from Angular 21 — because it keeps being right

**Never place a `<div>` inside a PrimeNG component's content projection or
templates. Use `<span>` carrying Tailwind display classes.**

PrimeNG components lay out their internals with flex/grid and sized wrappers.
A raw `<div>` (block, full-width, new formatting context) fights that layout:
collapsed card paddings, broken header alignment, table cells that wrap wrong.
A `<span>` is layout-neutral until *you* give it `flex`/`grid`/`block` —
so the layout intent is always explicit, always visible in the class list.

```html
<!-- ❌ WRONG — block element fights the card's internal flex -->
<p-card>
  <div class="flex gap-3">
    <div>Orbit</div>
    <div>Velocity</div>
  </div>
</p-card>

<!-- ✅ CORRECT — span + explicit display class -->
<p-card>
  <span class="flex gap-3">
    <span>Orbit</span>
    <span>Velocity</span>
  </span>
</p-card>
```

```html
<!-- ❌ WRONG -->
<ng-template #header>
  <div class="flex justify-between"><div>Fleet</div><div>Actions</div></div>
</ng-template>

<!-- ✅ CORRECT — w-full because template slots are flex children -->
<ng-template #header>
  <span class="flex w-full items-center justify-between">
    <span class="text-xl font-semibold">Fleet</span>
    <p-button label="Add satellite" size="small" />
  </span>
</ng-template>
```

Scope of the law:
- Applies **inside** PrimeNG tags and their `<ng-template #...>` slots.
- Your own page scaffolding (outside PrimeNG) uses semantic HTML freely —
  `<main>`, `<section>`, `<nav>`, `<header>` — styled with Tailwind.
- Never nest interactive elements into slots that render buttons/links.

## Don't wrap PrimeNG in divs to position it — class the host

```html
<!-- ❌ wrapper div soup -->
<div class="mt-4"><div class="flex justify-end"><p-button label="Save" /></div></div>

<!-- ✅ class merges onto the host (styleClass is dead in v22) -->
<span class="mt-4 flex justify-end gap-2">
  <p-button label="Cancel" variant="text" severity="secondary" />
  <p-button label="Save" />
</span>
```

## Use the PrimeNG primitive, not raw HTML

| Need | Use | Not |
|---|---|---|
| Button | `<p-button>` / `pButton` | `<button class="...">` |
| Image w/ preview | `<p-gallery>` (v22) | `<img>` + custom lightbox |
| Section split | `<p-divider />` | `<hr>` / border hacks |
| Badge/status dot | `<p-tag>` / `<p-overlaybadge>` | span with rounded-full CSS |
| Card container | `<p-card>` / `<p-panel>` | div with shadow classes |
| Scroll region | `<p-scrollarea>` (v22) | `overflow-y-auto` div for app-level panes |
| App navigation | `<p-sidebar>` (v22 compound) | hand-rolled nav drawer |
| ⌘K palette | `<p-commandmenu>` | custom dialog + listbox |

Tailwind handles **spacing, sizing, alignment, typography, responsive
behavior** — PrimeNG handles **widgets and chrome**. CSS files stay empty.

## Layout skeleton for a page (the blessed shape)

```html
<main class="mx-auto flex max-w-screen-2xl flex-col gap-6 p-4 md:p-6">
  <header class="flex items-center justify-between">
    <span class="text-2xl font-semibold text-color">Mission Control</span>
    <span class="flex gap-2">
      <p-button label="New mission" />
    </span>
  </header>

  <section class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
    <p-card><!-- stat tile: span-based content --></p-card>
    ...
  </section>

  <p-card>
    <ng-template #header>
      <span class="flex w-full items-center justify-between p-4">
        <span class="font-medium">Active satellites</span>
        <p-inputtags [formField]="filters.tags" class="w-72" />
      </span>
    </ng-template>
    <p-table [value]="store.satellites.value()" [paginator]="true" [rows]="25">
      ...
    </p-table>
  </p-card>
</main>
```

## Table cells — spans only

```html
<ng-template #body let-sat>
  <tr>
    <td><span class="flex items-center gap-2 font-medium">{{ sat.name }}</span></td>
    <td>
      <p-tag [value]="sat.status" [severity]="sat.status === 'online' ? 'success' : 'danger'" />
    </td>
    <td class="text-right"><span class="tabular-nums">{{ sat.altitudeKm }} km</span></td>
  </tr>
</ng-template>
```

`tabular-nums` on every numeric column. Right-align numbers. Never `text-sm`
for body/table text — 16px base (PrimeNG 22 default) is the floor.
