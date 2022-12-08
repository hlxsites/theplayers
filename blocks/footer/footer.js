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
  ul.classList.add('nav-lists');

  navLists.forEach((navList) => {
    const parent = navList.closest('div');
    const navHeader = parent.querySelector('h3').innerText;

    const li = document.createElement('li');
    li.classList.add('nav-list');
    li.addEventListener('click', () => {
      li.classList.toggle('active');
    });

    const span = document.createElement('span');
    span.classList.add('nav-list-heading');
    span.textContent = navHeader;
    li.prepend(span);
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
  privacyLi.classList.add('nav-list', 'nav-privacy');
  const span = document.createElement('span');
  span.classList.add('nav-list-heading');
  span.textContent = 'Privacy & Use';
  privacyLi.prepend(span);
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
  legal.innerHTML = trademarksText.innerHTML;
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
  // decoratePrivacyLinks(privacyLinks, container);
  decorateSocialLinks(socialLinks, copyRightText, container);
  decorateLegal(trademarksText, container);

  block.innerHTML = '';
  block.append(container);
  block.classList.add('appear');
}
