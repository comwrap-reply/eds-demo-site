# Freeform

Freeform has an **Edit HTML** button on the AEM author page. No separately
installed Adobe extension is required.

1. Add **Freeform** to a section in Universal Editor.
2. Switch Universal Editor to **Preview** to interact with the page controls.
3. Click **Edit HTML**, paste your HTML, and click **Save**.
4. Reopen **Edit HTML** whenever you want to change the source.

The editor preserves wrappers, `class`, `id`, `style`, ARIA and data attributes,
CSS, JavaScript, entities, and Unicode. Clearing the editor and saving renders
an empty block. Cancel discards the current edits. Controls also work when
opening the instrumented page directly on the AEM author host.

Use this editor instead of pasting into the standard Universal Editor textarea,
which normalizes HTML before saving. The underlying `text` model field is hidden
and read-only so encoded storage is not shown as an editable form field.

```html
<style>
  .freeform .custom-message { padding: 1rem; background: #eef7fb; }
</style>
<div class="custom-message">
  <button type="button">Say hello</button>
  <p role="status"></p>
</div>
<script>
(() => {
  const block = document.currentScript.closest('.freeform');
  block.querySelector('button').addEventListener('click', () => {
    block.querySelector('[role="status"]').textContent = 'Hello!';
  });
})();
</script>
```

Use a fragment, rather than a full document with `<html>`, `<head>`, or `<body>`.
CSS and JavaScript execute in the page, including the editor. Scope selectors to the snippet and use an IIFE for
classic scripts to avoid variable collisions between instances. JavaScript
should initialize immediately: page loading events may have already fired when
a block loads. Editor updates rerun the snippet; clean up any document/window
listeners or timers your snippet installs.

External scripts retain their attributes. Classic scripts without `async` are
activated in order, including waiting for external dependencies; an external
failure allows subsequent scripts to proceed. Modules and asynchronous scripts
execute asynchronously, following browser behavior.
Authored code remains subject to the site's Content Security Policy.

## Content contract

One row with one cell containing `text`. New saves use `freeform-html-v2=` followed by
Base64-encoded UTF-8 source. Encoding prevents AEM's rich-text processing from
interpreting the HTML. The marker has no colons because AEM expands `:v1:` into an
icon. Existing `freeform:v1:` saves are still supported, including delivered markup
with an `icon-v1` span in place of `:v1:`. They migrate when next saved.
The renderer decodes exactly once and retains support for
legacy plain-text snippets, including `<br>`/paragraph source line breaks.
Previously stripped markup cannot be recovered: paste the original once through
**Edit HTML**. Corrupt encoded content is not executed.

The block retains its Universal Editor instrumentation. Its transient toolbar is
a sibling of the block, so authored scripts only find their own content. Public
pages without author instrumentation do not load the editor module or controls.

## Saving on AEM

The editor requires an AEM system connection whose origin matches the current
page, an existing Freeform resource, and the signed-in author's write permissions.
It reads the resource's JSON, requests a fresh Granite CSRF token, and uses Sling
POST to save the encoded `text` property and modification metadata. It reads the
property back before reporting success. No credentials or service tokens are
stored in the repository. The editor does not save through a cross-origin EDS
preview URL or a local AEM CLI proxy.

Changes detected since opening the editor are rejected with the current input
retained. This preflight check is not an atomic repository lock; simultaneous
saves can still race. Failed requests leave the editor open with the HTML intact.

These saves are outside Universal Editor's undo history. Use **Edit HTML** again
to revise the source, and use the normal AEM preview/publish process to deliver
the page. Do not roll back the decoder while pages contain encoded source.

## Local validation

Start the AEM CLI with `--html-folder drafts` and open `/drafts/freeform`.
The fixture covers the services card with encoded HTML, mixed legacy HTML/CSS/JS,
entities, line comments, `<br>` line breaks,
multiple instances, an empty cell, and a missing cell. Check the demo button and
confirm there is no horizontal overflow at mobile, tablet, and desktop widths.
Also verify ordered external scripts, modules, non-executable script data, and
replacement of an existing block during editor updates.

Run `npm run test:freeform` for codec and save-flow regression tests. Run
`npm run test:freeform:browser` and open
`http://localhost:3002/test/freeform/editor.html` to exercise the actual dialog
against a local HTTP fixture. This fixture simulates AEM storage and CSRF; it
does not establish compatibility with a particular AEM deployment.
The fixture also simulates AEM's icon expansion on reload. Open
`http://localhost:3002/test/freeform/reload.html` to run browser regressions against
the captured AEM-delivered v1 markup, including icon decoration and empty content.

Before rollout, verify the signed-in author's JSON and Sling POST permissions,
the button in Universal Editor Preview, a save/reopen/reload cycle with the
original services card, page modification status, and EDS preview/publish output
on the authored `/content/eds-demo-site/freeform` page.
