# Global section and Layout

The site's custom section implementation uses version-free names. Its authoring
group is **Layouts**, its component title is **Global section**, and supported
blocks gain a **Layout** tab. Native V3 stays in `layout-v3/` and **Layouts - V3**.

## Breaking change

There are no custom V3 aliases or fallback mappings. Existing AEM content is not
modified by this change. Recreate or separately migrate old custom sections and
placement properties before deploying. The ordinary section, V1, V2, Native V3,
Freeform, AEM resource types and supported block IDs are unchanged.

| Saved interface | Value |
| --- | --- |
| Section definition, model and filter | `global-section` |
| Enabled section `layout` | `global-section-columns` |
| Section count / gap | `column-count` / `column-gap` |
| Assigned column | `classes_layoutcolumn`: `layout-column-1` … `layout-column-4` |
| Width | `classes_layoutwidth`: `layout-width-{100,75,two-thirds,50,third,25}` |
| Alignment | `classes_layoutalign`: `layout-align-{start,center,end}` |
| Row | `classes_layoutrow`: `layout-row-{own,share}` |

Placement fields remain class properties, not content rows. Defaults are column 1,
full width, Start and Own row. Newly added sections default to Columns, two columns
and Medium gap. Missing or invalid layout metadata stays inactive; only
`global-section-columns` activates the custom renderer.

## Author usage

Add **Global section** and select **Layout → Columns**. Choose 1–4 columns and a
None/Small/Medium/Large gap (0/12/24/48px). Add Global Title, Global Text, Global
Image or Teaser with the native section Add action, then choose **Assigned column**
in the block's **Layout** tab. Existing appearance controls remain available.

The optional sibling `eds-layout-extension` supplies the **Layouts** panel with
collapsible sections/columns, bottom Add controls, selection for Properties,
reassignment, deletion and within-column drag reordering. Its registration ID is
`comwrap.eds.layouts`. It does not replace the native content tree or make the
canvas's empty-column instructions clickable.

Own row reserves a row with the selected width/alignment. Consecutive shared blocks
with matching alignment wrap together using gap-adjusted fractional widths.
Below 600px columns stack in column order; 600–899px uses up to two columns with
full-width blocks; desktop applies all widths and configured columns. Invalid
settings use defaults. Count reduction displays overflow assignments in the last
column without changing their saved values. Disabling Columns restores authored
order. Default-content wrappers stay indivisible.

## Source boundaries

- `global-section.js` / `.css`: renderer and scoped public styles.
- `layout.js`: pure settings, assignment and row grouping.
- `editor.js` / `.css`: edit-state detection and transient empty-column warnings.
- `_global-section.json` / `_block-layout.json`: authoring sources.

Public CSS is scoped under `.global-section.layout-columns`. Presentation uses
`layout-*`, `data-layout-*` and `--layout-*`. Decorators move existing nodes without
cloning editor identifiers, writeback or synthetic CMS column resources. The
site's queued editor lifecycle reflows affected source/destination sections.

The root `global-section/` folder is a **separate portable copy**, with its own
blocks, dependencies, authoring contributions, example and tests. This site does
not import it. Do not load/register both implementations in one project. The
contract parity test compares their section and placement authoring sources.
After modifying either contract, update the other deliberately and sync the
extension's generated snapshot.

## Local checks

```sh
npm run build:json
npm run lint
npm test
cd global-section
npm run build:json
npm test
```

In the sibling extension run `npm run sync:global-section`,
`npm run check:global-section`, `npm run lint`, `npm test` and `npm run build`.

With the AEM server's `--html-folder drafts`, `/drafts/global-section` exercises
the site renderer. Run the default export from `test/layout/browser.js` against
it at mobile, tablet and desktop widths. A local browser runner must serve test
modules from disk because `test/` is excluded from EDS delivery. The portable
copy and extension provide independent preview servers and browser suites.

Local tests cover rendering and simulated editor events, not live registration,
SDK persistence or permissions. No content migration, commit, push or Stage
deployment is included in this rename.
