# Restore the saved custom-section contract — October 13, 2026

The residential author page returns HTTP 200, but both saved custom sections still
use `section-custom-v3`, `columns-v3` and `layout-v3-*` placement. The deployed
Stage extension likewise uses these names and `comwrap.eds.layouts-v3`. The
`new-demo` branch's October 9 rename removed them, so its models and renderer no
longer match the content. One image on the page already has renamed placement.

## Scope / acceptance

- Restore original saved names across site, portable authoring and extension
  contract; retain Global section / Layouts / Layout labels and current folders.
- Preserve the deployed extension registration ID. No Stage deployment needed
  for the existing page's original contract.
- Render original placement values with per-field fallback to renamed values
  when original values are absent. Original values win conflicts; malformed
  original values use defaults, not stale renamed values. No DOM/CMS writeback.
- Keep V1, V2, Native V3 and Freeform unchanged.
- Test existing fixtures and a mixed-contract regression corresponding to the
  authenticated page's 4-column/2-column sections, including shared half widths.
- Run JSON generation, contract sync, lint, Node tests and responsive browser
  checks. Test actual author markup with local assets without saving any changes.
- After successful local tests, commit and push the site repair to `new-demo`
  (explicitly authorized October 13). Do not deploy the extension or migrate AEM content.

## Checklist

- [x] Inspect read-only author response, branch JSON, and deployed Stage assets.
- [x] Start local AEM server; existing `/drafts/global-section` covers rendering.
- [x] Reuse the original content contract; no new content model is designed.
- [x] Restore saved contract and add mixed-value fallback.
- [x] Regenerate artifacts, verify tests and actual content rendering locally.
- [x] Document rollout and unverified live behavior.
- [ ] Commit/push site repair and verify preview delivery.

## Verification — October 13, 2026

- Site and portable JSON generation, site lint, 17 layout/model Node tests,
  15 importer checks and 9 portable Node tests pass.
- Extension contract sync/check, lint, build and all 58 Node tests pass. Eight
  extension browser suites pass at 320/768/1200px (1,014 assertions), with mock
  add/delete/reassign/reorder/selection, dialogs, collapse, refresh and error handling.
- Site and portable renderer browser suites each pass 361/361/387 assertions at
  375/768/1280px. These include original/mixed/renamed tokens, empty columns,
  shared widths, appearance, repeat decoration and simulated editor transitions.
- Native V3 passes 141 assertions at each width; V2 passes 354/354/379. Six V1
  drafts pass loading, namespace and overflow smoke checks at all three widths.
- Actual author main markup was read with authorization and rendered only in a
  local test page. Its two custom sections retain all 10 block resources once
  each, with column populations [2,3,0,1] and [3,1]. Saved class tokens remain
  unchanged. Responsive tracks and no-overflow checks pass at all three widths.
  The shared title/image in column 2 keep their half widths. Both actual media
  assets return HTTP 200 when read from the authenticated author host.
- A desktop screenshot of that local rendering was inspected in ignored
  `output/playwright/global-section-recovery-author-desktop.png`.
- No layout resource/page errors occurred in fixture tests. Two initial image
  404s in the local author-markup test came from author-only media paths going
  through the local public-content proxy; re-reading those images from their
  authenticated author host resolved them. The V1 invalid-break warning is expected.

## Rollout boundary

Only the site commit/push to `new-demo` is authorized. The sibling extension's
matching contract and fallback changes remain local; Stage already has the
original contract and needs no deployment for this repair. No AEM content is
written, migrated, deleted or published. Live editor save/add/delete persistence,
registration and interactions are not established by local rendering or SDK mocks.
