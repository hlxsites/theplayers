function decorateLogo(logo, container) {
  const logoDiv = document.createElement('div');
  logoDiv.classList.add('brand');

  const logoLink = logo.closest('a');
  const anchor = document.createElement('a');

  anchor.href = logoLink.href;
  const img = document.createElement('img');
  img.src = logo.src;
  img.setAttribute('alt', logo.getAttribute('alt'));

  anchor.append(img);
  logoDiv.append(anchor);
  container.append(logoDiv);
}

function decorateNav(navLinks, container) {
  const nav = document.createElement('nav');
  nav.classList.add('primary-navigation');

  const ul = document.createElement('ul');
  ul.classList.add('primary-navigation-list');

  navLinks.forEach((link) => {
    const li = document.createElement('li');
    li.append(link);
    ul.append(li);
  });

  nav.append(ul);

  container.append(nav);
}

function decorateUserActions(container) {
  const actions = document.createElement('div');
  actions.classList.add('user-actions');

  const tours = document.createElement('button');
  tours.classList.add('tours');
  tours.innerText = 'Tours';
  tours.addEventListener('click', () => {
    const expanded = tours.getAttribute('data-expanded') === 'true';
    tours.setAttribute('data-expanded', expanded ? 'false' : 'true');
  });
  actions.append(tours);

  const search = document.createElement('button');
  search.classList.add('search');
  search.addEventListener('click', () => {
    const expanded = search.getAttribute('data-expanded') === 'true';
    search.setAttribute('data-expanded', expanded ? 'false' : 'true');
  });
  actions.append(search);

  const hamburger = document.createElement('button');
  hamburger.classList.add('hamburger');
  // hamburger.setAttribute('aria-controls', 'primary-navigation');
  // hamburger.setAttribute('aria-expanded', 'false');

  const icon = document.createElement('div');
  icon.classList.add('hamburger-icon');
  hamburger.append(icon);
  hamburger.addEventListener('click', () => {
    const dialog = document.querySelector('#primary-navigation');
    dialog.show();
  });

  actions.append(hamburger);

  container.append(actions);
}

function buildNavDialog(navList, tourLinks) {
  const dialog = document.createElement('dialog');
  dialog.id = 'primary-navigation';
  dialog.classList.add('primary-navigation-dialog');

  const container = document.createElement('div');
  container.classList.add('dialog-container');
  dialog.append(container);

  const header = document.createElement('div');
  header.classList.add('dialog-header');
  container.append(header);

  const close = document.createElement('button');
  close.classList.add('close');
  close.addEventListener('click', () => {
    dialog.classList.add('hide');
    dialog.addEventListener('animationend', () => {
      if (dialog.classList.contains('hide')) {
        dialog.classList.remove('hide');
        dialog.close();
      }
    });
  });
  close.setAttribute('aria-label', 'Close');
  header.append(close);

  container.append(navList);

  return dialog;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const container = document.createElement('div');
  container.classList.add('header-container');

  const logo = block.querySelector('a > img');
  decorateLogo(logo, container);
  logo.closest('a').remove();
  const remainingNavLinks = block.querySelectorAll('a');

  const navLinks = [];
  let moreLink;
  const tourLinks = [];
  remainingNavLinks.forEach((link) => {
    const linkText = link.innerText;
    if (moreLink === undefined) {
      if (linkText.toLocaleLowerCase() === 'more') {
        moreLink = link;
      } else {
        navLinks.push(link);
      }
    } else {
      tourLinks.push(link);
    }
  });

  block.innerHTML = '';
  decorateNav(navLinks, container);
  decorateUserActions(container);
  block.appendChild(buildNavDialog(container.querySelector('.primary-navigation-list').cloneNode(true), tourLinks));

  block.append(container);
  block.classList.add('appear');
}
