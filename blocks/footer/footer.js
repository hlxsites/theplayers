export default async function decorate(block) {
  block.textContent = '';
  const isPgaTourDotCom = window.location.host === 'www.pgatour.com';
  const workerPrefix = 'https://little-forest-58aa.david8603.workers.dev/?url=';
  const footerUrl = 'https://www.pgatour.com/jcr:content/footerIParsys.html';
  const subFooterUrl = 'https://www.pgatour.com/jcr:content/subFooterIParsys.html';
  const footerFetchUrl = isPgaTourDotCom ? footerUrl : `${workerPrefix}${encodeURIComponent(footerUrl)}`;
  const subFooterFetchUrl = isPgaTourDotCom ? subFooterUrl : `${workerPrefix}${encodeURIComponent(subFooterUrl)}`;

  const footerResp = await fetch(footerFetchUrl);
  if (footerResp.ok) {
    const syntheticFooter = document.createElement('div');
    const html = await footerResp.text();
    syntheticFooter.innerHTML = html;
    block.append(syntheticFooter.querySelector('.footer-lists'));
  }

  const subFooterResp = await fetch(subFooterFetchUrl);
  if (subFooterResp.ok) {
    const syntheticSubFooter = document.createElement('div');
    const html = await subFooterResp.text();
    syntheticSubFooter.innerHTML = html;

    const copyright = syntheticSubFooter.querySelector('.footer-copyright .container');
    copyright.classList.add('footer-copyright');
    const social = syntheticSubFooter.querySelector('.footer-social .container');
    social.classList.add('footer-social');
    block.append(copyright);
    block.append(social);
  }

  block.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/')) {
      // relative links make absolute
      a.href = `http://www.pgatour.com${href}`;
    }
  });

  block.querySelector('.link-text.profile').style.display = 'none';
  // TODO deal with logged in vs. not
  // update the links to show/hide, add click handlers, etc.
}
