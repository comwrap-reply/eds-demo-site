import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const section = await read('authoring/section.json');
const placement = await read('authoring/placement.json');
const blocks = await Promise.all(['global-title', 'global-text', 'global-image', 'teaser']
  .map((name) => read(`blocks/${name}/_${name}.json`)));
blocks.forEach((block) => block.models.forEach((model) => model.fields.push(...placement.fields)));
const files = {
  'component-definition.json': {
    groups: [{ title: 'Layouts', id: 'global-section-layouts', components: section.definitions },
      { title: 'Blocks', id: 'global-section-blocks', components: blocks.flatMap((block) => block.definitions) }],
  },
  'component-models.json': [section, ...blocks].flatMap((item) => item.models),
  'component-filters.json': section.filters,
};
await Promise.all(Object.entries(files).map(([file, data]) => writeFile(new URL(`authoring/${file}`, root), `${JSON.stringify(data, null, 2)}\n`)));
