import {
  readBlockConfig,
  decorateIcons,
  wrapImgsInLinks,
  decorateLinkedPictures,
} from '../../scripts/scripts.js';

function showToursNav(nav, toursButton, toursNav) {
  toursButton.classList.add('active')
  toursNav.classList.add('expanded');
  nav.classList.remove('search-active');
}

function hideToursNav(nav, toursButton, toursNav) { 
  toursButton.classList.remove('active')
  toursNav.classList.remove('expanded');
  nav.classList.remove('search-active');
}

function showHideTours(nav, toursButton, toursNav) {
  const expanded = toursButton.classList.contains('active');
  if (expanded) {
    hideToursNav(nav, toursButton, toursNav);
  } else {
    showToursNav(nav, toursButton, toursNav);
  }
}

function hideNav(nav, subNav, hamburger, toursButton, search) {
  nav.setAttribute('aria-expanded', 'false');
  subNav.classList.remove('expanded');

  toursButton.style.display = 'block';
  search.style.display = 'block';
  nav.classList.remove('search-active');

  hamburger.classList.remove('active')
}

function showNav(nav, subNav, hamburger, toursButton, search) {
  nav.setAttribute('aria-expanded', 'true');
  subNav.classList.add('expanded');

  toursButton.style.display = 'none';
  search.style.display = 'none';
  nav.classList.remove('search-active');

  hamburger.classList.add('active');
}

function showHideNav(nav, subNav, hamburger, toursButton, toursNav, search) {
  hideToursNav(nav, toursButton, toursNav);

  const expanded = hamburger.classList.contains('active');
  if (expanded) {
    hideNav(nav, subNav, hamburger, toursButton, search);
  } else {
    showNav(nav, subNav, hamburger, toursButton, search);
  }
}

function submitSearch(searchText) {
  const query = searchText.value;
  window.location = `https://www.pgatour.com/search.html?query=${encodeURIComponent(query)}`;
}

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

    // delete empty divs
    nav.querySelectorAll('div').forEach((div) => {
      if (div.innerHTML === '') {
        div.remove();
      }
    });

    // decorate picture
    nav.querySelector('div').classList.add('nav-brand');

    const isPgaTourDotCom = window.location.host === 'www.pgatour.com';
    const workerPrefix = 'https://little-forest-58aa.david8603.workers.dev/?url=';
    const headerUrl = 'https://www.pgatour.com/jcr:content/headerIParsys.html';
    const headerFetchUrl = isPgaTourDotCom ? headerUrl : `${workerPrefix}${encodeURIComponent(headerUrl)}`;
    const headerResp = await fetch(headerFetchUrl);
    if (headerResp.ok) {
      const syntheticHeader = document.createElement('div');
      const html = await headerResp.text();
      syntheticHeader.innerHTML = html;

      // spacer div
      const spacer1 = document.createElement('div');
      spacer1.classList.add('spacer');
      nav.append(spacer1);

      // nav links
      const navSections = document.createElement('div');
      navSections.classList.add('nav-sections');
      navSections.append(syntheticHeader.querySelector('.nav'));
      nav.append(navSections);

      // tours dropdown
      nav.append(syntheticHeader.querySelector('.other-tours-dropdown'));
      const toursNav = nav.querySelector('.other-tours-dropdown .header-tours-nav');
      // nav.append(toursNav);

      const toursButton = nav.querySelector('.other-tours-dropdown .other-tours');
      toursButton.addEventListener('click', (e) => {
        e.preventDefault();
        showHideTours(nav, toursButton, toursNav)
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
      searchText.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitSearch(searchText);
        }
      });
      searchText.placeholder = 'Search...';
      searchForm.append(searchText);

      const submit = document.createElement('span');
      submit.addEventListener('click', (e) => {
        e.preventDefault();
        submitSearch(searchText);
      });
      submit.classList.add('submit');
      searchForm.append(submit);
      
      search.append(searchForm);
      nav.append(search);
      

      // super nav dropdown
      nav.append(syntheticHeader.querySelector('.fatNavigation2 .header-subnav'));
      const subNav = nav.querySelector('.header-subnav');
      subNav.querySelectorAll('.drillDownMenu > li').forEach((listItem) => {
        const ul = listItem.querySelector('ul');
        if (ul) {
          listItem.classList.add('hasSubs');
          let prevText = '';
          listItem.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            if (prevText === '') {
              prevText = e.target.innerText;
              e.target.innerText = 'back';
            } else {
              e.target.innerText = prevText;
              prevText = '';
            }
          
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
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        showHideNav(nav, subNav, hamburger, toursButton, toursNav, search);
      });
      nav.prepend(hamburger);
      nav.setAttribute('aria-expanded', 'false');

      // leaderboard

      // login

      // watch now links
      nav.querySelectorAll('.watch-button').forEach((watchButton) => {
        // TODO
        watchButton.querySelectorAll('.live-label').forEach(lbl => lbl.remove());
      });

      // more links
      const dropDown = nav.querySelector('.nav .dropdown');
      const more = document.createElement('a');
      more.href = "#";
      more.innerText = 'MORE';
      more.addEventListener('click', (e) => {
        e.preventDefault();
        dropDown.classList.toggle('active');
      });

      dropDown.prepend(more);
      const dropDownMenu = dropDown.querySelector('.dropdown-menu');
      dropDown.querySelector('.dropdown-toggle').remove();
      nav.querySelectorAll('.nav-sections .nav li').forEach((li, idx) => {
        if (idx > 7) {
          if (!li.classList.contains('dropdown')) {
            dropDownMenu.append(li.cloneNode(true));
            li.classList.add('in-more');
          }
        }
      });
    }

    wrapImgsInLinks(nav);
    decorateIcons(nav);
    decorateLinkedPictures(nav);

    block.append(nav);
    block.classList.add('appear');
  }
}
