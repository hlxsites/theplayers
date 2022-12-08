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

  const hamburger = document.createElement('button');
  hamburger.classList.add('hamburger');
  hamburger.setAttribute('aria-controls', 'primary-navigation');
  hamburger.setAttribute('aria-expanded', 'false');

  const icon = document.createElement('div');
  icon.classList.add('hamburger-icon');
  hamburger.append(icon);
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  nav.append(hamburger);

  const ul = document.createElement('ul');
  ul.setAttribute('id', 'primary-navigation');
  ul.classList.add('primary-navigation-list');

  navLinks.forEach((link) => {
    const li = document.createElement('li');
    li.append(link);
    ul.append(li);
  });

  nav.append(ul);

  container.append(nav);
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

  decorateNav(navLinks, container);

  block.innerHTML = '';
  block.append(container);
  block.classList.add('appear');
}
