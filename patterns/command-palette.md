# Pattern: Global Command Palette (⌘K) with p-commandmenu

**Use when:** any app with more than ~5 destinations or frequent power-user actions.
**Angular 22 ingredients:** **`p-commandmenu`** (new in PrimeNG 22), a command
registry store, global hotkey via host listener.

This is the feature that makes an app feel 2026. PrimeNG 22 ships it
first-party — no custom dialog + listbox contraption.

## Command registry store

```typescript
export interface AppCommand {
  label: string;
  icon?: string;
  keywords?: string;                 // extra search terms
  run: () => void;
}

@Service()
export class CommandStore {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeStore);
  private readonly fleet = inject(FleetStore);

  readonly open = signal(false);

  // static commands + dynamic ones derived from data — all computed
  readonly groups = computed(() => [
    {
      label: 'Navigate',
      items: [
        { label: 'Fleet',    icon: 'pi pi-send', keywords: 'satellites list', run: () => this.go('/fleet') },
        { label: 'Missions', icon: 'pi pi-flag', run: () => this.go('/missions') },
        { label: 'Settings', icon: 'pi pi-cog',  run: () => this.go('/settings') },
      ],
    },
    {
      label: 'Actions',
      items: [
        { label: 'Schedule launch', icon: 'pi pi-calendar-plus', run: () => this.go('/launch') },
        { label: 'Toggle dark mode', icon: 'pi pi-moon',
          run: () => this.theme.scheme.set(this.theme.isDark() ? 'light' : 'dark') },
      ],
    },
    {
      label: 'Satellites',                       // dynamic — follows live data
      items: this.fleet.fleet.value().slice(0, 8).map(s => ({
        label: s.name, icon: 'pi pi-circle-fill', keywords: s.orbit,
        run: () => this.go(`/fleet/${s.id}`),
      })),
    },
  ]);

  private go(url: string): void { this.open.set(false); this.router.navigateByUrl(url); }
}
```

## Wiring — hotkey on the shell, menu in the shell template

```typescript
@Component({
  selector: 'app-shell',
  host: { '(document:keydown.meta.k)': 'palette.open.set(true)',
          '(document:keydown.control.k)': 'palette.open.set(true)' },
})
export class Shell {
  protected readonly palette = inject(CommandStore);
}
```

```html
<p-commandmenu [visible]="palette.open()" (visibleChange)="palette.open.set($event)"
  [model]="paletteModel()" placeholder="Type a command or search…">
  <ng-template #emptyMessage>
    <span class="flex flex-col items-center gap-1 p-6 text-muted-color">
      <span>No results.</span>
      <span>Try “launch”, “dark”, or a satellite name.</span>
    </span>
  </ng-template>
</p-commandmenu>
```

```typescript
// adapt registry → PrimeNG MenuItem[] groups
protected readonly paletteModel = computed(() =>
  this.palette.groups().map(g => ({
    label: g.label,
    items: g.items.map(c => ({
      label: c.label, icon: c.icon, keywords: c.keywords, command: () => c.run(),
    })),
  })));
```

## Rules

1. Commands are **data in a store**, not template markup — features register
   their own commands by contributing to the registry.
2. Dynamic groups derive from live resources via `computed` — the palette
   always reflects current data with zero refresh logic.
3. `keywords` on every item — users type "sats", not your official label.
4. Every `run()` closes the palette first (the `go()` helper does it once).
5. Discoverability: show the shortcut in the topbar search button tooltip
   (`⌘K` / `Ctrl K` by platform).
