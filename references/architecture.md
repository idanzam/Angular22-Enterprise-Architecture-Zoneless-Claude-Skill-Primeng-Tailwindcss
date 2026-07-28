# Application Architecture — Structure, Stores, DI

## Folder structure

```text
src/
├── styles.css                    # THE stylesheet (Tailwind + primeui + @theme)
├── app/
│   ├── app.config.ts             # providers: router, PrimeNG preset, interceptors
│   ├── app.routes.ts             # lazy routes, guards
│   ├── app.ts / app.html         # shell: <p-sidebar> nav + <router-outlet>
│   │
│   ├── core/                     # singletons — imported once
│   │   ├── stores/               # @Service() signal stores (auth, theme, i18n)
│   │   ├── api/                  # fetch helpers, auth headers, error mapping
│   │   └── guards/               # functional guards reading store signals
│   │
│   ├── features/                 # one folder per lazy feature
│   │   └── fleet/
│   │       ├── fleet.routes.ts
│   │       ├── fleet-store.service.ts     # feature-scoped signal store
│   │       ├── fleet-page/                # smart component (injects store)
│   │       └── satellite-card/            # dumb component (input/output only)
│   │
│   └── shared/                   # dumb, reusable, store-free
│       ├── components/
│       ├── pipes/
│       └── schemas/              # reusable Signal Forms schemas + Zod schemas
```

Generation is CLI-only:

```bash
ng g c features/fleet/satellite-card
ng g s features/fleet/fleet-store
ng g g core/guards/auth
```

## The Signal Store pattern (v22 edition)

One store per domain. State private-writable, public-readonly. Resources for
reads, async methods for writes:

```typescript
import { Service, signal, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Service()
export class FleetStore {
  private readonly api = inject(ApiClient);

  // ── UI state ──────────────────────────────────────────────
  readonly filter = signal<FleetFilter>({ status: 'all', orbit: 'all' });
  readonly selectedId = signal<string | null>(null);

  // ── Server state (declarative) ────────────────────────────
  readonly fleet = httpResource<Satellite[]>(
    () => `/api/satellites?${toQuery(this.filter())}`,
    { defaultValue: [], parse: SatelliteListSchema.parse },
  );

  // ── Derived ───────────────────────────────────────────────
  readonly selected = computed(() =>
    this.fleet.value().find(s => s.id === this.selectedId()) ?? null);
  readonly onlineCount = computed(() =>
    this.fleet.value().filter(s => s.status === 'online').length);

  // ── Mutations (imperative) ────────────────────────────────
  async rename(id: string, name: string): Promise<boolean> {
    const ok = await this.api.patch(`/api/satellites/${id}`, { name });
    if (ok) this.fleet.reload();
    return ok;
  }
}
```

Rules:
- Components never call `fetch` — stores do.
- Smart components inject stores and pass **signals down** via `input()`;
  dumb components know nothing about stores.
- Cross-store reads are fine (`inject(AuthStore).user()` inside a computed);
  cross-store **writes** go through methods.
- No NgRx / no external state library — signal stores + resources cover it.
  (If a team insists on structure, `@ngrx/signals` signalStore is the only
  acceptable variant — it is RxJS-free.)

## DI in v22

```typescript
@Service()                                   // root service, v22 shorthand
export class MissionLogger { ... }

// component-level
private readonly store = inject(FleetStore); // NEVER constructor parameters
private readonly exporter = injectAsync(() => import('./exporter').then(m => m.Exporter));
```

Functional guards read signals:

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};
```

## Routing

```typescript
export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.routes') },
  {
    path: 'fleet',
    canActivate: [authGuard],
    loadChildren: () => import('./features/fleet/fleet.routes'),
  },
];
```

- Every feature is lazy. `withComponentInputBinding({ queryParams: true })`
  binds route/query params straight into `input()` signals — no ActivatedRoute
  subscriptions ever.
- v22: `paramsInheritanceStrategy` defaults to `'always'` — don't re-declare.
- Active-link state: `isActive('/fleet')` computed signal.

## Auth pattern (JWT, signals, fetch)

```typescript
@Service()
export class AuthStore {
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  async login(creds: Credentials): Promise<boolean> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    if (!res.ok) return false;
    const { access, refresh, user } = await res.json();
    localStorage.setItem('token', access);
    localStorage.setItem('refresh', refresh);
    this.user.set(user);
    return true;
  }

  headers(): HeadersInit {
    return { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` };
  }

  async tryRefresh(): Promise<boolean> { /* single-flight refresh, then retry-once */ }
  logout(): void { localStorage.clear(); this.user.set(null); }
}
```

401 handling lives in ONE place (the api helper / interceptor): refresh once,
retry once, logout. Components never see tokens.

## Realtime policy

| Page type | Transport |
|---|---|
| Public/marketing/dashboard | `httpResource` + `setInterval(() => r.reload(), 5000)` |
| Live-ops console / trading | `resource({ stream })` WebSocket — one connection per page, closed via `abortSignal` |

WebSocket outside its dedicated page = rejected PR.

## Claude working agreement

- Claude generates via CLI, edits code, writes tests. Claude does **not** run
  `ng build` / `ng serve` / deploys — the developer owns execution.
- Uncertain API? Query the MCP servers (`.mcp.json`) — never guess from
  pre-2026 memory.
