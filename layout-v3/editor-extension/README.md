# Layouts - V3 editor extension

This is a separate Universal Editor extension, not public website JavaScript. It adds a properties rail with expandable column groups for **Custom Section - V3**, per-column Add and block selection/reassignment. Native Columns - V3 continues to use Adobe's native tree/Add. The custom rail does not alter the native tree or expose fictitious persisted column nodes.

## Build and enable

1. In this directory run `npm ci --ignore-scripts` and `npm run build` (Node 20+). Build output stays in ignored `web-src/dist/`.
2. Have an administrator create/select an App Builder project and workspace with the **Universal Editor UI** extension point (`universal-editor/ui/1`). Use its generated workspace configuration and the Adobe I/O CLI. No workspace credentials are included here.
3. Use `app.config.yaml` / `ext.config.yaml` from this directory and `web-src/` as the web application. Run the project's normal `aio app run` / development preview flow, then `aio app deploy` only when authorized. Enable the deployment for the intended organization/environment through Adobe's extension management flow.
4. Push the site's component JSON/runtime changes to a preview branch separately. Open that branch in Universal Editor, then open **Layouts - V3** in the properties rail.
5. On a disposable page verify add/edit/reassignment, count changes, permission errors, rapid clicks, page navigation, edit/preview, and concurrent authoring. Do not roll out until live persistence and the instance's SDK state/details shapes are confirmed.

`npm run build` only checks the frontend bundle. It does **not** register, deploy, enable or verify the extension in AEM. App Builder setup and live acceptance remain external prerequisites. Public EDS delivery excludes this entire directory through `.hlxignore`.

## Author workflow

Expand the section's **Column 1**, **Column 2**, etc. groups. Choose a supported block and **Add to column N**. Click a block name to select its real editable and use its existing property controls. Choose a destination and **Reassign** to change only its saved column. Use **Refresh columns** after actions in the native editor; the panel also refreshes after its own actions. Collapse state is retained for the current panel session.

Blocks remain direct children of the persisted section. Column groups are a panel projection. Reassignment changes `classes_layoutv3column`; it does not rearrange the saved content order. Native copy/move/delete and ordering controls remain available. There is no custom drag-and-drop or canvas-to-panel messaging bridge in this version. Canvas empty-column instructions offer the native section Add + Assigned column fallback.

## Safety and limitations

- Uses `editorState.get`, `editorActions.details`, `add`, `update` and `selectEditables` through the UIX guest connection. No raw CMS writes or tokens are stored, logged or requested.
- Validates V3 sections, column bounds, supported block models and actual immediate child resources. Property editables and duplicate resource representations are excluded.
- Add returns no resource, so the controller compares the real section's editable snapshots after the confirmed operation. Only one matching new block is accepted. Ambiguous/missing results are reported for manual recovery, never assigned by guesswork or retried automatically.
- Add and assignment are two non-transactional operations. If assignment fails, the added block remains and the author is told how to recover. The panel locks controls during a request. Cross-session concurrent Add remains a live acceptance case; do not assume local mocks prove concurrent authoring behavior.
- Rendering and reads never write. Host authorization still governs mutations. The panel relies on the editor SDK to reject unavailable/unauthorized actions, including restricted modes.
- Local mock tests are not evidence of native editor persistence. The native tree, Add, live SDK response shapes, extension registration and permissions require the manual acceptance above.

References: [properties rail](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/properties-rails/), [actions](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/actions/), [editor state](https://developer.adobe.com/uix/docs/services/aem-universal-editor/api/data/).
