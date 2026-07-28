# Pattern: App Shell with the New PrimeNG 22 Sidebar

**Use when:** every enterprise app shell (nav + topbar + content).
**Angular 22 ingredients:** the **new compound `p-sidebar`** (PrimeNG 22 —
NOT the old drawer!), collapsible icon mode, router integration via `isActive()`.

> Naming history matters here: pre-v18 `p-sidebar` became `p-drawer` (offcanvas
> overlay). PrimeNG 22 introduced a **brand-new `p-sidebar`** — a compound
> app-shell navigation component. Old tutorials mixing these up produce broken code.

## The shell

```typescript
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink /* + Sidebar suite, Button, Avatar */],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly theme = inject(ThemeStore);
  protected readonly auth = inject(AuthStore);
  protected readonly collapsed = signal(false);

  // v22 router: computed signal per section — no routerLinkActive juggling
  protected readonly router = inject(Router);
  protected readonly fleetActive = this.router.isActive('/fleet');
  protected readonly missionsActive = this.router.isActive('/missions');
}
```

```html
<span class="flex h-dvh bg-surface-50 dark:bg-surface-950">

  <p-sidebar [collapsed]="collapsed()" class="border-e border-surface">
    <p-sidebar-header>
      <span class="flex items-center gap-2 p-3">
        <svg data-p-icon="globe" class="text-primary"></svg>
        @if (!collapsed()) {
          <span class="font-display font-semibold">Mission Control</span>
        }
      </span>
    </p-sidebar-header>

    <p-sidebar-content>
      <p-sidebar-menu>
        <p-sidebar-item routerLink="/fleet" [active]="fleetActive()"
          icon="pi pi-send" label="Fleet" />
        <p-sidebar-item routerLink="/missions" [active]="missionsActive()"
          icon="pi pi-flag" label="Missions" />
        <p-sidebar-item routerLink="/stations" icon="pi pi-wifi" label="Ground stations" />
      </p-sidebar-menu>
    </p-sidebar-content>

    <p-sidebar-footer>
      <span class="flex items-center justify-between p-3">
        <p-avatar [label]="auth.user()?.initials" shape="circle" />
        <p-button icon="pi pi-angle-double-left" variant="text" severity="secondary"
          (onClick)="collapsed.set(!collapsed())"
          [class.rotate-180]="collapsed()" class="transition-transform" />
      </span>
    </p-sidebar-footer>
  </p-sidebar>

  <span class="flex min-w-0 flex-1 flex-col">
    <header class="flex items-center justify-between border-b border-surface
                   bg-surface-0 px-6 py-3 dark:bg-surface-900">
      <app-breadcrumbs />
      <span class="flex items-center gap-2">
        <p-button icon="pi pi-search" variant="text" severity="secondary"
          (onClick)="commandPalette.open()" />   <!-- see command-palette.md -->
        <app-theme-toggle />
      </span>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto p-6
                 scrollbar-thin scrollbar-thumb-surface-400/50 scrollbar-track-transparent">
      <router-outlet />
    </main>
  </span>
</span>
```

## Responsive strategy

- **≥lg:** persistent `p-sidebar`, collapsible to icon rail (`collapsed` signal).
- **<lg:** hide the sidebar (`hidden lg:flex`) and render the same
  `p-sidebar-menu` inside a `p-drawer` triggered from the topbar — one menu
  definition, two containers.

```html
<p-drawer [visible]="mobileNavOpen()" (visibleChange)="mobileNavOpen.set($event)">
  <app-nav-menu (navigated)="mobileNavOpen.set(false)" />
</p-drawer>
```

## Rules

1. Shell scaffolding (the outer flex frame) is your markup — spans/semantic
   tags + Tailwind. Widgets (sidebar, avatar, buttons) are PrimeNG.
2. `min-w-0` on the content column — without it, wide tables blow the layout.
3. `h-dvh` (not `h-screen`) — correct on mobile browser chrome.
4. Active state from `router.isActive()` computed signals.
5. Collapse state persists: `effect(() => localStorage.setItem('nav', String(this.collapsed())))`.
