# ⛔ Anti-Pattern: Dead PrimeNG API (Training-Data Muscle Memory)

## The crime

Writing PrimeNG the way it looked in 2023–2025. AI assistants and veteran
fingers both produce it; PrimeNG 22 rejects it.

## The graveyard (REMOVED — build breaks)

```html
<!-- ❌ styleClass — removed v22 -->
<p-card styleClass="shadow-lg">              → <p-card class="shadow-lg">

<!-- ❌ pTemplate — removed v22 -->
<ng-template pTemplate="header">             → <ng-template #header>

<!-- ❌ renamed selectors — aliases removed in v20 -->
<p-dropdown>      → <p-select>
<p-calendar>      → <p-datepicker>
<p-inputswitch>   → <p-toggleswitch>
<p-overlaypanel>  → <p-popover>
<p-sidebar>*      → <p-drawer>   (*old drawer semantics; v22's NEW p-sidebar is an app-shell nav!)
<p-tabview>       → <p-tabs> + p-tablist/p-tab/p-tabpanels
<p-chips>         → <p-inputtags>
<p-messages>      → <p-message>

<!-- ❌ removed props -->
<p-table responsiveLayout="stack">           → scroll is the only built-in mode
<p-button icon="pi pi-check" label="Go">     → content/iconOnly on the pButton DIRECTIVE form
camelCase selectors (p-inputGroup)           → kebab-case only
```

```typescript
// ❌ removed package
import Aura from '@primeng/themes/aura';     → import Aura from '@primeuix/themes/aura';
// ❌ removed config
providePrimeNG({ inputStyle: 'filled' })     → providePrimeNG({ inputVariant: 'filled' })
```

## The deprecation row (v22 → removed v24 — don't start new code)

`p-multiselect` → `p-select [multiple]` · `p-password` → `pInputPassword` ·
`p-galleria`/`p-image` → `p-gallery` · `p-colorpicker` → `p-inputcolor` ·
`p-scrollpanel` → `p-scrollarea` · `p-imagecompare` → `p-compare` ·
`p-panelmenu` → `p-menu toggleable` · `p-chart`/`p-editor` → PrimeUI PRO ·
font-icon `primeicons` CSS → `@primeicons/angular` SVG components.

## Why it's fatal

Half the graveyard **fails loudly** (good). The other half fails subtly:
`class` on a component whose docs still show `styleClass` in old blog posts,
`pTemplate` silently not rendering the slot, the old-vs-new `p-sidebar`
identity swap producing a nav where an overlay was intended. Every subtle
failure costs a debugging session.

## The professional workflow

1. **Never emit PrimeNG from memory.** Query the `primeng` MCP server
   (`get_component`, `get_example`) — its docs snapshot matches the installed version.
2. **Validate what you wrote:** the MCP `validate_usage` tool lints a snippet
   against the real component metadata. Run it on every generated template.
3. Migrating a codebase: run the greps below, fix by the tables above,
   then `ng build` — v22 removals surface as template errors.

## Detection

```bash
grep -rnE "styleClass|pTemplate" src/app --include='*.html'
grep -rnE "<p-(dropdown|calendar|inputswitch|overlaypanel|tabview|chips|messages|multiselect|galleria|colorpicker|scrollpanel)\b" src/app --include='*.html'
grep -rn "@primeng/themes" src --include='*.ts'
```
