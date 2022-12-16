import { decorateIcons } from '../../scripts/scripts.js';

function openPopup(e) {
  const target = e.target.closest('button');
  const href = target.getAttribute('data-href');
  const type = target.getAttribute('data-type');
  window.open(href, type, 'popup,top=233,left=233,width=700,height=467');
}

function setupClick(btn, type) {
  const url = encodeURIComponent(window.location.href);
  const h1 = document.querySelector('h1');
  const title = h1 ? encodeURIComponent(h1.textContent) : '';
  switch (type) {
    case 'facebook':
      btn.setAttribute('data-href', `https://www.facebook.com/sharer/sharer.php?u=${url}`);
      btn.addEventListener('click', openPopup);
      break;
    case 'twitter':
      btn.setAttribute('data-href', `https://www.twitter.com/share?&url=${url}&text=${title}`);
      btn.addEventListener('click', openPopup);
      break;
    case 'email':
      btn.addEventListener('click', () => {
        window.open(`mailto:?subject=${title}&body=${title} ${url}`);
      });
      break;
    default:
      break;
  }
}

export default function decorate(block) {
  block.innerHTML = '<p>Share On</p><div class="button-container"></div>';
  const socials = ['facebook', 'twitter', 'email'];
  socials.forEach((social) => {
    const btn = document.createElement('button');
    btn.className = `button share-${social}`;
    btn.innerHTML = `<span class="icon icon-${social}"></span>`;
    btn.title = `Share on ${social.charAt(0).toUpperCase() + social.slice(1)}`;
    btn.setAttribute('data-type', social);
    setupClick(btn, social);
    block.querySelector('.button-container').append(btn);
  });
  decorateIcons(block);
}
