export default async function decorate(block) {
  const media = document.createElement('div');
  media.classList.add('reveal-media');
  const copy = document.createElement('div');
  copy.classList.add('reveal-copy');

  [...block.children].forEach((row, i) => {
    const [img, text] = [...row.children];
    if (!i) img.setAttribute('data-intersecting', true);
    [...img.children].forEach((child) => {
      if (child.querySelector('a[href]') || (child.nodeName === 'A' && child.href)) {
        // transform video
        const a = child.querySelector('a[href]') || child;
        const video = document.createElement('p');
        video.className = 'video-wrapper';
        video.innerHTML = `<video autoplay loop muted playsInline>
          <source src="${a.href}" type="video/mp4" />
        </video>`;
        child.replaceWith(video);
      }
    });
    img.classList.remove('button-container');
    media.append(img);

    // copy/text setup
    if (!text.children.length) {
      text.innerHTML = `<p>${text.innerHTML}</p>`;
    }
    text.setAttribute('data-length', [...text.children].length);

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
    }, { threshold: 0.5 });
    observer.observe(text);
    copy.append(text);
  });

  block.innerHTML = '';
  block.append(media, copy);
}
