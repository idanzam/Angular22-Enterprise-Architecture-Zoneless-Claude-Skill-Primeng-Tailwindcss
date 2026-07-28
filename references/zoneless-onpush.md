# Zoneless + OnPush — The v22 Change-Detection Contract

## State of the world

- **Zoneless is the default since v21.** New apps have no `zone.js` in
  `package.json`, no polyfill entry, and no `provideZonelessChangeDetection()`
  call (it's implicit).
- **OnPush is the default since v22.** Components without an explicit
  `changeDetection` are OnPush. The legacy always-check strategy was renamed
  `ChangeDetectionStrategy.Eager` and exists only for migrated code.

Together: the UI updates **only** when a signal read by the template changes,
an input changes, or a template event fires. Nothing else triggers rendering.

## What this means in practice

### Change detection happens when signals change — period

```typescript
// ✅ updates the view — signal set
this.count.update(c => c + 1);

// ❌ INVISIBLE to zoneless Angular — plain field mutation
this.count = this.count + 1;              // template never re-renders
this.items.push(item);                    // template never re-renders (same ref)
```

Every piece of template-bound state must be a `signal`, `computed`,
`linkedSignal`, `input()`, or a resource's `value()`.

### Banned crutches

```text
BANNED: ChangeDetectorRef (markForCheck / detectChanges)  — signals make it obsolete
BANNED: NgZone (run / runOutsideAngular)                  — there is no zone
BANNED: ApplicationRef.tick() manual calls
BANNED: ChangeDetectionStrategy.Eager                     — legacy escape hatch
BANNED: setTimeout(() => ...) used to "trigger CD"        — it no longer does
```

If you feel you need `markForCheck()`, the actual bug is a non-signal state
mutation. Convert the state to a signal.

### Timers and callbacks are safe — if they set signals

Zoneless removed the "setTimeout triggers global CD" magic. That's a feature:

```typescript
// ✅ polling — works perfectly zoneless because the callback sets a signal
setInterval(() => this.refresh(), 5_000);

async refresh(): Promise<void> {
  const data = await fetch('/api/ground-stations').then(r => r.json());
  this.stations.set(data);                // ← signal write = precise re-render
}
```

### DOM timing

Never reach for `setTimeout(0)` to wait for rendering:

- `afterNextRender(() => ...)` — once, after the next render (charts, focus, measure)
- `afterRenderEffect(() => ...)` — reactive, after renders when tracked signals change
- `afterEveryRender(() => ...)` — rare; measuring layouts

### SSR / hydration

Zoneless + signals is what makes v22's default **incremental hydration** work:
`@defer (hydrate on viewport)` blocks hydrate independently. Don't opt out
(`withNoIncrementalHydration()`) without a written reason.

## Testing zoneless (Vitest is the v22 default runner)

```typescript
it('renders telemetry', async () => {
  const fixture = TestBed.createComponent(TelemetryPanel);
  await fixture.whenStable();             // ✅ NOT fixture.detectChanges() loops
  expect(fixture.nativeElement.textContent).toContain('LEO-7');
});
```

- `await fixture.whenStable()` replaces `detectChanges()` choreography.
- `fakeAsync` under Vitest needs the `zone.js/plugins/vitest-patch` polyfill —
  only in tests, never in the app bundle.
- `TestBed.getLastFixture()` (v22) grabs the fixture in helpers.

## Migration corner (for older code entering this repo)

1. Delete `zone.js` from `package.json` and `polyfills`.
2. Delete `provideZoneChangeDetection()` / `provideZonelessChangeDetection()`.
3. Remove every `changeDetection:` line (OnPush is default) — and every
   `ChangeDetectorRef`, replacing mutated fields with signals.
4. Run the MCP tool `onpush_zoneless_migration` (angular-cli server) to get a
   per-component readiness analysis before touching complex components.
