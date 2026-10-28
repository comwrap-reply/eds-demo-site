# Content Fragment block

The `content-fragment` block renders an **EDS Content Card** Content Fragment. Authors select a fragment and one of its existing variations using Universal Editor's native picker.

## Authoring

1. Add **Content Fragment** to a section.
2. Choose **Energy Solutions** from `/content/dam/eds-demo-site/content-fragments`.
3. Select **Main**, **Residential**, or **Commercial** in the variation picker. Main is AEM's `master` content.
4. Edit shared content and create additional variations in the Content Fragment editor.

The reference is the first block row. `contentFragmentVariation` is a hidden text field in the model and supplies the second row. Both the picker's `variationName` and the hidden field must use exactly this property name; otherwise the selection can be saved in AEM without reaching the EDS block.

The block keeps its `data-aue-*` attributes so the properties rail and variation selector remain usable after decoration. Content is rendered as a card with an h2, plain text body and optional CTA. Missing optional fields create no empty elements. A blank variation uses master; when GraphQL falls back to master for a missing variation, the block records the actual returned variation.

## AEM setup created for this demo

- Configuration: `/conf/eds-demo-site`; Content Fragment Models and GraphQL Persisted Queries enabled.
- Model: `/conf/eds-demo-site/settings/dam/cfm/models/eds-content-card` (enabled).
- Fields: required `heading` (text), optional `body` (long text, plain text), `link` and `linkText` (text).
- Fragment: `/content/dam/eds-demo-site/content-fragments/energy-solutions`.
- Fragment UUID: `d9c6d5cf-a12f-4c22-a491-23148e1b5086`.
- Variations: master, residential, commercial, each with different headings, copy and CTA destinations.
- GraphQL endpoint: `/content/cq:graphql/eds-demo-site/endpoint`.
- Persisted query: `/graphql/execute.json/eds-demo-site/content-card-by-path`.
- Query source: [content-card-by-path.graphql](content-fragment/content-card-by-path.graphql).
- Author test page: `/content/eds-demo-site/test`.

The query has been executed on author with the residential variation and returns the expected fields. It is saved on author. Publication to the Publish tier has not been approved.

## Delivery

`blocks/content-fragment/config.js` defines the author origin, publish origin and query path. The block uses same-origin author requests while editing in AEM and anonymous requests to the publish origin on EDS. Requests encode the fragment path and variation; there is no random cache-busting parameter and no credential stored in source code. The query is specific to the EDS Content Card model; selecting another model shows the unavailable state.

Before public EDS delivery, publish the dedicated model, GraphQL endpoint, persisted query and demo fragment, then verify the query on Publish. Configure Publish CORS for the actual EDS origins (and localhost for development if required). `head.html` permits connections to the specific demo Publish origin. This repository does not contain the AEM dispatcher/OSGi configuration, so any required Publish CORS/dispatcher changes belong in the AEM project. Do not open arbitrary origins or expose the author service to anonymous visitors.

Example persisted-query request:

```text
/graphql/execute.json/eds-demo-site/content-card-by-path;path=%2Fcontent%2Fdam%2Feds-demo-site%2Fcontent-fragments%2Fenergy-solutions;variation=residential
```

This implementation loads content client-side, following Adobe's reference CF block. For content that must appear in the initial HTML for SEO, use the Content Fragment overlay/json2html delivery approach separately.

## Validation

```sh
npm run build:json
npm run lint
npm test
npx -y @adobe/aem-cli up --port 3001 --html-folder drafts --no-open
```

Open `http://localhost:3001/drafts/tmp/content-fragment-test`. This browser harness uses fixtures matching the real AEM fragment and exercises the production block module, including all variations, master fallback, missing fields, errors, URL encoding and untrusted content. It clearly labels itself as fixture-based validation; it does not prove publication or CORS. The native author-side test is separate.

`drafts/tmp/` and `test/` are excluded from Edge Delivery serving. The browser harness is also useful for checking 375px, 768px and 1200px layouts.

## References

- [Universal Editor content fragment field](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types#content-fragment)
- [Adobe Content Fragment Block example](https://github.com/adobe-rnd/aem-boilerplate-xwalk/pull/76)
- [Content fragment overlay](https://www.aem.live/developer/content-fragment-overlay)
