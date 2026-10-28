# Content fragment block plan

- [x] Inspect the site and start the AEM development server.
- [x] Analyze authoring and delivery requirements using Adobe's CF block example.
- [x] Design the model: native fragment picker plus a hidden variation field; blank means master.
- [x] Create a real Content Card fragment with master, residential and commercial variations.
- [x] Implement a content-fragment block with a persisted GraphQL query, scoped responsive styling and graceful empty/error states.
- [x] Build model aggregates, run lint and tests, and validate rendering in the browser at 375px and 768px.
- [ ] Repeat desktop validation after the browser-control timeout.
- [ ] Verify the picker changes rendered copy on the AEM test page.
- [ ] Prepare the code and preview URL for review.

## Acceptance criteria

Authors can insert Content Fragment in a Section, choose a fragment and select its actual variations. The hidden `contentFragmentVariation` model field serializes that choice into the second row of the block. Master is the default. Rendering handles absent optional body/link fields, invalid references, unavailable content and long text. Links use safe URL schemes and plain text remains inert. The layout fits 375px, 768px and 1200px viewports. Existing unrelated editor work is preserved.

## Content contract

| Content Fragment |
| --- |
| Link to a Content Card fragment under /content/dam/eds-demo-site |
| Variation name, or master |

The AEM fragment model supplies `heading` (text), `body` (long text), `link` (text URL) and `linkText` (text). Test with different headings and bodies for master, residential and commercial.

Test target: /content/eds-demo-site/test (AEM author); /test (EDS preview).

Reference: https://github.com/adobe-rnd/aem-boilerplate-xwalk/pull/76

Three test blocks are persisted on the author test page. The native UI test and PR are blocked on GitHub write access. Publish deployment requires approval after automatic review rejected the query publication.
