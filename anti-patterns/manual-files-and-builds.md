# ⛔ Anti-Pattern: Manual Files & Assistant-Run Builds

Two workflow crimes that quietly rot a codebase — both about **who does what**.

## Crime 1 — hand-created Angular files

```text
❌ Claude (or a dev) writes satellite-card.ts + .html from scratch in the editor
```

Why fatal: hand-made files drift from CLI conventions — missing spec file,
wrong selector prefix, stale schematic defaults, inconsistent naming
(`satellite-card.component.ts` vs v20+ `satellite-card.ts` style). Each drift
is small; a year of them makes tooling (schematics, migrations, `ng update`)
unreliable, because migrations assume CLI-shaped code.

```bash
# ✅ the only way files come into existence
ng g c features/fleet/satellite-card
ng g s features/fleet/fleet-store
ng g g core/guards/auth
ng g d shared/directives/autofocus
```

Then edit the generated files. If the CLI can't run in the environment,
**stop and say so** — a hand-written workaround is worse than a pause.
(Workspace schematics can encode house style so `ng g` output needs zero fixup.)

## Crime 2 — the assistant running builds/deploys

```text
❌ Claude runs ng serve to "check it works", ng build --configuration production,
   docker build, docker cp into a running container, git push --force
```

Why fatal:

- **Verification theater:** "it built" is not "it's correct". The developer's
  running dev-server, browser, and eyes are the real check — an assistant
  self-certifying its own output collapses the review loop.
- **Environment damage:** deploy/copy commands from an assistant context can
  hit live systems; `docker cp` into a container bypasses the entire release
  pipeline and creates unreproducible state.
- Long builds also burn the session; the human runs them in parallel anyway.

The contract:

| Actor | Owns |
|---|---|
| Claude / assistant | generate (CLI), edit, refactor, write tests, run **targeted** unit tests |
| Developer | `ng serve`, builds, e2e, commits/pushes, deploys, container ops |

Targeted tests are the sanctioned exception — `ng test --include='**/fleet-store.spec.ts'`
(Vitest, fast) verifies logic without touching the app lifecycle.

## Detection

Workflow crimes don't grep — they audit:

- PRs adding components with no matching CLI-shaped spec file → crime 1.
- Session logs containing `ng serve`, `ng build`, `docker`, `git push` from
  the assistant → crime 2.
- `CLAUDE.md` in the repo root must state both bans (this repo's does —
  non-negotiables #13–14).
