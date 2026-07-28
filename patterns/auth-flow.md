# Pattern: Auth Flow (JWT + Signals + Single-Flight Refresh)

**Use when:** every app with login.
**Angular 22 ingredients:** signal store, `fetch()`, functional guards, Signal Forms login.

## The store

```typescript
@Service()
export class AuthStore {
  private readonly router = inject(Router);

  readonly user = signal<User | null>(restoreUser());       // hydrate from storage once
  readonly isLoggedIn = computed(() => this.user() !== null);

  // single-flight: concurrent 401s share ONE refresh request
  private refreshInFlight: Promise<boolean> | null = null;

  async login(creds: { username: string; password: string }): Promise<boolean> {
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

  tryRefresh(): Promise<boolean> {
    // all concurrent callers await the same promise
    this.refreshInFlight ??= this.doRefresh().finally(() => (this.refreshInFlight = null));
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<boolean> {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) return false;
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) { this.logout(); return false; }
    const { access } = await res.json();
    localStorage.setItem('token', access);
    return true;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
```

## 401 handling in ONE place

For `httpResource` reads, use an interceptor (httpResource rides HttpClient's
fetch backend, so interceptors apply):

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const authed = req.clone({ setHeaders: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } });
  return next(authed);   // note: interceptors are the ONE sanctioned Observable boundary
};
```

For raw `fetch()` mutations, wrap once:

```typescript
// core/api/api-fetch.ts
export async function apiFetch(input: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const auth = inject(AuthStore);
  const res = await fetch(input, { ...init, headers: { ...init.headers, ...auth.headers() } });
  if (res.status === 401 && !retried && await auth.tryRefresh()) {
    return apiFetch(input, init, true);          // retry exactly once
  }
  if (res.status === 401) auth.logout();
  return res;
}
```

## Guard + inactivity logout

```typescript
export const authGuard: CanActivateFn = () =>
  inject(AuthStore).isLoggedIn() || inject(Router).createUrlTree(['/login']);
```

```typescript
@Service()
export class InactivityStore {
  private readonly auth = inject(AuthStore);
  private readonly lastActivity = signal(Date.now());

  constructor() {
    for (const ev of ['click', 'keydown', 'mousemove', 'touchstart'] as const) {
      document.addEventListener(ev, () => this.lastActivity.set(Date.now()), { passive: true });
    }
    setInterval(() => {
      if (this.auth.isLoggedIn() && Date.now() - this.lastActivity() > 15 * 60_000) {
        this.auth.logout();
      }
    }, 30_000);
  }
}
```

## Rules

1. Tokens never appear outside `AuthStore` + the two wrappers. Components see signals.
2. Refresh is single-flight — the `??=` line prevents refresh storms.
3. Retry-after-refresh happens exactly once, then logout.
4. `user` hydrates synchronously at construction so guards work on cold load.
5. Login page uses Signal Forms like any other form — no special casing.
