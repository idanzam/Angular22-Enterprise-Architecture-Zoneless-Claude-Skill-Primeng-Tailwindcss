# ⛔ Anti-Pattern: Constructor DI & Injectable Boilerplate

## The crime

```typescript
// ❌ 2019 called
@Injectable({ providedIn: 'root' })
export class FleetService {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    @Inject(FLEET_CONFIG) private config: FleetConfig,
  ) {}
}
```

## Why it's fatal (well — why it's legacy)

- Constructor params break under inheritance, minify awkwardly, force
  `@Inject()` for tokens, and can't be used in field initializers — which is
  exactly where signals, resources, and forms live in v22 code:

```typescript
// this NEEDS inject(): field initializers run before any constructor body
private readonly auth = inject(AuthStore);
readonly fleet = httpResource<Sat[]>(() => `/api/satellites`, ...);
```

- v22's `@Service()` decorator formalizes it: it **rejects constructor
  parameters by design**. Adopting it forces the modern style.
- Mixed styles (some constructor, some inject) make refactors error-prone —
  moving a dependency between the two worlds changes initialization order.

## The fix

```typescript
// ✅ v22
@Service()                                   // = @Injectable({ providedIn: 'root' })
export class FleetStore {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly config = inject(FLEET_CONFIG);

  readonly fleet = httpResource<Sat[]>(() => `/api/satellites`);
}
```

Components identical: `inject()` in fields, constructor only for `effect()`
registration (it needs injection context) — or nothing at all.

Heavy optional dependencies get `injectAsync()` (see patterns/lazy-feature.md):

```typescript
private readonly exporter = injectAsync(() => import('./exporter').then(m => m.Exporter));
```

Non-root providers (feature-scoped) keep `@Injectable()` without `providedIn`
and are listed in the route's `providers` — `@Service()` is specifically the
root-singleton shorthand.

## Detection

```bash
# constructor parameter properties = the old style
grep -rnE "constructor\((\s|\n)*(private|public|protected|readonly)" src/app --include='*.ts'
grep -rn "@Inject(" src/app --include='*.ts'
```

The official migration: `ng generate @angular/core:inject` converts
constructor injection codebase-wide.
