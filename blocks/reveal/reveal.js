export default async function decorate(block) {
  const media = document.createElement('div');
  media.classList.add('reveal-media');
  const copy = document.createElement('div');
  copy.classList.add('reveal-copy');

  [...block.children].forEach((row, i) => {
    const [img, text] = [...row.children];
    // media/img setup
    if (!i) img.setAttribute('data-intersecting', true);
    if ([...img.children].length > 1) img.setAttribute('data-count', [...img.children].length);
    media.append(img);

    // copy/text setup
    if (!text.children.length) {
      text.innerHTML = `<p>${text.innerHTML}</p>`;
    }
    const observer = new IntersectionObserver(async (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        // observer.disconnect();
        [...media.children].forEach((child, j) => {
          if (i === j) {
            child.setAttribute('data-intersecting', true);
          } else {
            child.removeAttribute('data-intersecting');
          }
        });
      }
    }, { threshold: 0.33 });
    observer.observe(text);
    copy.append(text);
  });

  block.innerHTML = '';
  block.append(media, copy);
}
