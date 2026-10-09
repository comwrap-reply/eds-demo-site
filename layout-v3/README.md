# Native Layouts - V3

This folder contains only the native V3 layout implementation. The independent,
version-free Global section implementation is now documented in
[layout/README.md](../layout/README.md). V1, V2 and Freeform remain separate.

## Authoring

Add **Native Section - V3**, then **Native Columns - V3** inside it, from
**Layouts - V3**. Select a real column in the canvas/content tree and use Universal
Editor's native **Add** action. Cells accept standard Title, Text, Image and
Button only. Their existing content controls remain available; Global blocks and
Teaser are intentionally excluded.

The underlying component is AEM's native Columns resource type. Rows and columns
are persisted by AEM; JavaScript never invents column resource identifiers.
The model offers 1–4 columns, 1–4 rows and 0/12/24/48px gaps. Move content before
reducing the native row/column count; this implementation does not override AEM's
persistence behavior. Empty cells have editor-only instructions and boundaries.
These are selectable container areas, not custom Add buttons.

## Unchanged saved contract

- Native definition/model `columns-native-v3`: resource type
  `core/franklin/components/columns/v1/columns`, `classes = layout-v3-native`,
  native `rows` and `columns`, and
  `classes_gap = layout-v3-gap-{none|small|medium|large}`.
- Native section `section-native-v3`: existing section resource type and
  restricted filter `section-native-v3`.
- Runtime editor metadata selects model `columns-native-v3` and filter
  `column-native-v3` only on existing instrumented cells.

The native renderer, settings and editor helpers retain their V3 names.
`editor-v3.js` and `editor-v3.css` now exclusively serve native cells; the custom
section no longer shares these helpers. Native styles and appearance are unchanged.

## Local verification

Start the site with draft HTML enabled and open `/drafts/layout-v3-native`.
`test/layout-v3/native-browser.js` exports the native-cell regression function;
run its default export at mobile, tablet and desktop widths. A local browser
runner must serve this module from disk because `test/` is excluded from EDS
delivery. The suite checks configured cells, gaps, resource identity, repeated
decoration and editor edit/preview transitions.

These are rendering and simulated editor tests, not proof of live CMS persistence,
native selection/tree/Add, or permissions. Those require a disposable AEM page.
