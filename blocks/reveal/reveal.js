export default async function decorate(block) {
  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      block.setAttribute('data-intersecting', true);
    }
  }, { threshold: 0 });

  observer.observe(block);
}
