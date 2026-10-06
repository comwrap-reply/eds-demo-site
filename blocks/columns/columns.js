import decorateColumnsV1 from '../../layout-v1/columns-v1.js';

export default async function decorate(block) {
  if (block.classList.contains('layout-v3-native')) {
    const { default: decorateNativeV3 } = await import('../../layout-v3/native-v3.js');
    decorateNativeV3(block);
    return;
  }
  await decorateColumnsV1(block);
}
