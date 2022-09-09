/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const reorganiseHero = (main, document) => {
  const articleBodyText = document.querySelector('.articleBodyText');
  if (articleBodyText) {
    main.prepend(articleBodyText);
  }

  const heroLegend = document.querySelector('.image-autor');
  if (heroLegend) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.innerHTML = heroLegend.innerHTML;
    p.append(em);
    main.prepend(p);
    heroLegend.remove();
  }

  const hero = document.querySelector('.main-image');
  if (hero) {
    main.prepend(hero);
  }

  const video = document.querySelector('.hero-module .video-container');
  if (video) {
    let ref = video.getAttribute('data-video-link-url');
    if (!ref) {
      ref = video.getAttribute('data-video-id');
    } else {
      const a = document.createElement('a');
      a.href = ref;
      a.innerHTML = ref;
      ref = a;
    }
    if (ref) {
      const cells = [['Video'], [ref]];
      const table = WebImporter.DOMUtils.createTable(cells, document);
      main.prepend(table);
    }
  }

  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    main.prepend(subtitle);
  }

  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim() !== '') {
    main.prepend(h1);
  }
};

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

const createRelatedStoriesBlock = (main, document) => {
  const related = document.querySelectorAll('.relatedStories .thumb');
  if (related && related.length > 0) {
    const cells = [];
    cells.push(['Related Stories']);
    const p = document.createElement('p');
    related.forEach((r) => {
      // eslint-disable-next-line no-param-reassign
      let ref = r.getAttribute('href');
      if (!ref) {
        ref = r.getAttribute('data-video-link');
      }
      const a = document.createElement('a');
      a.href = ref;
      a.innerHTML = ref;
      p.append(a);
      p.append(document.createElement('br'));
    });
    cells.push([p]);
    const table = WebImporter.DOMUtils.createTable(cells, document);
    main.append(table);
  }
};

const makeAbsoluteLinks = (main, host, base) => {
  main.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith('/')) {
      const ori = a.href;
      const u = new URL(a.href, host);
      if (u.pathname.startsWith(base)) {
        u.pathname = u.pathname.substring(base.length);
      }
      u.pathname = u.pathname.replace(/\.html$/, '').toLocaleLowerCase();
      a.href = u.toString();

      if (a.textContent === ori) {
        a.textContent = a.href;
      }
    }
  });
};

const makeProxySrcs = (main, host) => {
  main.querySelectorAll('img').forEach((img) => {
    if (img.src.startsWith('/')) {
      // make absolute
      const cu = new URL(host);
      img.src = `${cu.origin}${img.src}`;
    }
    try {
      const u = new URL(img.src);
      u.searchParams.append('host', u.origin);
      img.src = `http://localhost:3001${u.pathname}${u.search}`;
    } catch (error) {
      console.warn(`Unable to make proxy src for ${img.src}: ${error.message}`);
    }
  });
};

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @returns {HTMLElement} The root element
   */
  transformDOM: ({ document, url }) => {
    const main = document.querySelector('.page');

    reorganiseHero(main, document);
    createRelatedStoriesBlock(main, document);
    createMetadata(main, document);

    WebImporter.DOMUtils.remove(main, [
      '.hero-module',
      '.relatedStories',
    ]);

    // remove the empty li / ul and replace by divs
    main.querySelectorAll('ul').forEach((l) => {
      if (l.textContent.trim() === '') {
        l.remove();
      } else {
        const div = document.createElement('div');
        div.innerHTML = l.outerHTML
          .replace(/<li/gm, '<div')
          .replace(/<\/li>/gm, '</div>')
          .replace(/<ul/gm, '<div')
          .replace(/<\/ul>/gm, '</div>');
        l.replaceWith(div);
      }
    });

    const u = new URL(url);
    const host = u.searchParams.get('host');
    makeProxySrcs(main, host);
    makeAbsoluteLinks(main, 'https://main--pga-sentry-tournament-of-champions--hlxsites.hlx.page', '/tournaments/sentry-tournament-of-champions');

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {String} url The url of the document being transformed.
   * @param {HTMLDocument} document The document
   */
  // eslint-disable-next-line arrow-body-style
  generateDocumentPath: ({ url }) => {
    return new URL(url).pathname.replace(/\.html$/, '').toLocaleLowerCase();
  },
};
