# Path-based Text modifiers

The existing **Text** component uses a different Universal Editor properties
model depending on the page. Its resource type, saved property names, and
rendered CSS stay the same.

| Page | Alignment | Color | Grid controls |
| --- | --- | --- | --- |
| Home (`/` or `/index`) | Default, Left, Center | Default, Black, FNG Blue, FNG Orange | Hidden |
| `/freeform` | Default, Left, Center, Right, Justify | Full existing palette | Span, start, floating position |
| Other paths | Existing Text model | Existing palette | Existing controls |

## Demo

1. Load this branch's code in Universal Editor using the AEM development setup.
2. Open the home page and select (or add) a **Text** component. The properties
   panel shows **Alignment — Home** and **Color — Home**.
3. Open `/freeform` and add a **Text** component to its section. The preview
   inspected for this change contains Freeform blocks but no default Text component.
4. Select that Text component. The panel shows **Alignment — Freeform**,
   **Color — Freeform**, and all three grid controls.
5. Choose a color or alignment and observe the existing styles applied on canvas.

Select **Text**, not the **Freeform**, **Freeform V2**, or **Global Text** blocks;
those components keep their own models. These are authoring choices, so merely
opening the public preview URLs does not display the properties panel.

## Implementation

`scripts/text-modifiers.js` chooses `text-home`, `text-freeform`, or the original
`text` model using the page's instrumented AEM resource, falling back to the URL.
It recognizes `/content/eds-demo-site/index.html` and
`/content/eds-demo-site/freeform.html`, including `jcr:content` resource URNs.
Matching is exact: `/freeform-example` and `/freeform/child` use the base model.

The editor's rich-text decoration applies `data-aue-model` on initial load and
after content updates, additions, copies, or moves. Universal Editor gives this
attribute precedence over the model in the component definition. See Adobe's
[model linking documentation](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types#linking-using-instrumentation).

Edit the partial models in `models/`, then run `npm run build:json`. The Freeform
model reuses the base Text fields. Restricting the home controls does not delete
previously authored values or enforce a server-side permission policy.

## Acceptance checks

- Home exposes two controls with the restricted choices above.
- Freeform exposes all five controls and the full existing choices.
- Other paths and rich-text fields inside blocks retain their existing models.
- Trailing slashes and `.html` URLs resolve to the same page profile.
- Editor updates reapply the appropriate model without changing content/classes.
- Existing text presentation stays unchanged at mobile, tablet, and desktop sizes.
