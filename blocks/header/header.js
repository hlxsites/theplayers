import {
  readBlockConfig,
  fetchPlaceholders,
  decorateIcons,
  lookupPages,
  createOptimizedPicture,
  wrapImgsInLinks,
  decorateLinkedPictures,
} from '../../scripts/scripts.js';

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';
  const navPath = config.nav || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.innerHTML = html;

    const isPgaTourDotCom = window.location.host === 'www.pgatour.com';
    const workerPrefix = 'https://little-forest-58aa.david8603.workers.dev/?url=';
    const headerUrl = 'https://www.pgatour.com/jcr:content/headerIParsys.html';
    const headerFetchUrl = isPgaTourDotCom ? headerUrl : `${workerPrefix}${encodeURIComponent(headerUrl)}`;
    const headerResp = await fetch(headerFetchUrl);
    if (headerResp.ok) {
      const syntheticHeader = document.createElement('div');
      const html = await headerResp.text();
      syntheticHeader.innerHTML = html;

      // decorate picture
      nav.querySelector('div').classList.add('nav-brand');

      // tours dropdown
      nav.append(syntheticHeader.querySelector('.other-tours-dropdown'));
      const toursNav = nav.querySelector('.other-tours-dropdown .header-tours-nav');
      toursNav.style.display = 'none';
      nav.append(toursNav);

      const toursButton = nav.querySelector('.other-tours-dropdown .other-tours');
      toursButton.addEventListener('click', () => {
        const expanded = nav.getAttribute('aria-expanded') === 'true';
        toursNav.style.display = expanded ? 'none' : 'block';
        nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        toursButton.classList.toggle('active')
      });

      const arrow = document.createElement('div');
      arrow.innerText = '>';
      arrow.classList.add('arrow')
      toursButton.appendChild(arrow);

      // search
      const search = syntheticHeader.querySelector('.nav-search');
      nav.append(search);

      // super nav dropdown
      nav.append(syntheticHeader.querySelector('.fatNavigation2 .header-subnav'));
      const subNav = nav.querySelector('.header-subnav');
      subNav.style.display = 'none';

      // nav links
      // nav.append(syntheticHeader.querySelector('.nav'));

      // login

      // hamburger
      const hamburger = document.createElement('div');
      hamburger.classList.add('nav-hamburger');
      hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
      hamburger.addEventListener('click', () => {
        const expanded = nav.getAttribute('aria-expanded') === 'true';
        nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        subNav.style.display = expanded ? 'none' : 'block';
        toursButton.style.display = expanded ? 'block' : 'none';
        search.style.display = expanded ? 'block' : 'none';
      });
      nav.prepend(hamburger);
      nav.setAttribute('aria-expanded', 'false');

      // leaderboard

    }

    wrapImgsInLinks(nav);
    decorateIcons(nav);
    decorateLinkedPictures(nav);

    block.append(nav);
    block.classList.add('appear');
  }
}
