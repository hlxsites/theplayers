import { readBlockConfig, toClassName } from '../../scripts/scripts.js';

function filterNews(e) {
  const button = e.target.closest('button');
  const block = button.closest('.block');
  const feed = block.querySelector('ul');
  const filter = button.getAttribute('data-filter');
  // update button
  const buttons = block.querySelectorAll('.news .button-container > button');
  buttons.forEach((btn) => btn.setAttribute('aria-selected', false));
  button.setAttribute('aria-selected', true);
  // reset feed height
  feed.style.removeProperty('height');
  // filter items
  const items = block.querySelectorAll('.news .news-item');
  items.forEach((item) => item.classList.remove('news-filtered'));
  if (filter.includes('article')) {
    items.forEach((item) => {
      const itemType = [...item.classList][1];
      if (!itemType.includes('article')) item.classList.add('news-filtered');
    });
  } else if (filter.includes('video')) {
    items.forEach((item) => {
      const itemType = [...item.classList][1];
      if (!itemType.includes('video')) item.classList.add('news-filtered');
    });
  }
}

function toggleShowLessButton(feed) {
  const block = feed.closest('.block');
  const lessButton = block.querySelector('button[data-show="less"]');
  const feedHeight = feed.offsetHeight;
  const rowHeight = 311; /* match .news-item height + gap */
  if (feedHeight > rowHeight) {
    lessButton.disabled = false;
  } else {
    lessButton.disabled = true;
  }
}

function paginateNews(e) {
  const button = e.target.closest('button');
  const block = button.closest('.block');
  const feed = block.querySelector('ul');
  const type = button.getAttribute('data-show');
  const feedHeight = feed.offsetHeight;
  const rowHeight = 311; /* match .news-item height + gap */
  if (type === 'more') {
    feed.style.height = `${feedHeight + rowHeight}px`;
  } else if (type === 'less' && (feedHeight > rowHeight)) {
    feed.style.height = `${feedHeight - rowHeight}px`;
  }
  toggleShowLessButton(feed);
}

export default async function decorate(block) {
  const videoPrefix = 'https://pga-tour-res.cloudinary.com/image/upload/c_fill,f_auto,g_face,h_311,q_auto,w_425/v1/';
  const damPrefix = 'https://www.pgatour.com';
  const config = readBlockConfig(block);
  const newsURL = config.source;
  const limit = config.limit || 8;
  block.textContent = '';
  // populate news content
  /* TODO: add CORS header, to be replaced with direct API */
  let directURL;
  if (config.tags) {
    directURL = `${newsURL}/tags=${config.tags.replace(/ /g, '')}&size=${limit}`;
  } else {
    directURL = `${newsURL}/lang=LANG_NOT_DEFINED&path=/content&tags=PGATOUR:Tournaments/2018/r011+PGATOUR:Tournaments/2020/r011+PGATOUR:Tournaments/2019/r011+PGATOUR:Tournaments/2021/r011+PGATOUR:Tournaments/2022/r011&size=${limit}`;
  }
  const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(directURL)}`);
  const json = await resp.json();
  const ul = document.createElement('ul');
  json.items.forEach((item) => {
    const prefix = item.image.startsWith('brightcove') ? videoPrefix : damPrefix;
    const li = document.createElement('li');
    li.classList.add('news-item', `news-item-${item.type}`);
    const video = item.videoId ? '<div class="news-item-play"></div>' : '';
    const a = document.createElement('a');
    a.href = item.link;
    a.innerHTML = `
      <div class="news-item-image"><img src="${prefix}${item.image}"></div>
      <div class="news-item-body"><a href="${item.link}">${item.title}</a></div>
      ${video}
    `;
    li.append(a);
    ul.append(li);
  });
  block.append(ul);
  // add filtering
  if (config.filter) {
    const filters = config.filter.split(',').map((f) => f.trim());
    const container = document.createElement('div');
    container.classList.add('button-container', 'news-filters');
    filters.forEach((filter, i) => {
      const button = document.createElement('button');
      button.textContent = filter;
      button.setAttribute('aria-selected', !i); // first filter is default view
      button.setAttribute('role', 'tab');
      button.setAttribute('data-filter', toClassName(filter));
      button.addEventListener('click', filterNews);
      container.append(button);
    });
    block.prepend(container);
  }
  // add show more/less buttons
  if (limit > 8) {
    const container = document.createElement('div');
    container.classList.add('button-container', 'news-pagination');
    const types = ['More', 'Less'];
    types.forEach((type) => {
      const button = document.createElement('button');
      button.textContent = `Show ${type}`;
      button.setAttribute('data-show', type.toLowerCase());
      button.addEventListener('click', paginateNews);
      container.append(button);
    });
    block.append(container);
  }
}
