import { lookupPages, createOptimizedPicture } from '../../scripts/scripts.js';

export default async function decorate(block) {
  block.textContent = '';
  const pages = await lookupPages();
  const sponsors = pages.filter((e) => e.path.startsWith('/sponsors'));
  sponsors.forEach((e) => {
    const partner = document.createElement('div');
    partner.className = 'partners-partner';
    partner.append(createOptimizedPicture(e.image, e.title, false, [{ width: '750' }]));
    block.append(partner);
  });
}
