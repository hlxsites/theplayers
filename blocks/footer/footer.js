import {
  readBlockConfig,
  decorateIcons,
  decorateLinkedPictures,
  createOptimizedPicture,
  lookupPages,
  makeLinksRelative,
  wrapImgsInLinks,
} from '../../scripts/scripts.js';

function setupCookieChoices(section) {
  const cookieLink = section.querySelector('a[href*="onetrust-link"]');
  if (cookieLink) {
    cookieLink.removeAttribute('href');
    cookieLink.className = 'ot-sdk-show-settings';
    cookieLink.parentNode.className = 'onetrust-link';
  }
}

function setupSocialButtons(section) {
  section.querySelectorAll('p').forEach((button) => {
    const icon = [...button.querySelector('.icon').classList][1].replace('icon-', '');
    button.classList.add(`footer-social-${icon}`);
  });
}

async function setupPartners(section) {
  const pages = await lookupPages();
  const sponsors = pages.filter((e) => e.path.startsWith('/sponsors/'));

  const wrapper = document.createElement('div');
  sponsors.forEach((sponsor) => {
    const partner = document.createElement('div');
    partner.className = 'footer-partner';
    const link = document.createElement('a');
    link.href = sponsor.link;
    link.append(createOptimizedPicture(sponsor.image, sponsor.title, false, [{ width: '300' }]));
    partner.append(link);
    wrapper.append(partner);
  });
  section.append(wrapper);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = config.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;
    makeLinksRelative(footer);

    const classes = ['nav', 'links', 'social', 'copyright'];
    classes.forEach((c, i) => {
      const section = footer.children[i];
      if (section) section.classList.add(`footer-${c}`);
    });

    // setup ribbon
    const ribbon = document.createElement('div');
    ribbon.classList.add('footer', 'footer-ribbon');
    const wrapper = document.createElement('div');
    wrapper.append(footer.querySelector('.footer-nav'));
    ribbon.append(wrapper);

    setupCookieChoices(footer.querySelector('.footer-links'));
    setupSocialButtons(footer.querySelector('.footer-social'));

    block.append(footer);
    block.parentNode.prepend(ribbon);
    wrapImgsInLinks(block);
    decorateIcons(block);
    decorateLinkedPictures(block);

    // await setupPartners(ribbon.querySelector('.footer-partners'));
  }
}
