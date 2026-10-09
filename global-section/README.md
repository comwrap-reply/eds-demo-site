# Global section — copyable AEM EDS package

Copy this whole folder to another AEM Edge Delivery / Universal Editor project
as `/global-section`. It contains the section renderer, responsive CSS, appearance
styles, all four supported blocks, authoring JSON, editor helpers, vendor library,
tests and a standalone example. No npm install or build is required to render it.

This is a **portable copy**, separate from the site's implementation in `layout/`.
Neither implementation imports the other. Changes to one copy do not automatically
update the other; the site's contract parity test checks their saved mappings.
Do not register or load both copies in the same site.

This is a **breaking rename** of the former custom V3 system. Old custom models,
layout values and placement properties are not supported. Existing AEM content
has not been changed: recreate or separately migrate it before rollout. Native V3,
V1, V2 and Freeform are unaffected.

## What is included

- `index.js`, `runtime/`: layout settings, grouping, rendering, transient editor
  hints, rich-text support and an opt-in queued editor update handler.
- `section.css`, `appearance.css`, `editor.css`: public and editor-only styles.
- `blocks/`: Global Title, Global Text, Global Image and Teaser, including models
  and their local utility dependencies. Existing responsive pictures are handled
  as in the source blocks; Teaser uses the included Adobe picture utility.
- `authoring/`: section and shared placement sources plus three ready-to-merge
  JSON contribution files. They are **not replacements** for a project's files.
- `integration/blocks/`: small loader files to copy to the target's `/blocks/`.
- `vendor/`: the source site's pinned DOMPurify sanitizer; see `NOTICE.md`.
- `example/`, `test/`, `tools/`: isolated preview, tests and JSON generation.

No V1, V2, Native Columns - V3, Freeform, site fonts, tracking, CMS content,
credentials or App Builder project is required by these runtime files.

## 1. Copy and load the section

Copy this folder into the target site's root, keeping the name `global-section`.
In `head.html`, load its public styles eagerly, after the site's normal styles:

```html
<link rel="stylesheet" href="/global-section/section.css">
```

In the target's `scripts/scripts.js`:

```js
import { decorateGlobalSection } from '../global-section/index.js';

// Inside the existing decorateMain(main), immediately after these normal calls:
decorateSections(main);
decorateBlocks(main);
decorateGlobalSection(main);
```

Keep normal AEM section/block loading. Do not modify `scripts/aem.js` or run
`decorateSections` again on already-grouped markup. All authored blocks remain
direct section children in AEM; runtime column wrappers have no saved resources.

## 2. Connect the included blocks

Copy the four directories in `integration/blocks/` to the target's root
`blocks/` directory. The JS/CSS loader paths are deliberately relative to that
**destination**, not to this template directory. Keep the implementation under
`global-section/blocks/`; the loaders point there.

If the target already has any of these block IDs, **do not overwrite its files**.
Choose whether to retain its block implementation or use this one, and merge
the shared placement fields into its existing model. The section currently
recognizes `global-title`, `global-text`, `global-image` and `teaser` classes.
Unknown/default content stays visible in column 1; default-content wrappers are
indivisible. Supporting additional IDs requires updating the selector and filter.

## 3. Merge the authoring contributions

For the distributed `merge-json-cli` pattern used by the AEM boilerplate:

1. Add `{"...":"../global-section/authoring/component-definition.json#/groups"}`
   as one item in `models/_component-definition.json`'s `groups` array.
2. Add `{"...":"../global-section/authoring/component-models.json"}` to the
   `models/_component-models.json` array.
3. Add `{"...":"../global-section/authoring/component-filters.json"}` to the
   `models/_component-filters.json` array.
4. Add `"global-section"` to the existing **main** filter's `components` array.
5. Run the target site's `npm run build:json`, lint and tests.

If the target uses `eslint-plugin-xwalk`, preserve its existing rule options and
allow the five key/value metadata fields on this section model:

```js
'xwalk/max-cells': ['error', { 'global-section': 5 }]
```

This exception is for section metadata only, not for content-block table cells.

For centralized models, merge the equivalent entries directly. Never replace
the site's entire JSON files, duplicate IDs, or add Global section to the
ordinary section's child filter. It is a page-level section.

If the child models already exist, merge only the new section definition/model/
filter, then append the fields from `authoring/placement.json` to each existing
child model once. Keep its existing appearance/content fields. The generated
files include all four blocks for a clean installation, not just the section.

Edit `authoring/section.json`, `authoring/placement.json`, or the block source
models and run `npm run build:json` **in this folder** to refresh the portable
contributions, then regenerate the target site's aggregate files. Legacy V1 grid
and V2 controls are deliberately excluded from these standalone models.

## 4. Connect Universal Editor

