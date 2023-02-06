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
        video.innerHTML = `<video loop muted playsInline>
          <source data-src="${a.href}" type="video/mp4" />
        </video>`;
        child.replaceWith(video);

        const videoObserver = new IntersectionObserver(async (entries) => {
          const observed = entries.find((entry) => entry.isIntersecting);
          const vid = video.querySelector('video');
          if (observed) {
            const source = video.querySelector('source');
            if (!source.hasAttribute('src')) {
              source.src = source.dataset.src;
              vid.load();
            }
            vid.play();
          } else {
            vid.pause();
          }
        }, { threshold: 0 });
        videoObserver.observe(video);
      }
    });
    img.classList.remove('button-container');
    media.append(img);

    // copy/text setup
    if (!text.children.length) {
      text.innerHTML = `<p>${text.innerHTML}</p>`;
    }

    let prevRatio = 0;
    let moreVisible = null;
    const textObserver = new IntersectionObserver(async (entries) => {
      const observed = entries.find((entry) => entry.isIntersecting);
      if (observed) {
        const mediaSlides = [...media.children];
        moreVisible = observed.intersectionRatio > prevRatio;
        prevRatio = observed.intersectionRatio;
        if (moreVisible) {
          mediaSlides.forEach((child) => child.removeAttribute('data-intersecting'));
          mediaSlides[i].setAttribute('data-intersecting', true);
        } else if (i && i !== mediaSlides.length - 1) {
          mediaSlides[i].removeAttribute('data-intersecting');
          mediaSlides[i - 1].setAttribute('data-intersecting', true);
        }
      } else {
        prevRatio = 0;
        moreVisible = false;
      }
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
    textObserver.observe(text);
    copy.append(text);
  });

  block.innerHTML = '';
  block.append(media, copy);
}
