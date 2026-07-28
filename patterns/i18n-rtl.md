# Pattern: i18n Dictionary + RTL (Zoneless Edition)

**Use when:** any multi-language app — especially EN/HE/AR (RTL involved).
**Angular 22 ingredients:** `httpResource` dictionary, shell-level readiness gate,
Tailwind logical properties.

> This pattern **replaces the Angular 21 "translation guard"** (per-component
> `effect` + `ChangeDetectorRef.markForCheck()`). Zoneless + signals delete
> all of it: one resource, one gate, zero `cdr`.

## The store

```typescript
type Lang = 'en' | 'he' | 'ru';

@Service()
export class I18nStore {
  readonly lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'en');

  private readonly dict = httpResource<Translations>(
    () => `/i18n/${this.lang()}.json`);

  readonly ready = computed(() => this.dict.hasValue());
  readonly t = computed(() => this.dict.value() ?? ({} as Translations));
  readonly dir = computed<'ltr' | 'rtl'>(() => this.lang() === 'he' ? 'rtl' : 'ltr');

  constructor() {
    effect(() => {
      localStorage.setItem('lang', this.lang());
      document.documentElement.lang = this.lang();
      document.documentElement.dir = this.dir();      // PrimeNG reads dir from the DOM
    });
  }

  setLang(l: Lang): void { this.lang.set(l); }
}
```

## The shell gate — the ONLY readiness check in the app

```html
<!-- app.html -->
@if (i18n.ready()) {
  <app-shell />
} @else {
  <span class="flex h-dvh items-center justify-center"><p-progressspinner /></span>
}
```

Every component below the gate reads `i18n.t()` directly — translations are
guaranteed present, keys never flash:

```html
<span>{{ i18n.t().fleet.title }}</span>
<p-button [label]="i18n.t().common.save" />
```

Language switch: `lang` changes → resource refetches → `ready()` flips false →
gate shows spinner → new dictionary renders. Automatic, race-free.

## RTL: logical properties ONLY

Tailwind 4.2+ logical utilities make RTL a non-event — the same class is
correct in both directions:

| ❌ Physical (banned in directional layouts) | ✅ Logical |
|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` |
| `pl-6` / `pr-6` | `ps-6` / `pe-6` |
| `left-0` / `right-0` | `inset-s-0` / `inset-e-0` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` | `border-s` |
| `rounded-l-lg` | `rounded-s-lg` |

```html
<!-- correct in EN and HE without a single rtl: variant -->
<span class="flex items-center gap-3 ps-4 border-s border-surface">
  <span class="text-start font-medium">{{ i18n.t().nav.missions }}</span>
</span>
```

Icons that imply direction (arrows, chevrons) flip with a token:

```html
<svg data-p-icon="chevron-right" class="rtl:-scale-x-100"></svg>
```

## Typed dictionaries (the professional touch)

```typescript
// generated from en.json — compile error on missing keys in code
export interface Translations {
  common: { save: string; cancel: string; retry: string };
  fleet:  { title: string; empty: string };
  nav:    { missions: string; settings: string };
}
```

Keep `en.json` as the schema source; a 10-line script (or `typeof en` import)
generates the interface. Missing keys in other languages are caught by a CI
diff of key sets — not by users.

## Rules

1. One gate at the shell. Zero per-component guards, zero `markForCheck`.
2. `document.dir` set in the store effect — PrimeNG components follow it.
3. Logical Tailwind utilities everywhere; `rtl:` variant only for direction-implying icons.
4. Dictionary files are flat JSON per language, served static, cache-busted by build hash.