The public renderer never writes content. Editor hints are initialized only from
the target's editor-support entry, not by hostname checks. In a project that
already has a queued update handler, keep that handler and use:

```js
import { decorateGlobalSection } from '../global-section/index.js';
import {
  initGlobalSectionEditor,
  refreshGlobalSectionEditor,
} from '../global-section/editor.js';

initGlobalSectionEditor(); // once, when editor support initializes
// After applying an update and standard block decoration:
decorateGlobalSection(affectedSection);
refreshGlobalSectionEditor(affectedSection);
```

Reflow both affected sections after cross-section moves. Structural changes must
use fresh authored section markup, not the presentation-grouped DOM. Preserve
the host's rich-text handling and sanitization.

Alternatively, for a standard project without a suitable update handler, replace
its content-event handler with the included queue from its editor-support module:

```js
import {
  decorateBlock, decorateIcons, loadBlock, loadSection, loadSections,
} from './aem.js';
import { decorateButtons, decorateMain } from './scripts.js';
import { attachGlobalSectionUpdates } from '../global-section/editor.js';

attachGlobalSectionUpdates({
  decorateBlock, decorateIcons, loadBlock, loadSection, loadSections,
  decorateButtons, decorateMain,
});
```

`decorateMain` must include step 1. **Install one content-event handler only.**
This optional queue handles add/copy/move/edit/remove snapshots and falls back to
page reload for unsupported responses. It includes sanitization and rich-text
grouping. It intentionally does not include this site's V1/V2/native-cell-specific
handling. If the target has custom rich-text or update logic, use the first
integration approach rather than replacing that logic.

Standard AEM markup generation, decoration/loading functions and an instrumented
Universal Editor page remain **host requirements**, not bundled replacements for
AEM. Actual live SDK responses, permissions and CMS persistence need testing on
a disposable target page; local simulation cannot verify those.

## Saved contract and behavior

The visible title is **Global section**, in **Layouts**, with block placement in
the **Layout** tab. The section definition/model/filter is `global-section` and
`layout = global-section-columns`, with `column-count` and `column-gap`. Block placement uses
`classes_layoutcolumn`, `classes_layoutwidth`, `classes_layoutalign` and
`classes_layoutrow`; class values use the `layout-` prefix. These are new saved
names, not aliases for the old custom V3 names. Public layout CSS is scoped under
`.global-section.layout-columns`; transient presentation uses `layout-*`,
`data-layout-*` and `--layout-*`.

Counts 1–4, gaps 0/12/24/48px, own/shared rows and alignment behave as before.
Below 600px columns stack; 600–899px uses up to two columns with full-width
blocks; desktop enables configured counts and widths. Invalid settings default
safely, and assignments above the count display in the last column without
changing saved values. Disabling Columns restores authored order. Default layout
uses the host project's regular section presentation.

The App Builder **Layouts** panel is a separate, optional project. This folder
does not include or deploy it. Use an extension built with the new contract and
registration ID `comwrap.eds.layouts`. Each
target organization must enable/register the extension separately. Without it,
use native section **Add**, then **Assigned column**. Native content-tree column
containers and on-canvas Add interactions are not created by this package.

The sibling `eds-layout-extension` can sync its saved-property mappings and
component chooser from this package's source authoring JSON. In that extension:

```sh
npm run sync:global-section -- /path/to/global-section
npm run check:global-section -- /path/to/global-section
npm run lint
npm test
npm run build
```

Sync copies only public authoring data into its generated local contract. It does
not bundle this renderer or styles, change AEM content, or deploy either project.
Re-sync after changing the package's authoring sources. The extension remains
independently buildable with its saved snapshot; target sites still need the
website integration described above.

## Theming

The historical color choices are included without requiring the original site's
global styles or fonts. Override the `--global-section-*` properties on a page
ancestor: `background`, `light`, `text`, `dark`, `blue`, `light-blue`, `cyan`,
`orange`, `border`, `font`, `max-width` and `padding`. For example:

```css
main { --global-section-blue: #163b65; --global-section-font: Arial, sans-serif; }
```

Typography, normal link/button styles and other non-layout site styling still
belong to the target's design system. The example provides only minimal demo CSS.

## Local checks

Node 20+; no install or external server is required:

```sh
cd global-section
npm run build:json
npm test
npm run dev
```

Open <http://127.0.0.1:3002/>. This server exposes only this folder. The example
simulates standard EDS decoration and successful editor events; it makes no CMS
requests. `test/browser.js` exports a browser regression function for this page.
Keep `test/`, `tools/`, `example/`, `integration/` and source `authoring/` out of
public delivery using target `.hlxignore` entries if committing the whole kit.
Only the merged root component JSON is needed by Universal Editor.
