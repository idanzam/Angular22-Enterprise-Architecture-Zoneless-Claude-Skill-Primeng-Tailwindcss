# Contributing

This repository is an opinionated architecture system. Contributions are
welcome when they sharpen the opinion — not when they dilute it.

## What's welcome

- **Corrections** — API drift (Angular/PrimeNG/Tailwind move fast), typos,
  broken snippets. Cite the official doc or changelog in the PR description.
- **New patterns** — production-derived, composed from the stack's current
  APIs. A pattern PR must include: *when to use*, *ingredients*, complete
  code, *rules*, and how it interacts with existing patterns.
- **New anti-patterns** — with the four mandatory sections: the crime, why
  it's fatal **in Angular 22 specifically**, the fix, and a detection command.
- **Checklist items** — with a one-line justification each.

## What's not

- RxJS rehabilitation. NgRx (classic). "Both approaches are valid" hedging.
  `::ng-deep` exceptions. The whole point of this repo is that it decides.
- Content targeting Angular ≤21 APIs (that's the
  [Angular 21 edition](https://github.com/idanzam/Angular21-Enterprise-Architecture-Zoneless-Claude-Skill)).
- Generated filler — every file here is meant to be read by humans AND loaded
  into AI context windows; padding costs tokens twice.

## Ground rules for snippets

1. Verify against the current majors (Angular 22.x, PrimeNG 22.x, Tailwind 4.3.x) —
   ideally via the MCP servers in `.mcp.json` (`validate_usage` for PrimeNG).
2. Follow the repo's own laws: signals-only, `[formField]`, span-vs-div,
   semantic token utilities, `inject()`.
3. Experimental APIs (`debounced()`, WebMCP) are marked as such where used.
4. English, concise, code-first. Rules are numbered so reviews can cite them.

## Process

1. Open an issue (pattern proposal / correction) before large PRs.
2. One pattern or anti-pattern per PR.
3. Update the folder `README.md` index table in the same PR.
4. If a change alters a non-negotiable, update `CLAUDE.md`, `SKILL.md`,
   and the root `README.md` together — they must never disagree.
