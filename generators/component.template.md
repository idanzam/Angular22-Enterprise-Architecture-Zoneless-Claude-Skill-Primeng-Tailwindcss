# Generator Template: Component (Smart & Dumb)

**Command first:**
`ng g c features/{feature}/{name}` (smart page) ·
`ng g c features/{feature}/components/{name}` (dumb child)

Note what the templates DON'T contain: no `standalone: true`, no
`changeDetection: OnPush`, no constructor DI — all v22 defaults/conventions.

## Dumb component (input/output only — the default)

```typescript
import { Component, input, output, computed } from '@angular/core';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-entity-card',
  imports: [Tag],
  templateUrl: './entity-card.html',
  styleUrl: './entity-card.css',      // stays EMPTY
})
export class EntityCard {
  readonly entity = input.required<Entity>();
  readonly compact = input(false);
  readonly open = output<string>();

  protected readonly statusSeverity = computed(() =>
    this.entity().status === 'active' ? 'success' : 'danger');
}
```

```html
<p-card class="@container" (click)="open.emit(entity().id)"
  animate.enter="animate-fade-in-scale">
  <span class="flex items-center justify-between gap-3">
    <span class="flex min-w-0 flex-col">
      <span class="truncate font-medium text-color">{{ entity().name }}</span>
      @if (!compact()) {
        <span class="text-muted-color">{{ entity().description }}</span>
      }
    </span>
    <p-tag [value]="entity().status" [severity]="statusSeverity()" />
  </span>
</p-card>
```

## Smart component (injects stores, composes dumb children)

```typescript
import { Component, inject, input } from '@angular/core';

@Component({
  selector: 'app-entity-page',
  imports: [EntityCard /* + PrimeNG */],
  templateUrl: './entity-page.html',
})
export class EntityPage {
  // route/query params arrive as inputs (withComponentInputBinding)
  readonly view = input<'grid' | 'table'>('grid');

  protected readonly store = inject(EntityStore);
}
```

```html
@if (store.entities.isLoading()) {
  <p-skeleton height="16rem" />
} @else if (store.entities.error()) {
  <p-message severity="error">
    <span class="flex items-center gap-3">
      Failed to load.
      <p-button label="Retry" size="small" variant="text" (onClick)="store.entities.reload()" />
    </span>
  </p-message>
} @else {
  <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    @for (e of store.entities.value(); track e.id) {
      <app-entity-card [entity]="e" (open)="store.selectedId.set($event)" />
    } @empty {
      <span class="col-span-full flex flex-col items-center gap-2 p-10 text-muted-color">
        Nothing here yet.
      </span>
    }
  </section>
}
```

Checklist:

- [ ] Dumb components: zero `inject()` of stores; all data via `input()`
- [ ] `input.required` for mandatory data; `model()` only for true two-way
- [ ] Host bindings for state classes: `host: { '[class.x]': 'sig()' }`
- [ ] `.css` file empty; span-vs-div law inside PrimeNG slots
- [ ] All three resource states in smart templates
