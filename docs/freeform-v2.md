# Freeform v2

Freeform v2 is a separate Universal Editor rich-text block. It uses Adobe's
[`unsupportedHtml` configuration](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/configure-rte#unsupported-html)
to preserve tags that the RTE does not recognize. The original Freeform model
remains a textarea.

## Content model

| Freeform v2 |
| --- |
| Rich-text content, including unsupported HTML |

The optional `text` field occupies one row and one cell. Its model is
`freeform-v2`; the component and its rich-text content use the `freeform-v2`
filter. The default toolbar remains available. No additional structural tags
are whitelisted: unknown tags use the editor's unsupported-node preservation.

Add **Freeform v2** to a section, then edit **Content** in the rich-text editor.
Paste rich HTML content from the clipboard; pasting HTML source as plain text
does not turn it into markup. Unknown tags may appear as labeled unsupported
nodes while editing.

The block does not sanitize, decode, or rebuild its authored HTML. It preserves
the DOM delivered by AEM, including editor instrumentation. The editor manages
its own unsupported-nodes plugin. This setting is not an unrestricted HTML or
script-execution switch: AEM storage, Edge Delivery serialization, and the
page's Content Security Policy still apply. Verify custom markup in both the
Universal Editor and published content before relying on it.

## Classes and inline styles

The renderer keeps `class` and `style` attributes on the delivered content,
including multiple classes and styles on nested formatting elements. The site's
automatic link-to-button conversion skips Freeform v2 so it cannot overwrite
authored link/paragraph classes or remove styled `strong`/`em` wrappers. Existing
site CSS classes can be used; additional class names need corresponding CSS to
have a visual effect.

For example:

```html
<p class="text-color-blue custom-copy" style="padding: 8px;">
  <span class="custom-highlight" style="background-color: #fff0c8;">Styled content</span>
</p>
```

This is renderer behavior, not a promise that the hosted RTE or publishing
pipeline accepts every attribute or CSS declaration. Adobe documents a
[class picker](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/configure-rte#css-classes)
with predefined options, text-color styling, and table style controls; it does
not document a blanket allow-all-attributes setting. `unsupportedHtml` preserves
unknown tags and is not an attribute allowlist. Verify classes and styles on both
supported and unsupported tags through an actual editor save/reopen and preview.

## Validation

Local sample: `http://localhost:3000/drafts/freeform-v2` with
`npx aem up --html-folder drafts --no-open --forward-browser-logs`.

Acceptance criteria:

- Freeform v2 is selectable in a section and has a rich-text Content field.
- Its filter enables `rte.unsupportedHtml` without changing other RTE filters.
- The JSON build preserves the existing Freeform definition and textarea model.
- Block decoration preserves nested elements, custom tags, SVG, attributes,
  escaped code examples, and Universal Editor instrumentation.
- Authored paragraph, link, and emphasis classes/styles survive page decoration;
  standard button decoration outside Freeform v2 continues to work.
- Empty or missing content is safe to render.
- The local examples work at mobile, tablet, and desktop widths.
- In an authenticated Universal Editor session, paste HTML, save, reopen, edit
  surrounding text, and save again; verify unsupported markup survives. Preview
  the CMS page and inspect its `.plain.html` response as a separate pipeline check.

The local fixture validates rendering, not the hosted editor's save/reopen
behavior or the AEM publishing pipeline. Create and preview equivalent CMS
content to complete those checks.

Local verification passed: `npm run build:json`, `npm run lint`, `npm test`
(15 importer routes), and browser checks at 375, 768, and 1440 pixels. The
sample has no console errors or horizontal overflow at those widths. Its
shared footer is hidden because the existing footer fixture's oversized logo
causes unrelated page overflow. Block checks cover DOM node preservation,
rich-text filter instrumentation, native disclosure interaction, SVG, custom
elements, literal code, and empty content. Existing generated definitions,
models, and filters were also compared with the previous versions and remain
unchanged apart from the v2 additions.
