# Tailwind CSS 4.3 — CSS-First, Oxide, and the Utilities Nobody Uses Yet

> Latest: **v4.3.0** (May 2026). No `tailwind.config.js`. No `content` array.
> No `@tailwind base/components/utilities`. Everything lives in CSS.
> Angular path: **PostCSS plugin** (`@tailwindcss/postcss`) — the CLI's esbuild
> builder does not take Vite plugins. `ng new --style tailwind` wires it for you.

## Setup with Angular 22

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

```json
// .postcssrc.json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

```css
/* src/styles.css — the ENTIRE configuration */
@import "tailwindcss";
@import "tailwindcss-primeui";                          /* PrimeNG bridge — see integration doc */
@custom-variant dark (&:where(.dark, .dark *));         /* class-based dark mode */

@theme {
  --font-display: "Space Grotesk", "sans-serif";
  --breakpoint-3xl: 120rem;
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;
  @keyframes fade-in-scale {
    0%   { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
}
```

`@theme` tokens **generate utilities** (`font-display`, `3xl:`, `animate-fade-in-scale`)
— unlike plain `:root` variables. Rules:

- Reference other variables? Use `@theme inline` (value inlined at usage —
  mandatory when mapping runtime-switched vars like PrimeNG's `--p-*`).
- Kill a default scale: `--color-*: initial;` then define your palette.
- Custom utility: `@utility tab-4 { tab-size: 4; }`; functional with default
  (v4.3): `@utility tab-* { tab-size: --value(integer, --default(4)); }`.
- Content detection is automatic (respects `.gitignore`). Additions:
  `@source "../node_modules/@corp/ui";` · exclusions: `@source not "./legacy";`
  · safelist: `@source inline("{hover:,}bg-red-{100..900..100}");`.
- Component-scoped Angular styles that use `@apply` need
  `@reference "../styles.css";` at the top — but in this architecture,
  component CSS files stay **empty**, so this should never appear.

## Dynamic values — stop memorizing scales

Spacing is computed from one token (`--spacing: 0.25rem`), so **any** number
works: `mt-17`, `w-29`, `size-13`, `grid-cols-15`. Arbitrary `data-*` variants
need zero config: `data-[status=critical]:bg-red-500/10`.

## The v4.1 → v4.3 arsenal (features most devs haven't touched)

### Visual polish
- **Text shadows** (v4.1): `text-shadow-2xs…lg`, colored `text-shadow-sky-300`, opacity `text-shadow-lg/20`
- **Masks** (v4.1, composable): `mask-b-from-50% mask-radial-from-80%` — hero fades, edge blends, no PNG overlays
- **Colored drop shadows**: `drop-shadow-cyan-500/50` — glow effects for free
- **Scrollbars** (v4.3, first-party): `scrollbar-thin scrollbar-thumb-surface-500/60 scrollbar-track-transparent`, `scrollbar-gutter-stable`
- **Gradients**: angles `bg-linear-45`, interpolation `bg-linear-to-r/oklch`, `bg-conic`, `bg-radial-[at_25%_25%]`
- **3D transforms**: `transform-3d rotate-x-12 translate-z-8 perspective-distant`
- `zoom-*`, `tab-*` (v4.3); `field-sizing-content` (auto-growing textarea); `scheme-dark` (native form controls)

### Layout guards (put these in every enterprise template)
- **Safe alignment** (v4.1): `justify-center-safe`, `items-center-safe` — centered until overflow, then start. Toolbars stop amputating buttons.
- `wrap-anywhere` / `wrap-break-word` (v4.1) — kills the flexbox `min-w-0` truncation hack for long IDs/emails
- `items-baseline-last` — align metadata rows to the last text baseline
- Container queries in core: `@container` + `@sm:`, `@max-md:`, ranges `@min-md:@max-xl:hidden`; v4.3 `@container-size` unlocks `cqb/cqh` units. **Components respond to their container, not the viewport** — the dashboard-widget pattern.

### Input-aware & state variants
- `pointer-coarse:p-4` — bigger touch targets on touch devices (v4.1); `any-pointer-*`
- `user-valid:` / `user-invalid:` (v4.1) — native validation styling only after interaction
- `starting:` → `@starting-style` entry transitions without keyframes: `transition-discrete starting:open:opacity-0`
- `not-*`, `in-*` (group-like without the class), descendant `**:`, `inert:`, `nth-*`, `details-content:`, `noscript:`, `inverted-colors:`
- Stacked `@variant` in CSS (v4.3): `@variant hover:focus { … }`

### Logical properties (v4.2) — RTL-ready by construction
For any app shipping Hebrew/Arabic: `ms-*/me-*`, `ps-*/pe-*`, `mbs-*/mbe-*`,
`inset-s-*/inset-e-*` (note: `start-*`/`end-*` are deprecated), `border-bs/be-*`.
Physical `ml-*`/`pl-*` in a directional layout is a review rejection.

### Typography niceties
`font-features-["tnum"]`, or simply `tabular-nums` for data columns —
mandatory on numeric table cells.

## Performance notes (why there is no excuse for custom CSS)

Oxide engine: full builds ~100ms, incremental ~192µs when no new classes.
Utility-first has zero runtime cost and dead CSS is impossible by construction.

## House rules

1. `styles.css` is the only stylesheet. Component `.css` files stay empty.
2. No `@apply` in app code — it recreates the CSS-maintenance problem.
   Repetition across templates → extract an Angular component, not a CSS class.
3. No arbitrary values when a scale value exists: `w-[247px]` needs a comment
   or a `@theme` token; `top-[117px]` is a bug.
4. Dark mode: every surface/text utility pairs with a `dark:` variant unless it
   uses PrimeNG semantic tokens (which flip automatically — preferred).
5. `!` importance (`p-8!`) — only when beating an unlayered third-party style,
   with a comment. Inside the PrimeNG layer system it's never needed.
6. Breakpoints mobile-first (`md:`, `xl:`); container queries for widgets.
