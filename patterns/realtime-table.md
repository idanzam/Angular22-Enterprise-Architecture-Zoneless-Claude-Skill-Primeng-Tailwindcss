# Pattern: Realtime Data Table (PrimeNG Table + Signals)

**Use when:** live fleets, order books, monitoring grids — tables whose rows update continuously.
**Angular 22 ingredients:** resource (polling or stream), `p-table` with `dataKey`,
virtual scroll for big sets, flash-on-change via `animate.enter`.

## The wiring

```typescript
@Service()
export class OrderBookStore {
  readonly orders = httpResource<Order[]>(() => '/api/orders/open', { defaultValue: [] });

  constructor() { setInterval(() => this.orders.reload(), 3_000); }

  // derived, sorted ONCE here — not in the template, not per render
  readonly sorted = computed(() =>
    [...this.orders.value()].sort((a, b) => b.updatedAt - a.updatedAt));
}
```

```html
<p-table [value]="store.sorted()" dataKey="id"
  [scrollable]="true" scrollHeight="32rem"
  [virtualScroll]="true" [virtualScrollItemSize]="44"
  [pt]="{ bodyRow: 'transition-colors hover:bg-emphasis' }">

  <ng-template #header>
    <tr>
      <th class="text-start">Pair</th>
      <th class="text-end">Price</th>
      <th class="text-end">Amount</th>
      <th>Status</th>
    </tr>
  </ng-template>

  <ng-template #body let-order>
    <tr>
      <td><span class="font-medium">{{ order.pair }}</span></td>
      <td class="text-end">
        <span class="tabular-nums"
          [class.text-green-500]="order.direction === 'up'"
          [class.text-red-500]="order.direction === 'down'">
          {{ order.price }}
        </span>
      </td>
      <td class="text-end"><span class="tabular-nums">{{ order.amount }}</span></td>
      <td>
        <p-tag [value]="order.status"
          [severity]="order.status === 'filled' ? 'success' : 'info'" />
      </td>
    </tr>
  </ng-template>

  <ng-template #emptymessage>
    <tr><td colspan="4">
      <span class="flex flex-col items-center gap-2 p-8 text-muted-color">
        No open orders.
      </span>
    </td></tr>
  </ng-template>
</p-table>
```

## Why it doesn't jank

- `dataKey="id"` → PrimeNG diffs rows by identity; unchanged rows keep their DOM.
- Refresh via `reload()` keeps `value()` populated (`'reloading'` status) —
  the table never blanks between polls.
- Sorting/filtering computed in the store — the template renders, it doesn't compute.
- Virtual scroll (`p-scroller` under the hood) for >100 rows; the row height
  must be fixed (`virtualScrollItemSize`).

## Flash changed cells (the trading-screen touch)

```typescript
// in the store: mark rows whose price changed on the last poll
private prevPrices = new Map<string, number>();
readonly rows = computed(() =>
  this.orders.value().map(o => {
    const prev = this.prevPrices.get(o.id);
    this.prevPrices.set(o.id, o.price);
    return { ...o, changed: prev !== undefined && prev !== o.price };
  }));
```

```html
<td class="text-end">
  @if (order.changed) {
    <span class="tabular-nums" animate.enter="animate-fadein bg-highlight rounded px-1">
      {{ order.price }}
    </span>
  } @else {
    <span class="tabular-nums">{{ order.price }}</span>
  }
</td>
```

## Rules

1. `dataKey` is mandatory on any refreshing table.
2. `tabular-nums` + `text-end` on every numeric column, no exceptions.
3. Derivations (sort/filter/group) live in `computed` in the store.
4. >100 rows → virtual scroll; >1000 rows → server-side pagination/lazy load.
5. Sub-second updates → switch the resource to `stream` (websocket-stream.md),
   template unchanged — that's the payoff of resource-shaped stores.
