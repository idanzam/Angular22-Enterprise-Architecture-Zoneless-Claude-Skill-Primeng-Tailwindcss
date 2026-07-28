# PrimeNG 22 + Tailwind 4 — One Design System, Zero Conflicts

The two libraries are designed to interlock. Done right, Tailwind utilities
**cleanly override** PrimeNG styles without `!important`, PrimeNG theme colors
become Tailwind utilities, and dark mode flips both with one class.
Done wrong, you get specificity wars and `::ng-deep` graveyards.

## 1. CSS layer ordering — the foundation

Tailwind v4 emits native cascade layers: `theme, base, components, utilities`.
PrimeNG must be slotted **between** `base` and `components`:

```typescript
providePrimeNG({
  theme: {
    preset: MissionPreset,
    options: {
      darkModeSelector: '.dark',
      cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
    },
  },
})
```

Resulting order: `theme → base → primeng → components → utilities`.
Utilities are last ⇒ **any Tailwind class on a PrimeNG element wins, no `!` needed.**
Never write unlayered app CSS — it would beat every layer and reintroduce chaos.

## 2. The bridge package — `tailwindcss-primeui`

```css
@import "tailwindcss";
@import "tailwindcss-primeui";
@custom-variant dark (&:where(.dark, .dark *));   /* must match darkModeSelector */
```

### Semantic utilities wired to live `--p-*` tokens

These follow the active preset AND color scheme automatically — change the
preset at runtime, every utility follows:

| Utility | Maps to |
|---|---|
| `bg-primary` / `text-primary` / `border-primary` | `--p-primary-color` |
| `bg-primary-emphasis`, `text-primary-contrast` | emphasis/contrast tokens |
| `primary-50 … primary-950`, `surface-0 … surface-950` | full palettes |
| `text-color`, `text-color-emphasis`, `text-muted-color` | content text tokens |
| `border-surface` | content border token |
| `bg-emphasis`, `bg-highlight`, `bg-highlight-emphasis` | hover/selection tokens |
| `rounded-border` | `--p-content-border-radius` |

**Prefer semantic utilities over raw palette classes.** `text-muted-color`
adapts to theme + dark mode; `text-gray-500` is frozen and needs `dark:` pairs.

All variants compose: `dark:sm:hover:bg-primary-emphasis`.

### Component-state variants (the killer feature nobody knows)

PrimeNG 22 renders `data-p-*` state attributes; the bridge ships ~90 variants
keyed to them — style PrimeNG internals from your template, no CSS:

```html
<input pInputText [formField]="form.callSign"
  class="p-invalid:border-red-400 p-invalid:bg-red-50 dark:p-invalid:bg-red-950/30" />

<p-togglebutton class="p-checked:bg-primary p-checked:text-primary-contrast" />
<p-datepicker [pt]="{ day: 'p-today:font-bold p-selected:bg-primary' }" />
```

Available: `p-invalid:`, `p-checked:`, `p-selected:`, `p-disabled:`, `p-focus:`,
`p-fluid:`, `p-small:`, `p-large:`, `p-sortable:`, `p-frozen:`, `p-today:`,
`p-modal:` and more.

### Animation utilities

PrimeFlex-style classes for `animate.enter`/`animate.leave` and `pStyleClass`:
`animate-fadein`, `animate-slidedown`, `animate-zoomin`, `animate-duration-300`,
`animate-delay-150`, `animate-infinite`, easing + fill-mode classes.

## 3. Dark mode — one class, both systems

```typescript
@Service()
export class ThemeStore {
  readonly dark = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.dark());
      localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
    });
  }
  toggle(): void { this.dark.update(d => !d); }
}
```

`.dark` on `<html>` flips PrimeNG (`darkModeSelector: '.dark'`), the Tailwind
`dark:` variant, and every `tailwindcss-primeui` semantic utility at once.
Add an inline `<head>` script to apply the class pre-paint (no FOUC).

## 4. Division of labor (memorize this table)

| Concern | Owner | Tool |
|---|---|---|
| Widgets (buttons, tables, dialogs…) | PrimeNG | components |
| Global look (colors, radius, densities) | PrimeNG tokens | `definePreset` |
| Instance skin | PrimeNG tokens | `[dt]` |
| Internal structure tweaks | PrimeNG | `[pt]` (+ `p-*` variants) |
| Page layout, grids, spacing | Tailwind | utilities on spans/semantic tags |
| Typography, alignment, responsive | Tailwind | utilities |
| Micro-interactions | Tailwind + Angular | `animate.enter/leave` + animate utils |
| Anything in a `.css` file | **nobody** | file stays empty |

## 5. Full-Tailwind option (design-system teams)

`providePrimeNG({ unstyled: true, pt: { /* global Tailwind pt preset */ } })`
+ `p-*` variants = PrimeNG behavior/accessibility with 100% Tailwind skin.
Powerful but a full design-system commitment — default stance: **styled mode**
with the layer ordering above.

## 6. Review checklist

- [ ] `cssLayer` order is `theme, base, primeng` (Tailwind v4 form)
- [ ] `@custom-variant dark` selector matches `darkModeSelector`
- [ ] No `::ng-deep`, no `!important`, no unlayered custom CSS
- [ ] Semantic utilities (`text-muted-color`, `bg-emphasis`) over frozen palette classes
- [ ] `p-invalid:` variants used for form error styling (not CSS)
- [ ] Every override attempt went up the ladder: utility → class → preset → dt → pt
