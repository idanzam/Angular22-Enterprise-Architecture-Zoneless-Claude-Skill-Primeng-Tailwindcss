# Generator Template: Complete Lazy Feature

The commands, in order, for a new feature `missions`:

```bash
ng g c features/missions/missions-page          # smart page
ng g s features/missions/missions-store         # signal store
ng g c features/missions/components/mission-card    # dumb child(ren)
# routes + model files are the two hand-written exceptions (no schematic):
```

## `features/missions/missions.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { MissionsPage } from './missions-page/missions-page';

export default [
  { path: '', component: MissionsPage },
  {
    path: ':missionId',
    loadComponent: () =>
      import('./mission-detail/mission-detail').then(m => m.MissionDetail),
  },
] satisfies Routes;
```

## `features/missions/mission.model.ts`

```typescript
import { z } from 'zod';

export const MissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['planned', 'active', 'complete', 'aborted']),
  windowStart: z.string().transform(s => new Date(s)),
});
export const MissionListSchema = z.array(MissionSchema);
export type Mission = z.infer<typeof MissionSchema>;

export type MissionDraft = Pick<Mission, 'name'> & { windowStart: Date };
```

## Register in `app.routes.ts`

```typescript
{
  path: 'missions',
  canActivate: [authGuard],
  loadChildren: () => import('./features/missions/missions.routes'),
},
```

## Resulting structure

```text
features/missions/
├── missions.routes.ts            # default-export Routes
├── mission.model.ts              # Zod schema + types (single source of truth)
├── missions-store.service.ts     # from store.template.md
├── missions-page/                # smart — injects the store
│   ├── missions-page.ts / .html / .css(empty) / .spec.ts
├── mission-detail/               # smart, lazy via loadComponent
└── components/
    └── mission-card/             # dumb — input/output only
```

## Wiring checklist

- [ ] Feature reachable only through the lazy route — nothing imports across
      feature boundaries (shared code goes to `shared/`)
- [ ] Route params consumed as `input()` signals in detail components
- [ ] Store registered nowhere — `@Service()` is root-provided; feature-scoped
      alternatives use route `providers: [MissionsStore]` + plain `@Injectable()`
- [ ] Model file is the ONLY place the API shape is declared (Zod → types)
- [ ] Add the feature's commands to the CommandStore registry (⌘K palette)
- [ ] Add nav item to the shell `p-sidebar`
