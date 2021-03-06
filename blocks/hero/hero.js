import { decorateBlock, loadBlock } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const video = block.querySelector('.video');
  if (video) {
    block.classList.add('hero-video');
    video.classList.add(`${video.className}-hero`);
    decorateBlock(video);
    await loadBlock(video);
  }
}
