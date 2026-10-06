# Layouts - V2

Section-based columns with independently placed content. V1 remains available without migration.

## Authoring

1. Add **Layouts - V2 → Section - V2** to the page.
2. Set **Layout → Columns**, choose 1–4 columns, and choose a gap. Default layout does not activate V2.
3. Use the real section's native **Add** action to add **Global Title**, **Global Text**, **Global Image**, or **Teaser**.
4. On the block's **Layout - V2** tab, choose Assigned column, Width within column, Horizontal alignment, and Row behavior.

Use **Global Title** for an independently placed heading. Headings inside a text block or a default-content wrapper are not independently positioned components. Other allowed section content remains visible at column 1/full width/Own row. The section reuses the existing content filter; legacy Columns and Column Break components are not needed for V2 placement.

Content and appearance fields retain their existing behavior. The new placement fields only apply in V2 Columns sections; existing V1 Grid span/start/float controls continue to apply to V1 layouts, not V2. Panel, border, shadow, color, and typography classes are retained.

### Rows and responsive behavior

- **Own row:** the selected width is a fraction of the assigned column, with Start/Center/End positioning in a separate row.
- **Share row:** consecutive shared blocks with matching alignment form a wrapping group. Alignment positions each entire line. A different alignment or an Own row block ends the group. Widths account for the gap: `fraction × (column width + gap) − gap`, so two halves, three thirds, and four quarters fit.
- **Below 600px:** columns stack in column order, with every block full width.
- **600–899px:** up to two equal-width columns, with blocks full width within each column.
- **900px and wider:** configured columns, widths, shared rows, and alignment apply.
- Gaps are None (0px), Small (12px), Medium (24px), and Large (48px), between both columns and rows/items.

Block order within each column follows persisted section order. Reducing the count never deletes, hides, or rewrites content: blocks assigned beyond the current count render in the last column. In Edit mode, a warning asks the author to change Assigned column. Increasing the count restores the saved placements.

The sample at `/drafts/layout-v2` has a 25%-width, end-aligned Global Title and two half-width shared Teasers in column 1, plus full-width Global Text in column 2. It also demonstrates empty columns, reduction fallback, Global Image, panels, and an unchanged default section.

## Saved properties and HTML

Authored content remains a flat list of children of the real section. The standard AEM section resource type is unchanged. The V2 definition/model ID is `section-v2`; it reuses filter `section`.

| Property | Values / default | Delivered representation |
| --- | --- | --- |
| Section `layout` | `default` / `columns-v2`; default `default` | Section metadata → `data-layout` |
| Section `column-count` | `1`–`4`; default `2` | Section metadata → `data-column-count` |
| Section `column-gap` | `none`, `small`, `medium`, `large`; default `medium` | Section metadata → `data-column-gap` |
| `classes_layoutv2column` | `layout-v2-column-1`–`4`; default `1` | Block class |
| `classes_layoutv2width` | `layout-v2-width-25`, `third`, `50`, `two-thirds`, `75`, `100`; default `100` | Block class |
| `classes_layoutv2align` | `layout-v2-align-start`, `center`, `end`; default `start` | Block class |
| `classes_layoutv2row` | `layout-v2-row-own`, `share`; default `own` | Block class |

All four block models include `_block-layout-v2.json` through the existing JSON merger. No extra content rows are introduced. Missing, invalid, or conflicting placement tokens use defaults. Runtime grouping only moves existing wrappers; it does not clone editable content, change resource identifiers, or write to AEM.

## Editor support and limitations

`scripts/editor-support.js` processes sanitized server snapshots through its existing serial event queue. All supplied affected subtrees are handled, including source and destination sections on moves. Block-only changes reflow their containing section. Unknown payload shapes retain the existing automatic reload fallback; normal supported section-count updates do not reload the page.

The editor-only module uses the Universal Editor's `adobe-ue-edit` / `adobe-ue-preview` state and `aue:ui-edit`, `aue:ui-preview`, and `aue:initialized` events. It does not infer editing from a preview hostname. Empty-column instructions and reduction warnings are temporary UI, never authored blocks; preview removes their text, outlines, and sizing. Public rendering does not load the editor module or its stylesheet.

**Column-scoped Add and custom drag-and-drop are not implemented.** Use native section Add plus Assigned column, and native authoring ordering controls. Native moves do not automatically change Assigned column.

A scoped Add interaction needs a separately registered and deployed Universal Editor UI extension using `@adobe/uix-guest` and `universal-editor/ui/1`. It must resolve the real section editable, call `editorActions.add`, identify the newly created editable from the successful authoring response/state, and persist `classes_layoutv2column` with `editorActions.update`. A canvas action additionally needs a validated communication bridge to that extension. Persistent custom drag-and-drop needs the supported move operation plus the saved assignment update, including ordering and failure handling. None of this is simulated by inserting DOM or duplicating section resources.

References: [section/block modeling](https://www.aem.live/developer/component-model-definitions), [editor events](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/events-universal-editor), [extension actions](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/actions/).

## Local verification

- `npm run build:json` regenerates the authoring files; do not edit them directly.
- `npm run lint` includes V1 and V2 source areas.
- `npm test` runs the existing importer tests and the new Node layout/model checks.
- `test/layout-v2/browser.js` exports an asynchronous browser regression suite. Start the AEM CLI with `--html-folder drafts`, open `/drafts/layout-v2`, and run it at mobile, tablet, and desktop widths. Tests are excluded from public delivery by `.hlxignore`; a browser-test runner can fulfill `/test/layout-v2/browser.js` from that local file, then evaluate `import('/test/layout-v2/browser.js').then(({ default: run }) => run())`.

Browser checks exercise real DOM/CSS and the actual editor event handler using synthetic successful server responses. They do **not** prove saved changes in AEM or live editor selection, copy, move, and deletion. A disposable Universal Editor page is still needed for that verification. No CMS pages are modified by these tests.

### Implementation verification — 2026-10-06

- JSON generation, lint, all 15 existing importer cases, and 7 new Node tests passed.
- Browser suite passed at 375, 599, 600, 768, 899, 900, and 1280px, including simulated editor events, rapid queued changes, and section-only updates from larger server snapshots.
- Six existing V1 drafts were checked at 375, 768, and 1280px: Columns grid, nested grid, global content, multi-column Sections, paneled grid, and footer.
- No browser console errors or missing-resource responses were observed in either regression matrix. The V1 missing-Column-Break fixture retains its intentional warning and fallback.
- Live Universal Editor persistence remains unverified; scoped Add and custom drag-and-drop are not provided.
