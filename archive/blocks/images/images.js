function buildCaption(html) {
  const figcaption = document.createElement('figcaption');
  figcaption.innerHTML = html;
  return figcaption;
}

function buildFigure(container) {
  const figure = document.createElement('figure');
  [...container.children].forEach((child) => {
    const clone = child.cloneNode(true);
    // picture or embed link is NOT wrapped in P tag
    if (clone.nodeName === 'PICTURE' || clone.nodeName === 'A') {
      figure.prepend(clone);
    } else {
      // content wrapped in P tag(s)
      const picture = clone.querySelector('picture');
      if (picture) {
        figure.prepend(picture);
      }
      const caption = clone.querySelector('em');
      if (caption) {
        const figureCaption = buildCaption(caption.innerHTML);
        figure.append(figureCaption);
      }
      const link = clone.querySelector('a');
      if (link) {
        const img = figure.querySelector('picture');
        if (img) {
          // wrap picture in A tag
          link.textContent = '';
          link.append(img);
        }
        figure.prepend(link);
      }
    }
  });
  return figure;
}

function buildColumns(row) {
  [...row.children].forEach((column) => column.replaceWith(buildFigure(column)));
  row.classList.add('images-columns');
}

export default function decorateImages(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    if (row.childElementCount > 1) {
      buildColumns(row);
    } else {
      row.innerHTML = buildFigure(row.firstElementChild).outerHTML;
    }
  });
  if (block.className.includes('float')) {
    const parent = block.parentElement;
    const parentSibling = parent.nextElementSibling;
    if (parentSibling.className === 'default-content-wrapper') {
      parent.classList.add('images-float-wrapper');
      parentSibling.prepend(parent);
    }
  }
}
