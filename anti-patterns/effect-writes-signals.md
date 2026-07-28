# ⛔ Anti-Pattern: Effects That Write Signals

## The crime

Using `effect()` to derive state — an effect whose body calls `.set()` /
`.update()` on another signal.

```typescript
// ❌ effect-as-computed
effect(() => {
  this.filtered.set(this.items().filter(i => i.active));
});

// ❌ effect-as-sync
effect(() => {
  if (this.user()) this.displayName.set(this.user()!.name.toUpperCase());
});
```

## Why it's fatal

- **Glitch frames:** the derived signal lags one change-detection pass behind
  its source — templates briefly render inconsistent state.
- **Ordering fragility:** two such effects reading each other's outputs form
  timing-dependent behavior; three form a puzzle.
- **Loop risk:** writing a signal an effect (transitively) reads throws
  `NG0600` at best, spins at worst.
- Angular's own docs list "propagating state changes" as the canonical effect misuse.

## The fixes, by intent

| You wanted | Use |
|---|---|
| Pure derivation | `computed(() => ...)` |
| Derivation the user can override | `linkedSignal({ source, computation })` |
| Writable view into parent state | `linkedSignal(source, { set })` (v22.1) |
| React to data arriving | you don't — resources + computed chains make "arrival" invisible |
| Debounced mirror | `debounced(sig, ms)` |

```typescript
// ✅
readonly filtered = computed(() => this.items().filter(i => i.active));
readonly displayName = computed(() => this.user()?.name.toUpperCase() ?? '');
readonly selectedPad = linkedSignal({ source: this.mission, computation: m => m().defaultPad });
```

## What effects are FOR (the complete legitimate list)

```typescript
effect(() => { document.title = `${this.page()} · Mission Control`; });   // DOM outside Angular
effect(() => { localStorage.setItem('scheme', this.scheme()); });          // storage
effect(() => { analytics.track('filter_changed', this.filter()); });       // telemetry
effect(() => { this.chartLib.setData(this.rows()); });                     // imperative 3rd-party API
```

If the body has no external-world side effect, the effect shouldn't exist.

## Detection

```bash
# effects containing signal writes — every hit is a review flag
grep -rn -A 6 "effect(" src/app --include='*.ts' | grep -E "\.set\(|\.update\("
```
