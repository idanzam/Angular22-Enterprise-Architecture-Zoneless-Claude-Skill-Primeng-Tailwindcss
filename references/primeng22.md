# PrimeNG 22 — Current API, Renames, Removals, Theming

> PrimeNG 22.0.0 (July 15, 2026) · Angular 22 · `@primeuix/themes` v3 ·
> Docs moved to **primeng.dev** · First release under the PrimeUI dual license.
> When in doubt about any component API: query the `primeng` MCP server
> (`get_component`, `validate_usage`) — do not trust pre-2026 training data.

## Setup — the one true config

```typescript
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';        // NOT @primeng/themes (removed in v22)
import Aura from '@primeuix/themes/aura';

const MissionPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}', 100: '{indigo.100}', 200: '{indigo.200}',
      300: '{indigo.300}', 400: '{indigo.400}', 500: '{indigo.500}',
      600: '{indigo.600}', 700: '{indigo.700}', 800: '{indigo.800}',
      900: '{indigo.900}', 950: '{indigo.950}',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: MissionPreset,
        options: {
          darkModeSelector: '.dark',                       // match Tailwind's @custom-variant
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
      ripple: true,
      // license: 'PRIMEUI-XXXX',   // commercial tier — offline verification, no telemetry
    }),
  ],
};
```

The config service is signal-based: `inject(PrimeNG).ripple.set(false)` at runtime.

## Removed in v22 — instant build breaks if you use training-data habits

| REMOVED | Use instead |
|---|---|
| `styleClass` (host components) | plain `class` — it merges onto the host |
| `pTemplate="header"` | `<ng-template #header>` reference syntax |
| `@primeng/themes` package | `@primeuix/themes` |
| camelCase selectors (`p-inputGroup`) | kebab-case only (`p-inputgroup`) |
| pButton `icon`/`label` props on directive | content inside host; `iconOnly` prop |
| `p-badge` directive (`pBadge`) | `p-overlaybadge` |
| Table `responsiveLayout` | scroll is the only mode |
| `showTransitionOptions` / `hideTransitionOptions` | CSS animations (already no-ops in v21) |
| global `inputStyle` | `inputVariant` |
| `pBind` PT names like `ptInputText` | `pInputTextPT` suffix form |

## Rename map (old selector → current)

| Legacy (banned) | Current |
|---|---|
| `p-calendar` | `p-datepicker` |
| `p-dropdown` | `p-select` |
| `p-inputswitch` | `p-toggleswitch` |
| `p-overlaypanel` | `p-popover` |
| `p-sidebar` | `p-drawer` |
| `p-tabview` / `p-tabmenu` | `p-tabs` (+ TabList/Tab/TabPanels) |
| `p-chips` | `p-inputtags` *(v22 — AutoComplete `multiple` deprecated)* |
| `p-messages` / `p-inlinemessage` | `p-message` |
| `p-steps` | `p-stepper` |

## Deprecated in v22 (removal target v24) — don't start new code with these

| Deprecated | Replacement |
|---|---|
| `p-multiselect` | `p-select [multiple]="true"` |
| `p-panelmenu` | `p-menu` with `toggleable` |
| `p-password` | `pInputPassword` directive / `p-inputpassword` |
| `p-galleria`, `p-image` | **`p-gallery`** (zoom/rotate/flip/download) |
| `p-colorpicker` | **`p-inputcolor`** |
| `p-inputmask` component | `pInputMask` directive |
| `p-scrollpanel` | **`p-scrollarea`** |
| `p-imagecompare` | **`p-compare`** |
| `p-chart`, `p-editor` | PrimeUI PRO components (paid tier) |
| `primeng/icons` | `@primeicons/angular` SVG components |

## New in v22 — components nobody knows yet

- **`p-commandmenu`** — ⌘K command palette with grouped items + keyword search.
- **`p-sidebar`** — brand-new compound app-shell navigation (collapsible icon
  mode, offcanvas, nested variants). NOT the old p-sidebar (that's Drawer).
- **`p-gallery`**, **`p-inputtags`**, **`p-inputpassword`** (strength meter),
  **`p-inputcolor`**, **`p-scrollarea`**, **`p-compare`**.
- **`pBind`** directive — object-driven attribute binding, computed-friendly:
  `[pBind]="{ class: rowClass(), 'data-status': sat().status }"`.
- **`pLabel`** — accessible label component wired to Prime inputs.
- Carousel rebuilt as compound: `p-carousel-content` / `p-carousel-item` / `p-carousel-indicators`.
- **16px base font** (was 14px). If a design system needs 14px, use the
  `-compat` presets (`@primeuix/themes/aura-compat`, maintained until June 2027).
- Icons: every PrimeIcon is a tree-shakeable SVG component —
  `import { Check } from '@primeicons/angular/check'`.

## Templates — `#reference` syntax only

```html
<p-select [options]="pads()" optionLabel="name" [formField]="form.pad">
  <ng-template #selectedItem let-pad>
    <span class="flex items-center gap-2">{{ pad.name }}</span>
  </ng-template>
  <ng-template #item let-pad>
    <span class="flex items-center gap-2">
      <svg data-p-icon="map-marker"></svg>{{ pad.name }} — {{ pad.site }}
    </span>
  </ng-template>
</p-select>
```

## Styling precedence — the v22 customization ladder

Climb this ladder top-down; stop at the first rung that solves it:

1. **Tailwind utility on your own markup** — spacing, layout, typography.
2. **`class` on the PrimeNG host** — margins/positioning of the component itself.
3. **Design tokens in `definePreset`** — global look (colors, radius, paddings).
4. **`[dt]` scoped tokens** — one-off instance skinning. *This replaces `::ng-deep`.*

```html
<p-toggleswitch [formField]="form.armed" [dt]="dangerSwitch" />
```
```typescript
readonly dangerSwitch = {
  colorScheme: {
    light: { root: { checkedBackground: '{red.500}', checkedHoverBackground: '{red.600}' } },
    dark:  { root: { checkedBackground: '{red.400}' } },
  },
};
```

5. **`pt` pass-through** — structural: attributes/classes/listeners on internal elements.

```html
<p-table [value]="rows()" [pt]="{
  header: 'bg-surface-50 dark:bg-surface-900',
  bodyRow: { class: 'hover:bg-emphasis transition-colors' },
  pcPaginator: { root: 'border-t border-surface' }
}" />
```

6. **`::ng-deep` / custom CSS** — **never**. If you reached rung 6, query the
   `primeng` MCP for the token you missed.

Global `pt` presets live in `providePrimeNG({ pt: { ... } })`.
`[pt]` string shorthand = class; `pc*` keys target nested Prime components;
directives use `pInputTextPT`-style inputs.

## Component conventions

```html
<p-button label="Abort" severity="danger" [raised]="true" />   <!-- boolean via binding -->
<p-button label="Hold" variant="outlined" size="small" />
<input pInputText pSize="small" [formField]="form.callSign" /> <!-- pSize on input directives -->
<p-select [options]="opts()" [invalid]="form.pad().invalid() && form.pad().touched()" />
<p-fluid><p-inputnumber [formField]="form.mass" /></p-fluid>   <!-- fluid wrapper, .p-fluid class is dead -->
```

- Forms integrate natively with Signal Forms via `[formField]` + `invalid` input.
- `p-fluid` component or per-component `fluid` prop — never a CSS width hack.
- CSP environments: `providePrimeNG({ csp: { nonce } })` (styled mode injects runtime styles).
- Overlays: default `overlayAppendTo: 'self'`; set `'body'` globally if layouts clip menus.
