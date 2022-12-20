import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = row.innerHTML;
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else {
        div.className = 'cards-card-body';
        const bubble = div.querySelector('u');
        if (bubble) {
          bubble.className = 'cards-card-bubble';
          bubble.closest('p').className = 'cards-card-bubble-wrapper';
        }
        const subtitle = div.querySelector('h2 + p > strong');
        if (subtitle && subtitle.parentNode.textContent === subtitle.textContent) {
          const title = div.querySelector('h2');
          const titleWrapper = document.createElement('div');
          titleWrapper.className = 'cards-card-title';
          titleWrapper.append(title.cloneNode(true), subtitle.parentNode);
          title.replaceWith(titleWrapper);
        }
        const country = div.querySelector('.icon[class*=icon-flag-]');
        if (country) {
          country.closest('p').classList.add('cards-card-country');
          div.classList.add('cards-card-country-wrapper');
        }
        const list = div.querySelector('ul, ol');
        if (list) {
          const links = document.createElement('div');
          links.className = 'cards-card-links';
          links.append(list);
          div.after(links);
        }
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
