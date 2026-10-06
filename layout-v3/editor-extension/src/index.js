/* Layouts - V3: separately registered UE extension; never loaded by the public site. */
import { register, attach } from '@adobe/uix-guest';
import mountPanel from './panel.js';

const id = 'comwrap.eds.layouts-v3';
const root = document.getElementById('layouts-v3-panel');

async function init() {
  if (window.location.hash === '#/columns') {
    const connection = await attach({ id });
    await mountPanel(root, connection.host);
  } else {
    await register({
      id,
      methods: {
        rightPanel: {
          addRails: () => [{
            id: `${id}.columns`,
            header: 'Layouts - V3',
            url: new URL('index.html#/columns', window.location.href).href,
            icon: 'ColumnTwoA',
          }],
        },
      },
    });
    root.textContent = 'Layouts - V3 registered.';
  }
}

init().catch(() => {
  root.textContent = 'Unable to connect. Open this registered extension from Universal Editor.';
});
