# OnlyFNG AEM Form Service Contract

The EDS `form` block posts `multipart/form-data` to the configured AEM Publish origin. Set the `form-api` page metadata to that origin; omit it only when the endpoint is served from the EDS site origin.

## Endpoints

- `POST /bin/fng/forms/quote`
- `POST /bin/fng/forms/paperless`
- `POST /bin/fng/forms/market-reports`

Each endpoint returns JSON with a human-readable `message`. Return a 2xx status for accepted submissions and 4xx/5xx with `message` for client-visible errors. The Quote endpoint accepts the `quote upload` file field; enforce the extension and maximum-size rules server-side.

## Required server controls

- Allow only the approved EDS preview and live origins with CORS.
- Reject the `website` honeypot field, malformed payloads, oversize uploads, and unsupported file types.
- Apply IP and form-type rate limits before CRM delivery.
- Store CRM credentials and recipient configuration only in AEM-managed secrets/configuration.
- Preserve the source CRM field names emitted by the EDS block, including the hidden lead-source fields.
