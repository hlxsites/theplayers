import {
  makeLinksRelative,
  readBlockConfig,
  toClassName,
  updateExternalLinks,
  fetchPlaceholders,
  fetchGraphQL,
} from '../../scripts/scripts.js';

function filterHasItems(filter, block) {
  let hasItems = true;
  const items = [...block.querySelectorAll('.news .news-item')];
  if (filter.toLowerCase().includes('article')) {
    hasItems = items.some((item) => {
      const itemType = [...item.classList][1];
      return itemType.includes('article');
    });
  } else if (filter.toLowerCase().includes('video')) {
    hasItems = items.some((item) => {
      const itemType = [...item.classList][1];
      return itemType.includes('video');
    });
  }
  return hasItems;
}

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

async function getVideos(limit, placeholders) {
  const resp = await fetchGraphQL(`query GetVideos($tournamentId: String, $playerId: String, $playerIds: [String!], $category: String, $franchise: String, $limit: Int, $season: String, $tour: String, $tourCode: TourCode) {
    videos(tournamentId: $tournamentId, playerId: $playerId, playerIds: $playerIds, category: $category, franchise: $franchise, limit: $limit, season: $season, tour: $tour, tourCode: $tourCode) {
      title 
      poster 
      pubdate
      category
      id
      duration 
    }
  }`, {
    tour: placeholders.tourCode.toUpperCase(),
    tournamentId: placeholders.tournamentId,
    limit,
  });
  if (resp.ok) {
    const json = await resp.json();
    if (json.data && json.data.videos) {
      const videoItems = json.data.videos.map((video) => ({
        url: `https://www.pgatour.com/video/${video.category}/${video.id}`,
        type: 'video',
        // eslint-disable-next-line no-template-curly-in-string
        image: video.poster.replace('${height}', '311').replace('${width}', '425'),
        title: video.title,
        date: video.pubdate,
      }));
      return videoItems;
    }
  }
  return [];
}

async function getArticles(limit, placeholders) {
  // TODO this is not actually filtering for the tournament
  // need to fix this before this can be final
  try {
    const resp = await fetchGraphQL(`query GetNewsArticles($tour: TourCode, $franchise: String, $franchises: [String!], $playerId: ID, $limit: Int, $offset: Int, $tags: [String!]) {
    newsArticles(tour: $tour, franchise: $franchise, franchises: $franchises, playerId: $playerId, limit: $limit, offset: $offset, tags: $tags) {
        articles {
            id
            articleImage
            publishDate
            teaserHeadline
            updateDate
            url
        }
    }
  }`, {
      tour: placeholders.tourCode.toUpperCase(),
      tournamentId: placeholders.tournamentId,
      limit,
    });
    if (resp.ok) {
      const json = await resp.json();
      if (json.data && json.data.newsArticles && json.data.newsArticles.articles) {
        const articles = json.data.newsArticles.articles.map((article) => ({
          url: article.url,
          type: 'article',
          image: article.articleImage,
          title: article.teaserHeadline,
          date: article.updateDate,
        }));
        return articles;
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Could not load news', err);
  }

  // return an empty array if fail, so that local news can still be displayed
  return [];
}

async function getLocalArticles() {
  const resp = await fetch('/query-index.json');
  const json = await resp.json();
  const newsItems = json.data.map((item) => {
    if (item.date) {
      const itemDate = new Date(Math.round((item.date - (25567 + 1)) * 86400 * 1000)).valueOf();
      return {
        date: itemDate,
        url: item.path,
        type: 'article',
        image: item.image,
        title: item.title,
      };
    }
    return null;
  }).filter((item) => item !== null);
  return newsItems;
}

function mergeAll(limit, pinnedItems, videos, articles, localNews) {
  const merged = [];
  merged.push(...pinnedItems);

  // merge and 2 sets of articles
  const allFeeds = [...articles, ...localNews];

  // TODO need to dedupe the sets of articles
  // so if something is posted both to players.com and pgatour.com it only shows once

  // then add the videos
  allFeeds.push(...videos);

  // sort everything by date
  allFeeds.sort((a, b) => b.date - a.date);

  // finally add it to merged and slice
  merged.push(...allFeeds);

  return merged.slice(0, limit);
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const limit = config.limit || 8;

  const pinnedItems = [];
  const rows = [...block.children];
  rows.forEach((row) => {
    const pic = row.querySelector('picture');
    const a = row.querySelector('a');
    if (pic && a) {
      pinnedItems.push({
        type: 'article',
        image: pic.querySelector('img').getAttribute('src'),
        title: a.innerText,
        url: a.href,
        pinned: true,
      });
    }
  });

  block.textContent = '';

  // set placeholder content
  const ul = document.createElement('ul');
  block.append(ul);
  for (let i = 0; i < 8; i += 1) {
    const placeholder = document.createElement('li');
    placeholder.className = 'news-placeholder';
    ul.append(placeholder);
  }

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      const placeholders = await fetchPlaceholders();

      const videosPromise = getVideos(limit, placeholders);
      const articlesPromise = getArticles(limit, placeholders);
      const localNewsPromise = getLocalArticles();
      Promise.all([videosPromise, articlesPromise, localNewsPromise])
        .then(([videos, articles, localNews]) => {
          const toShow = mergeAll(limit, pinnedItems, videos, articles, localNews);
          toShow.forEach((item, idx) => {
            const li = document.createElement('li');
            li.classList.add('news-item', `news-item-${item.type || 'article'}`);
            const video = item.type === 'video' ? '<div class="news-item-play"></div>' : '';
            const a = document.createElement('a');
            a.href = item.url;
            a.innerHTML = `
            <div class="news-item-image"><img loading="${idx < 8 ? 'eager' : 'lazy'}" src="${item.image}"></div>
            <div class="news-item-body"><a href="${item.url}">${item.title}</a></div>
            ${video}
          `;
            li.append(a);
            const toReplace = ul.querySelector('.news-placeholder');
            if (toReplace) {
              toReplace.parentNode.replaceChild(li, toReplace);
            } else {
              ul.appendChild(li);
            }
          });
          // add filtering
          if (config.filter) {
            const filters = config.filter.split(',').map((f) => f.trim());
            const container = document.createElement('div');
            container.classList.add('button-container', 'news-filters');
            filters.forEach((filter, i) => {
              if (filterHasItems(filter, block)) {
                const button = document.createElement('button');
                button.textContent = filter;
                button.setAttribute('aria-selected', !i); // first filter is default view
                button.setAttribute('role', 'tab');
                button.setAttribute('data-filter', toClassName(filter));
                button.addEventListener('click', filterNews);
                container.append(button);
              }
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
          makeLinksRelative(block);
          updateExternalLinks(block);
        });
    }
  }, { threshold: 0 });

  observer.observe(block);
}
