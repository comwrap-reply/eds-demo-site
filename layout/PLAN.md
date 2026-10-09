# Global section naming refactor

Implement the approved breaking rename locally in the site, the separate portable
package and the sibling extension. No CMS writes, migration, aliases, deployment,
commit or push. Native V3, V1, V2 and Freeform retain their contracts and behavior.

## Contract

- Custom model/filter/definition: `global-section`; layout: `global-section-columns`.
- Placement: `classes_layoutcolumn`, `classes_layoutwidth`, `classes_layoutalign`,
  `classes_layoutrow`, with `layout-*` values; authoring group/tab: Layouts/Layout.
- Custom namespace `.global-section`, active `.layout-columns`, presentation
  `layout-*`, `data-layout-*` and `--layout-*`; styles scoped to Global section.
- Extension registration `comwrap.eds.layouts`, package `eds-layout-extension`.
- Site implementation in `layout/`; standalone copy stays in `global-section/`.

## Work and acceptance

- [x] Inspect source contracts, fixtures and working trees; preserve prior changes.
- [x] Confirm plan and existing content model; only names change, not structures.
- [x] Rename custom runtime, authoring and editor helpers; isolate native helpers.
- [x] Rename the portable package and extension; sync the new contract.
- [x] Regenerate JSON; validate contract parity and rejection of obsolete names.
- [x] Run lint, Node tests and builds across all three targets.
- [x] Browser checks on mobile/tablet/desktop, including native/V1/V2 regressions.
- [x] Final diff/namespace/asset review and local handoff.

## Test content

Existing custom fixture `drafts/layout-v3-custom.plain.html` becomes
`drafts/global-section.plain.html`. Native fixture remains `drafts/layout-v3-native`.
Use the package's isolated `example/` and the extension's renamed
`drafts/layout-panel` SDK simulation. No live CMS content is used or updated.

All previous custom identifiers must be absent from active custom code, except
explicit rejection tests and breaking-change documentation. No forwarding files.
Existing content needs recreation or a separately approved migration before rollout.

## Local results — October 9, 2026

- Site JSON generation and lint pass; 16 layout/model Node tests and 15 importer
  checks pass. Portable JSON generation and all 8 standalone Node tests pass.
- Extension contract sync/check, lint, bundle build and all 58 Node tests pass.
- Site and portable browser suites each pass 357/357/382 assertions at
  375/768/1280px, including old-name rejection. Native V3 passes 141 assertions at
  each width; V2 passes 354/354/379. Simulated editor transitions and updates pass.
- All eight extension browser suites pass at 320/768/1200px (1,014 assertions),
  covering selection, add/delete/reassign/reorder, dialogs, collapse and refresh.
- Six existing V1 drafts pass loading, overflow and namespace-isolation smoke
  checks at 375/768/1280px. The missing Column Break case emits its expected
  fallback warning. The footer draft is a rendering smoke check, not live footer
  verification.
- No new page/console errors or failed resources in the regression runs.
  Desktop site/portable and mobile extension screenshots were inspected in
  ignored `output/playwright/global-section-renamed-*.png`.
- Non-custom definitions, models and filters were compared to HEAD; block
  appearance/content fields are unchanged. Native renderer/models, V1/V2,
  Freeform and `scripts/aem.js` are unmodified. Remaining V3 references are native,
  explicit rejection tests, or historical/breaking-change documentation.
- No commits, pushes, Stage deployment, live AEM writes or content migration.
  Live extension registration, permission handling and persistence still require
  subsequent verification against the new contract.
