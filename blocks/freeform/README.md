# Freeform

Freeform mirrors the Southern Global component's single **Text Entry** field.
In Universal Editor, add **Freeform** to a section and paste an HTML fragment
into the properties panel. Include CSS in `<style>` tags and JavaScript in
`<script>` tags. Leave the field empty to render no content.

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
Start mixed snippets with `<style>` or a wrapping `<div>` so AEM does not infer
rich text from a leading paragraph or heading. CSS and JavaScript execute in the
page, including the editor. Scope selectors to the snippet and use an IIFE for
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

One row with one cell containing escaped plain-text source (`text`). The decorator
decodes it once, preserves literal newlines and rendered `<br>`/paragraph breaks,
inserts the fragment, then activates its scripts. The block element retains its
Universal Editor instrumentation. Empty instrumented blocks have a small outline
so authors can select them.

## Local validation

Start the AEM CLI with `--html-folder drafts` and open `/drafts/freeform`.
The fixture covers mixed HTML/CSS/JS, entities, line comments, `<br>` line breaks,
multiple instances, an empty cell, and a missing cell. Check the demo button and
confirm there is no horizontal overflow at mobile, tablet, and desktop widths.
Also verify ordered external scripts, modules, non-executable script data, and
replacement of an existing block during editor updates.

The CMS rendering and Universal Editor save/preview round trip must also be
checked against an authored page when deploying the component.
