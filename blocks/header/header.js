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
      nav.append(toursNav);

      const toursButton = nav.querySelector('.other-tours-dropdown .other-tours');
      toursButton.addEventListener('click', () => {
        const expanded = toursButton.classList.contains('active');
        toursNav.classList.toggle('expanded');
        nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        document.body.style.overflowY = expanded ? '' : 'hidden';
        nav.classList.remove('search-active');
        toursButton.classList.toggle('active')
      });

      // search
      const search = document.createElement('div');
      search.classList.add('nav-search')

      const searchForm = document.createElement('div');
      const searchButton = document.createElement('span');
      searchButton.classList.add('search-icon');
      searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        nav.classList.toggle('search-active');
      });
      search.append(searchButton);

      
      searchForm.classList.add('search-form');
      const searchText = document.createElement('input');
      searchText.placeholder = 'Search...';
      searchForm.append(searchText);
      
      nav.append(search);
      nav.append(searchForm);

      // super nav dropdown
      nav.append(syntheticHeader.querySelector('.fatNavigation2 .header-subnav'));
      const subNav = nav.querySelector('.header-subnav');
      subNav.querySelectorAll('.drillDownMenu > li').forEach((listItem) => {
        const ul = listItem.querySelector('ul');
        if (ul) {
          listItem.classList.add('hasSubs');
          let prevText = '';
          listItem.querySelector('a').addEventListener('click', (e) => {
            if (prevText === '') {
              prevText = e.target.innerText;
              e.target.innerText = 'back';
            } else {
              e.target.innerText = prevText;
              prevText = '';
            }
            
            e.preventDefault();
            ul.classList.toggle('active');
            listItem.classList.toggle('active');
            listItem.closest('ul').classList.toggle('sub-active');
          });
        }
      });

      // hamburger
      const hamburger = document.createElement('div');
      hamburger.classList.add('nav-hamburger');
      hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
      hamburger.addEventListener('click', () => {
        const expanded = hamburger.classList.contains('active');
        const toursExpanded = toursButton.classList.contains('active');
        if(toursExpanded) {
          toursNav.classList.toggle('expanded');
          toursButton.classList.toggle('active')
        }

        nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        document.body.style.overflowY = expanded ? '' : 'hidden';
        subNav.classList.toggle('expanded');
        toursButton.style.display = expanded ? 'block' : 'none';
        search.style.display = expanded ? 'block' : 'none';

        hamburger.classList.toggle('active')
        nav.classList.remove('search-active');
      });
      nav.prepend(hamburger);
      nav.setAttribute('aria-expanded', 'false');

      // leaderboard

      // nav links
      // nav.append(syntheticHeader.querySelector('.nav'));

      // login

      // watch now links

    }

    wrapImgsInLinks(nav);
    decorateIcons(nav);
    decorateLinkedPictures(nav);

    block.append(nav);
    block.classList.add('appear');
  }
}
