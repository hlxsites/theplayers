import {
  readBlockConfig,
  wrapImgsInLinks,
  decorateIcons,
  decorateLinkedPictures,
} from '../../scripts/scripts.js';

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

function decorateNav(navLists, privacyLinks, container) {
  const nav = document.createElement('nav');
  const ul = document.createElement('ul');
  ul.classList.add('nav-list');

  navLists.forEach((navList) => {
    const parent = navList.closest('div');
    const navHeader = parent.querySelector('h3').innerText;

    const li = document.createElement('li');
    li.classList.add('nav-heading');
    li.addEventListener('click', () => {
      li.classList.toggle('active');
    });
    li.prepend(navHeader);
    ul.append(li);

    const subUl = document.createElement('ul');
    subUl.classList.add('nav-sublist');
    li.append(subUl);

    navList.querySelectorAll('li').forEach((item) => {
      const subLi = document.createElement('li');
      subLi.classList.add('nav-item');
      const a = document.createElement('a');
      subLi.append(a);
      a.href = item.querySelector('a').href;
      a.innerText = item.querySelector('a').innerText;
      const linkImg = item.querySelector('img');
      if (linkImg) {
        a.prepend(linkImg);
      }
      subUl.append(subLi);
    });
  });

  const privacyLi = document.createElement('li');
  privacyLi.classList.add('nav-heading', 'nav-privacy');
  privacyLi.prepend('Privacy & Use');
  privacyLi.addEventListener('click', () => {
    privacyLi.classList.toggle('active');
  });
  ul.append(privacyLi);

  const privacySubUl = document.createElement('ul');
  privacySubUl.classList.add('nav-sublist');
  privacyLi.append(privacySubUl);

  privacyLinks.forEach((link) => {
    const subLi = document.createElement('li');
    subLi.classList.add('nav-item');
    const a = document.createElement('a');
    subLi.append(a);
    a.href = link.href;
    a.innerText = link.innerText;
    privacySubUl.append(subLi);
  });

  nav.append(ul);

  container.append(nav);
}

function decoratePrivacyLinks(privacyLinks, container) {
  const div = document.createElement('div');
  div.classList.add('privacy-links');

  privacyLinks.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.innerText = link.innerText;
    div.append(a);
  });

  container.append(div);
}

function decorateSocialLinks(socialLinks, copyRightText, container) {
  const div = document.createElement('div');
  div.classList.add('social-links');

  const copyright = document.createElement('p');
  copyright.classList.add('copyright');
  copyright.innerText = copyRightText.innerText;
  div.append(copyright);

  const socialContainer = document.createElement('div');
  socialContainer.classList.add('social-container');

  socialLinks.forEach((socialLink) => {
    socialContainer.append(socialLink);
  });

  div.append(socialContainer);
  container.append(div);
}

function decorateLegal(trademarksText, container) {
  const legal = document.createElement('p');
  legal.classList.add('legal');
  legal.innerText = trademarksText.innerText;
  container.append(legal);
}

export default async function decorate(block) {
  const container = document.createElement('div');
  container.classList.add('footer-container');

  const logo = block.querySelector('a > img');
  const navLists = block.querySelectorAll('nav h3 + ul');
  const trademarksText = block.querySelector(':scope > p');
  const copyRightText = block.querySelector(':scope > div > p');
  const socialLinks = copyRightText.closest('div').querySelectorAll('a');
  const privacyLinks = block.querySelectorAll(':scope > div > a');

  decorateLogo(logo, container);
  decorateNav(navLists, privacyLinks, container);
  decoratePrivacyLinks(privacyLinks, container);
  decorateSocialLinks(socialLinks, copyRightText, container);
  decorateLegal(trademarksText, container);

  block.innerHTML = '';
  block.append(container);
  block.classList.add('appear');
}

export async function decorateOld(block) {
  const config = readBlockConfig(block);
  block.textContent = '';
  const footerPath = config.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    // delete empty divs
    footer.querySelectorAll('div').forEach((div) => {
      if (div.innerHTML === '') {
        div.remove();
      }
    });

    const footerDivs = footer.querySelectorAll('div');
    const footerGlobalContent = footerDivs[0];
    footerGlobalContent.classList.add('footer-global');
    const footerDontSell = footerDivs[1];
    footerDontSell.classList.add('footer-dont-sell');
    const subFooterGlobalContent = footerDivs[2];
    subFooterGlobalContent.classList.add('sub-footer-global');

    const isPgaTourDotCom = window.location.host === 'www.pgatour.com';
    const workerPrefix = 'https://little-forest-58aa.david8603.workers.dev/?url=';
    const footerUrl = footerGlobalContent.querySelector('a').href;
    footerGlobalContent.innerHTML = '';
    const subFooterUrl = subFooterGlobalContent.querySelector('a').href;
    subFooterGlobalContent.innerHTML = '';
    const footerFetchUrl = isPgaTourDotCom ? footerUrl : `${workerPrefix}${encodeURIComponent(footerUrl)}`;
    const subFooterFetchUrl = isPgaTourDotCom ? subFooterUrl : `${workerPrefix}${encodeURIComponent(subFooterUrl)}`;

    const footerPromise = fetch(footerFetchUrl);
    const subFooterPromise = fetch(subFooterFetchUrl);
    const footerResp = await footerPromise;
    if (footerResp.ok) {
      const syntheticFooter = document.createElement('div');
      const footerContentHtml = await footerResp.text();
      syntheticFooter.innerHTML = footerContentHtml;
      footerGlobalContent.append(syntheticFooter.querySelector('.footer-lists'));
    }

    const subFooterResp = await subFooterPromise;
    if (subFooterResp.ok) {
      const syntheticSubFooter = document.createElement('div');
      const subfooterContentHtml = await subFooterResp.text();
      syntheticSubFooter.innerHTML = subfooterContentHtml;

      const copyright = syntheticSubFooter.querySelector('.footer-copyright .container');
      copyright.classList.add('footer-copyright');
      const social = syntheticSubFooter.querySelector('.footer-social .container');
      social.classList.add('footer-social');
      subFooterGlobalContent.append(copyright);
      subFooterGlobalContent.append(social);
    }

    footer.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('/')) {
        // relative links make absolute
        a.href = `http://www.pgatour.com${href}`;
      }
    });

    footer.querySelector('.link-text.profile').style.display = 'none';
    // TODO deal with logged in vs. not
    // update the links to show/hide, add click handlers, etc.

    wrapImgsInLinks(footer);
    decorateIcons(footer);
    decorateLinkedPictures(footer);

    block.append(footer);
  }
}
