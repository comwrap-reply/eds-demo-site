# Global section and Layout

The site's custom section implementation uses version-free source names. Its authoring
group is **Layouts**, its component title is **Global section**, and supported
blocks gain a **Layout** tab. Native V3 stays in `layout-v3/` and **Layouts - V3**.

## Saved-content compatibility

The October 13 repair restores the original saved V3 contract used by existing
AEM content and the deployed Stage extension. The October 9 breaking contract
rename is superseded; source folders and visible labels remain version-free.
No AEM content is migrated or deleted. Ordinary sections, V1, V2, Native V3,
Freeform, resource types and supported block IDs are unchanged.

| Saved interface | Value |
| --- | --- |
| Section definition, model and filter | `section-custom-v3` |
| Enabled section `layout` | `columns-v3` |
| Section count / gap | `column-count` / `column-gap` |
| Assigned column | `classes_layoutv3column`: `layout-v3-column-1` … `layout-v3-column-4` |
| Width | `classes_layoutv3width`: `layout-v3-width-{100,75,two-thirds,50,third,25}` |
| Alignment | `classes_layoutv3align`: `layout-v3-align-{start,center,end}` |
| Row | `classes_layoutv3row`: `layout-v3-row-{own,share}` |

Placement fields remain class properties, not content rows. Defaults are column 1,
full width, Start and Own row. Newly added sections default to Columns, two columns
and Medium gap. Missing or invalid layout metadata stays inactive. The renderer
accepts `columns-v3` and the renamed `global-section-columns` value. For each
placement setting, original `layout-v3-*` values take precedence; renamed
`layout-*` values are read only when the original setting is absent. Invalid or
conflicting original tokens use defaults, not stale renamed values.

New authoring writes the original properties. There is no duplicate
`global-section` authoring definition: any content saved under that renamed
model elsewhere needs a separate review before editing. Existing labels stored
in AEM may still say Custom Section - V3 until an author changes the section name.

## Author usage

Add **Global section** and select **Layout → Columns**. Choose 1–4 columns and a
None/Small/Medium/Large gap (0/12/24/48px). Add Global Title, Global Text, Global
Image or Teaser with the native section Add action, then choose **Assigned column**
in the block's **Layout** tab. Existing appearance controls remain available.

The optional sibling `eds-layout-extension` supplies the **Layouts** panel with
collapsible sections/columns, bottom Add controls, selection for Properties,
reassignment, deletion and within-column drag reordering. Its registration ID is
`comwrap.eds.layouts-v3`. It does not replace the native content tree or make the
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
SDK persistence or permissions. See [the recovery record](RECOVERY.md) for
verification and the authorized preview-branch rollout. No Stage deployment or
AEM content migration is part of the repair.
