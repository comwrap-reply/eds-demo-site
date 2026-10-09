# Global section portability

Initial portability scope: a reusable copy preserving the then-current saved IDs. Package
the custom layout only, with supported child blocks, styles, editor UI/update
helpers, sanitizer, resolved authoring JSON, tests and copy/paste instructions.
No V1/V2/native-columns imports, credentials, App Builder deployment or content
writes. The separate Layouts App Builder extension remains optional.

Validation content: existing `/drafts/global-section` (HTTP 200) and a new
standalone example served with only this folder available. Existing content
contracts remain unchanged; legacy grid/V2 controls are not part of this package.

Acceptance:
- All runtime imports and CSS assets resolve inside this folder.
- Standard AEM decoration/loading is supplied through explicit host callbacks.
- All four supported blocks and their appearance/placement controls are included.
- Editor placeholders follow edit/preview state; queued patches stay reversible.
- Counts 1–4, row grouping, widths, gaps, default settings and clamped assignments
  work at mobile, tablet and desktop sizes.
- Authoring contributions contain unique IDs and no cross-folder JSON includes.
- Node/browser tests pass without the website checkout; site tests still pass.
- Document source ownership, installation steps and unverified live UE behavior.

No commit, push, migration, or deployment is part of this task.

## Initial portability verification — October 9, 2026 (before rename)

- `npm run build:json` and all 8 package Node tests pass. The dependency graph
  check confirms runtime/module/style imports stay inside the package.
- Full original layout regression suite adapted to the packaged renderer and
  editor queue: 354 assertions at 375px, 354 at 768px, 379 at 1280px (1,087 total).
  Includes simulated add, copy, move, patch, reassignment, delete, queued updates,
  edit/preview state, idempotence, saved order and count reduction.
- Independent loopback server serves only this folder; every required asset
  returned 200. No console errors or viewport overflow. Screenshot inspected:
  `output/playwright/global-section-portable.png` in the originating workspace.
- Repository lint, package CSS lint, 15 site layout tests, 15 importer checks and
  the site's JSON regeneration pass. Existing tracked site files are unchanged.
- This proves local rendering and simulated event handling only. Live Universal
  Editor persistence, target-project integration and optional extension deployment
  remain unverified; follow the README before installing into a real project.

## Version-free contract rename — October 9, 2026

The subsequent approved breaking rename uses `global-section`,
`global-section-columns`, `classes_layout*` and `layout-*`. It has no custom V3
compatibility mappings. The separate site implementation now lives in `layout/`;
neither copy imports the other. A site test verifies parity of their saved contract.
Existing AEM content remains untouched and needs recreation or a separate migration
before rollout. README installation instructions describe the current contract.

JSON generation and all 8 package Node tests pass. Updated browser regressions
pass with 357 assertions at 375/768px and 382 at 1280px (1,096 total), including
rejection of obsolete custom layout and placement values. No failed resources
or page errors were observed. These remain local/simulated checks, not live
Universal Editor persistence or registration tests.
