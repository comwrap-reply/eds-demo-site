# Layouts - V3

Two opt-in approaches, with independent IDs and settings. V1, V2 and existing CMS pages are not migrated.

## Native Columns - V3

Add **Native Section - V3**, then **Native Columns - V3** inside it. Select a real column in the canvas/content tree and use Universal Editor's native **Add** action. The cells accept standard Title, Text, Image and Button only. Their existing content controls remain available; the custom Global blocks and Teaser are intentionally excluded.

The underlying component is AEM's native Columns resource type. Rows and columns are persisted by AEM; JavaScript never invents column resource identifiers. The V3 model offers 1–4 columns, 1–4 rows and 0/12/24/48px gaps. Move content before reducing the native row/column count; V3 does not override AEM's persistence behavior. Empty cells have editor-only instructions and boundaries. These are selectable container areas, not custom Add buttons.

## Global section

Add **Global section**. Add Global Title, Global Text, Global Image or Teaser using native section Add. Each retains all its appearance settings and gains a **Layout - V3** tab: assigned column, width, alignment and own/shared row. These settings are inactive outside a V3 custom Columns section. V2 settings are independent.

This is an author-facing rename of the existing `section-custom-v3` component,
not a new layout or a reusable-content feature. IDs, filters and saved layout
settings are unchanged. New sections default to the name **Global section**;
existing sections retain their saved **Section Name** until an author edits it.
The extension continues to use the short **Section** heading in its Layouts panel.

Authored blocks remain direct children of the section. Presentation columns have no fabricated editor resources. Consequently the native content tree stays flat. The companion extension is now in the sibling [eds-layout-extension project](../../eds-layout-extension/README.md), outside this website. It supplies a separate, expandable **Layouts** panel with column groups, Add and reassignment controls. It does not replace Adobe's native tree. Registering/deploying that extension is a separate environment step; the section works with native section Add and Assigned column without it. Canvas placeholders explain this fallback and do not pretend to create saved content.

The extension's tests and local SDK simulation moved with it. Run `npm test`,
`npm run lint`, `npm run build` and `npm run dev` from `../eds-layout-extension`.
Its simulation is now at <http://127.0.0.1:3001/drafts/layout-v3-panel>, not the
website's port 3000. Website tests continue to run independently with `npm test`.

The custom layout defaults to two columns and a medium gap. Own row preserves width/alignment inside a reserved row. Consecutive shared rows with the same alignment wrap with gap-adjusted fractional widths. Mobile below 600px stacks columns; tablet 600–899px uses up to two columns and full-width blocks; desktop applies all widths. Invalid settings use defaults. Count reduction clamps display to the last available column without modifying assignments; disabling Columns restores authored order.

## Saved mappings

- Native definition `columns-native-v3`: resource type `core/franklin/components/columns/v1/columns`, `classes = layout-v3-native`, native `rows` and `columns`, `classes_gap = layout-v3-gap-{none|small|medium|large}`. Runtime editor metadata selects model `columns-native-v3` and filter `column-native-v3` only on existing instrumented cells.
- Native section `section-native-v3`: existing section resource type and restricted filter `section-native-v3`.
- Custom section `section-custom-v3`: existing section resource type, restricted filter `section-custom-v3`, section `layout = columns-v3`, `column-count`, `column-gap`.
- Custom block fields: `classes_layoutv3column`, `classes_layoutv3width`, `classes_layoutv3align`, `classes_layoutv3row`; class values start with `layout-v3-` and never introduce content rows.

## Acceptance and verification checklist

- [x] One Layouts - V3 group; distinct native/custom definitions, models and filters.
- [x] Existing definitions and V1/V2 behavior unchanged; no Freeform or aem.js edits.
- [x] Native cells retain fixture resources/content order and support empty cells/multiple rows.
- [x] Custom placement, all gaps/widths, invalid settings, reduction, restoration and repeated decoration.
- [x] Simulated editor updates reflow only affected content; edit/preview removes temporary instructions.
- [x] Extension uses supported actions, validates editables, prevents duplicate submissions and reports partial/ambiguous Add failures without retrying creation (mock tested).
- [x] JSON generation, lint, Node tests and browser regression fixtures pass at mobile/tablet/desktop widths.
- [ ] Live editor persistence, native selection/tree/Add and deployed extension interactions: **not locally verifiable**; require a disposable AEM page and registered extension.

Local fixtures: `/drafts/layout-v3-native` and `/drafts/layout-v3-custom`. These demonstrate rendering, not proof of CMS persistence. No deployment, content writes, commits or pushes are part of local verification.

### Local results — 2026-10-06

- JSON generation, lint, 15 importer cases and 24 Node tests pass. The standalone extension production bundle builds with its pinned dependencies (zero vulnerabilities reported on installation).
- Custom browser suite: 354 assertions below desktop, 379 at desktop; native browser suite: 141 assertions. Both passed at 375, 600, 768, 900 and 1280px.
- Actual panel UI with a mock SDK: Add-to-column, saved assignment, selection, reassignment, keyboard collapse and collapse preservation after Refresh passed at 420px with no overflow.
- V2 regression suite passed at 375/768/1280px. Six V1 drafts passed load/overflow/isolation smoke checks at those widths. The malformed/missing Column Break fixture retains its intentional warning. The existing footer draft is only a smoke test, not verification of live footer content.
- No page errors or missing resources in the checked matrices. Screenshots are in ignored `output/playwright/v3-*.png`.
- All previous generated definitions/filters and model fields were compared against HEAD and preserved (aside from the additive V3 fields/allowed sections).

### Re-running browser checks

Start the development server with `--html-folder drafts`. `test/layout-v3/browser.js` exports the custom-layout suite; `native-browser.js` exports the native-cell suite. A browser runner must fulfill these local modules from disk because `test/` is excluded from EDS delivery, then import and call the default export on the matching draft URL. The modules use the real rendering and queued editor handler with synthetic successful server responses. `panel-browser.js` mounts the actual extension panel against a memory-only SDK mock; serve its imports locally as well, never connect that fixture to AEM.

References: [Adobe content modeling](https://www.aem.live/developer/component-model-definitions), [extension actions](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/actions/), [extension registration](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/commons/).
