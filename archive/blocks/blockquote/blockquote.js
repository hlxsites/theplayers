export default async function decorate(block) {
  const quotes = block.querySelectorAll('h2');
  const ps = block.querySelectorAll('p');
  block.innerHTML = '';

  const wrapper = document.createElement('blockquote');
  quotes.forEach((quote) => {
    const q = document.createElement('q');
    q.innerHTML = quote.innerHTML;
    wrapper.append(q);
  });
  ps.forEach((p) => {
    wrapper.append(p);
  });

  block.append(wrapper);
}
