export default function decorate(block) {
  block.querySelectorAll('img').forEach((img) => {
    img.closest('div').classList.add('columns-contains-image');
  });
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
}
