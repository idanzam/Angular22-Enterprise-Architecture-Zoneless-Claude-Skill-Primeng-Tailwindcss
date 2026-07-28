# ⛔ Anti-Pattern: Frozen Design Decisions

Two flavors of the same disease: hardcoding a value that the design system
manages dynamically.

## Flavor 1 — frozen colors

```html
<!-- ❌ ignores theme, ignores dark mode, ignores brand switching -->
<span class="bg-white text-gray-700 border border-gray-200">
<span class="bg-slate-900 text-slate-100">          <!-- "dark mode" done by hand -->
<span style="color: #6366f1">                        <!-- the token's VALUE, frozen -->
```

Why fatal: the PrimeNG preset + `tailwindcss-primeui` maintain live `--p-*`
variables for exactly these roles. Frozen classes fork the design system —
dark mode flips everything except your hardcoded spans, runtime brand
switching (multi-tenant) silently breaks, and design changes become sweeps.

```html
<!-- ✅ semantic utilities — track theme, scheme, and brand automatically -->
<span class="bg-surface-0 text-color border border-surface">
<span class="bg-emphasis text-muted-color">
<span class="text-primary">
```

Raw palette classes (`text-red-500`) are fine for genuinely semantic-free
accents (an error flash, a chart series) — pair them with `dark:` variants.
UI chrome (surfaces, text, borders, hovers) is **always** semantic.

## Flavor 2 — frozen directions (RTL breakage)

```html
<!-- ❌ physical properties — mirror-broken the day Hebrew/Arabic ships -->
<span class="ml-4 pl-6 text-left border-l">
<span class="absolute left-0">
```

Why fatal: retrofitting RTL onto physical utilities means touching every
template. Tailwind 4.2 logical utilities cost nothing and are correct in both
directions from day one:

```html
<!-- ✅ logical — same class correct in LTR and RTL -->
<span class="ms-4 ps-6 text-start border-s">
<span class="absolute inset-s-0">
```

Directional icons flip explicitly: `class="rtl:-scale-x-100"` on chevrons/arrows.

## Bonus flavor — frozen magic numbers

```html
<span class="w-[247px] top-[117px]">   <!-- ❌ pixel archaeology -->
```

Arbitrary values need a reason (a comment) or a token (`@theme`). Layout by
flex/grid + the spacing scale; v4's dynamic scale (`w-61`) covers odd sizes
without brackets.

## Detection

```bash
# frozen surfaces/text in templates (tune the palette list to taste)
grep -rnE "bg-(white|black|gray|slate|zinc)-?[0-9]*|text-(gray|slate|zinc)-[0-9]+" src/app --include='*.html'
# physical direction utilities
grep -rnE "\b(ml|mr|pl|pr)-[0-9]|text-left|text-right|left-[0-9]|right-[0-9]|border-l\b|border-r\b" src/app --include='*.html'
# unexplained arbitrary values
grep -rnE "\[[0-9]+px\]" src/app --include='*.html'
```
