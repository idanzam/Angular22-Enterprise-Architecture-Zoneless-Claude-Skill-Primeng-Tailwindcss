# ⛔ Anti-Pattern: Zone Resurrection

## The crime

Reintroducing zone-era machinery into a zoneless Angular 22 app — any of:

```typescript
import 'zone.js';                                  // ❌ the corpse itself
provideZoneChangeDetection()                       // ❌ opt-out of the future
changeDetection: ChangeDetectionStrategy.Eager     // ❌ legacy always-check
private cdr = inject(ChangeDetectorRef);           // ❌ manual CD
this.cdr.markForCheck(); this.cdr.detectChanges();
private zone = inject(NgZone);                     // ❌ there is no zone
setTimeout(() => {}, 0);                           // ❌ "trigger CD" superstition
```

## Why it's fatal

Every one of these is a confession: *some state here is not a signal.*
The machinery doesn't fix that — it papers over it per-call-site, forever.
Worse, in a v22 app `setTimeout(0)` doesn't even trigger change detection
anymore, so the superstition versions are dead code that reviewers must
still reason about.

`ChangeDetectionStrategy.Eager` deserves special contempt: it re-enables
check-everything-always for one component, silently taxing the whole tree,
and marks the file as unmigrated legacy.

## The fix is always the same

Find the non-signal state and convert it:

```typescript
// ❌ the disease that "needed" markForCheck
export class TelemetryPanel {
  rows: Telemetry[] = [];
  private cdr = inject(ChangeDetectorRef);
  onMessage(t: Telemetry) { this.rows.push(t); this.cdr.markForCheck(); }
}

// ✅ the cure — signal write IS change detection
export class TelemetryPanel {
  readonly rows = signal<Telemetry[]>([]);
  onMessage(t: Telemetry) { this.rows.update(r => [...r, t]); }
}
```

For DOM-timing needs that setTimeout used to fake:

```typescript
afterNextRender(() => this.chart.resize());        // once, after next render
afterRenderEffect(() => this.gauge.set(this.pct())); // reactive, post-render
```

## Migration honesty

Migrated legacy components may carry `Eager` temporarily (the v22 migration
stamps it to preserve behavior). That's a TODO marker, not a pattern — each
one gets a ticket, and the MCP tool `onpush_zoneless_migration` produces the
per-component fix plan.

## Detection

```bash
grep -rnE "zone\.js|NgZone|ChangeDetectorRef|markForCheck|detectChanges\(|Eager" \
  src/app --include='*.ts'
grep -rn "provideZoneChangeDetection" src
# target: zero hits. Each hit = one unconverted piece of state.
```
