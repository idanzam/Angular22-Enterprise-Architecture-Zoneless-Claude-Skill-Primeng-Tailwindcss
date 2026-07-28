# Pattern: Theme Switching (Dark Mode + Runtime Presets)

**Use when:** every app. Dark mode is table stakes; runtime brand switching is the bonus.
**Angular 22 ingredients:** signal store + PrimeNG `darkModeSelector` +
Tailwind `@custom-variant dark` + `usePreset`/`updatePrimaryPalette`.

## One class flips everything

Configured correctly (see references/primeng-tailwind-integration.md), a single
`.dark` on `<html>` switches: PrimeNG component themes, Tailwind `dark:`
variants, and all `tailwindcss-primeui` semantic utilities.

```typescript
type Scheme = 'light' | 'dark' | 'system';

@Service()
export class ThemeStore {
  readonly scheme = signal<Scheme>((localStorage.getItem('scheme') as Scheme) ?? 'system');
  private readonly systemDark = signal(matchMedia('(prefers-color-scheme: dark)').matches);

  readonly isDark = computed(() =>
    this.scheme() === 'system' ? this.systemDark() : this.scheme() === 'dark');

  constructor() {
    matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => this.systemDark.set(e.matches));

    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
      localStorage.setItem('scheme', this.scheme());
    });
  }
}
```

## No-FOUC bootstrap (index.html, before any bundle)

```html
<script>
  const s = localStorage.getItem('scheme');
  if (s === 'dark' || (s !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

## The toggle UI

```html
<p-selectbutton [options]="[
    { label: 'Light', value: 'light', icon: 'pi pi-sun' },
    { label: 'System', value: 'system', icon: 'pi pi-desktop' },
    { label: 'Dark', value: 'dark', icon: 'pi pi-moon' }
  ]"
  [ngModel]="theme.scheme()" (onChange)="theme.scheme.set($event.value)"
  optionLabel="label" optionValue="value" size="small" />
```

## Runtime brand switching (multi-tenant / white-label)

```typescript
import { usePreset, updatePrimaryPalette, updateSurfacePalette } from '@primeuix/themes';

@Service()
export class BrandStore {
  applyTenant(brand: TenantBrand): void {
    // swap the whole preset…
    usePreset(brand.preset);
    // …or just retint the running one
    updatePrimaryPalette({
      50: brand.primary50, /* … */ 500: brand.primary500, /* … */ 950: brand.primary950,
    });
  }
}
```

Because every Tailwind semantic utility (`bg-primary`, `text-muted-color`) and
every PrimeNG component reads live `--p-*` variables, the entire UI re-brands
with **zero component changes**.

## Writing theme-proof templates

```html
<!-- ✅ adapts to light/dark/brand automatically -->
<span class="bg-surface-0 dark:bg-surface-900 text-color border-surface rounded-border">
<!-- ✅ even better — fully semantic, zero dark: needed -->
<span class="bg-emphasis text-muted-color rounded-border">

<!-- ❌ frozen — ignores theme AND dark mode -->
<span class="bg-white text-gray-700 border-gray-200 rounded-lg">
```

## Rules

1. `.dark` selector must match in THREE places: `darkModeSelector`,
   `@custom-variant dark`, and the FOUC script.
2. `system` is the default scheme — respect the OS.
3. Prefer semantic utilities over `dark:` pairs; prefer `dark:` pairs over frozen palette classes.
4. Per-instance skins use `[dt]` with `colorScheme.light/dark` branches —
   never conditional class soup.
