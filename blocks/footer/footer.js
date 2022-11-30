import {
  readBlockConfig,
  wrapImgsInLinks,
  decorateIcons,
  decorateLinkedPictures,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
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
