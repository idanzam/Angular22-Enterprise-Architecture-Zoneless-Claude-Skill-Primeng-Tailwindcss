/**
 * Mission Control — fleet telemetry signal store.
 * Demonstrates: @Service(), httpResource with reactive URL + Zod parse,
 * debounced() search, linkedSignal selection, computed derivations,
 * resource({ stream }) for the live-ops page, fetch() mutations.
 */
import { Service, signal, computed, linkedSignal, inject, resource } from '@angular/core';
import { debounced } from '@angular/core'; // experimental in v22
import { httpResource } from '@angular/common/http';
import { z } from 'zod';

import { AuthStore } from '../core/stores/auth-store.service';

const SatelliteSchema = z.object({
  id: z.string(),
  name: z.string(),
  orbit: z.enum(['LEO', 'MEO', 'GEO']),
  status: z.enum(['online', 'degraded', 'maintenance', 'offline']),
  altitudeKm: z.number(),
  fuelPct: z.number(),
  uptimeSec: z.number(),
});
const SatelliteListSchema = z.array(SatelliteSchema);
export type Satellite = z.infer<typeof SatelliteSchema>;

export interface Telemetry {
  satelliteId: string;
  velocityKms: number;
  signalDb: number;
  timestamp: number;
}

@Service() // v22 shorthand for @Injectable({ providedIn: 'root' })
export class TelemetryStore {
  private readonly auth = inject(AuthStore);

  // ── UI state ────────────────────────────────────────────────────────────
  readonly orbitFilter = signal<'all' | Satellite['orbit']>('all');
  readonly query = signal('');
  private readonly debouncedQuery = debounced(this.query, 300);

  // ── Server state — declarative reads ────────────────────────────────────
  /** Refetches when filter/search change; stale requests auto-cancel. */
  readonly fleet = httpResource<Satellite[]>(
    () => {
      const params = new URLSearchParams();
      if (this.orbitFilter() !== 'all') params.set('orbit', this.orbitFilter());
      if (this.debouncedQuery().length >= 2) params.set('q', this.debouncedQuery());
      return `/api/satellites?${params}`;
    },
    { defaultValue: [], parse: SatelliteListSchema.parse },
  );

  // ── Selection — survives refetch, resets when the list changes shape ────
  readonly selectedId = linkedSignal<Satellite[], string | null>({
    source: () => this.fleet.value(),
    computation: (list, previous) =>
      list.some(s => s.id === previous?.value) ? previous!.value : (list[0]?.id ?? null),
  });

  // ── Derived state — computed, never effects ─────────────────────────────
  readonly selected = computed(() =>
    this.fleet.value().find(s => s.id === this.selectedId()) ?? null);
  readonly onlineCount = computed(() =>
    this.fleet.value().filter(s => s.status === 'online').length);
  readonly lowFuel = computed(() =>
    this.fleet.value().filter(s => s.fuelPct < 15));

  // ── Live stream — ONLY consumed by the live-ops page ────────────────────
  readonly liveTelemetry = resource<Telemetry, { id: string | null }>({
    params: () => ({ id: this.selectedId() }),
    stream: async ({ params, abortSignal }) => {
      const out = signal<{ value: Telemetry } | { error: Error }>({
        value: { satelliteId: params.id ?? '', velocityKms: 0, signalDb: 0, timestamp: 0 },
      });
      if (!params.id) return out;
      const ws = new WebSocket(`wss://gs.mission.example/telemetry/${params.id}`);
      ws.onmessage = e => out.set({ value: JSON.parse(e.data) });
      ws.onerror = () => out.set({ error: new Error('telemetry link lost') });
      abortSignal.addEventListener('abort', () => ws.close()); // selection change / destroy
      return out;
    },
  });

  // ── Mutations — imperative fetch, then authoritative reload ─────────────
  async scheduleManeuver(id: string, deltaVKms: number): Promise<boolean> {
    const res = await fetch(`/api/satellites/${id}/maneuvers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.auth.headers() },
      body: JSON.stringify({ deltaVKms }),
    });
    if (res.status === 401 && (await this.auth.tryRefresh())) {
      return this.scheduleManeuver(id, deltaVKms); // retry once after refresh
    }
    if (res.ok) this.fleet.reload();
    return res.ok;
  }

  async decommission(id: string): Promise<boolean> {
    const res = await fetch(`/api/satellites/${id}`, {
      method: 'DELETE',
      headers: this.auth.headers(),
    });
    if (res.ok) {
      // optimistic removal + authoritative reload
      this.fleet.update(list => list?.filter(s => s.id !== id) ?? []);
      this.fleet.reload();
    }
    return res.ok;
  }
}
