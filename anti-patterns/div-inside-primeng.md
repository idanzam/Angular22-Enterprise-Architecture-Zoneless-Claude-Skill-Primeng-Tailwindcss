# ⛔ Anti-Pattern: `<div>` Inside PrimeNG Components

## The crime

Block-level `<div>` elements projected into PrimeNG component content or
`<ng-template>` slots.

```html
<!-- ❌ all of these fight PrimeNG's internal layout -->
<p-card>
  <div class="grid grid-cols-2">…</div>
</p-card>

<ng-template #header>
  <div class="flex justify-between"><div>Title</div><div>Actions</div></div>
</ng-template>

<p-dialog>
  <div class="p-4">…</div>
</p-dialog>
```

## Why it's fatal

PrimeNG components lay out their slots with flex/grid and measured wrappers.
A `<div>` brings block formatting: full-width stretch, margin collapse, new
formatting contexts. Symptoms are subtle and theme-dependent — collapsed card
padding, header actions wrapping under titles, dialog footers misaligned —
and they surface at the *next* PrimeNG minor when internal markup shifts.
A `<span>` is layout-inert until you assign display explicitly, so intent is
always visible in the class list and never fights the host.

## The fix

```html
<!-- ✅ span + explicit display utility -->
<p-card>
  <span class="grid grid-cols-2 gap-4">…</span>
</p-card>

<ng-template #header>
  <span class="flex w-full items-center justify-between">
    <span class="text-xl font-semibold">Title</span>
    <p-button label="Action" size="small" />
  </span>
</ng-template>
```

Companion crimes with the same root cause:

```html
<!-- ❌ wrapper-div positioning of a PrimeNG host -->
<div class="mt-4 flex justify-end"><p-button label="Save" /></div>
<!-- ✅ class the host (styleClass is dead — plain class merges) -->
<p-button label="Save" class="mt-4 self-end" />

<!-- ❌ raw HTML where a Prime primitive exists -->
<button class="rounded bg-indigo-600 px-4 py-2">Go</button>
<!-- ✅ -->
<p-button label="Go" />
```

## Scope boundary (don't over-apply)

**Your own page scaffolding** — outside PrimeNG tags — uses semantic HTML
freely: `<main>`, `<section>`, `<nav>`, `<header>`, `<table>` rows in table
body templates (`<tr>/<td>` are required there). The law governs what you
**project into** PrimeNG components.

## Detection

```bash
# divs in the same line-neighborhood as PrimeNG tags / templates — review each
grep -rn -B1 -A3 "<p-card\|<p-dialog\|<p-panel\|<ng-template #" src/app --include='*.html' \
  | grep "<div"
```
