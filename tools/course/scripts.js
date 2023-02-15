function updateDateSourceValues(ph) {
  if (ph) {
    const tourCode = document.getElementById('tourCode');
    if (tourCode && ph.tourCode) tourCode.value = ph.tourCode;
    const tournamentId = document.getElementById('tournamentId');
    if (tournamentId && ph.tournamentId) tournamentId.value = ph.tournamentId;
    const damYear = document.getElementById('damYear');
    if (damYear) damYear.value = new Date().getFullYear();
  }
}

function toggleStatsVariant(e) {
  const checkbox = e.target.closest('input[type="checkbox"]');
  const { checked } = checkbox;
  const blockName = document.querySelector('.preview table thead strong');
  if (blockName) {
    if (checked) {
      blockName.textContent += ' (stats)';
    } else {
      blockName.textContent = blockName.textContent.replace(' (stats)', '');
    }
  }
}

function showToastWrapper(wrapper) {
  const hidden = wrapper.getAttribute('aria-hidden') === 'true';
  if (hidden) wrapper.setAttribute('aria-hidden', false);
}

function writeToast(message, type) {
  const wrapper = document.querySelector('.toast-wrapper');
  const toast = document.createElement('aside');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<p>${message}</p>`;
  const messageLength = message.split(/[\s\w]+/).length;
  setTimeout(() => {
    toast.classList.add('fadeOut');
    setTimeout(() => {
      toast.remove();
    }, 250);
  // 5 seconds + 1 second for each additional 60 words (rounding up)
  }, (5 + Math.ceil(messageLength / 60)) * 1000);
  wrapper.prepend(toast);
  showToastWrapper(wrapper);
}

async function copyTable(e) {
  e.preventDefault();
  e.stopPropagation();
  const { target } = e;
  target.disabled = true;
  const table = document.querySelector('.preview table');
  try {
    await navigator.clipboard.write([
      // eslint-disable-next-line no-undef
      new ClipboardItem({
        'text/html': new Blob([table.outerHTML], { type: 'text/html' }),
      }),
    ]);
    writeToast('Block table has been copied to clipboard.', 'success');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('could not copy table to clipboard:', error);
  }
  target.disabled = false;
}

function openTab(e) {
  const target = e.target.closest('button');
  const allTabs = document.querySelectorAll('.tabs button[role="tab"]');
  if ([...allTabs].includes(target)) {
    allTabs.forEach((tab) => {
      const { id } = tab;
      tab.setAttribute('aria-selected', false);
      tab.setAttribute('tabindex', -1);
      const panel = document.querySelector(`[aria-labelledby="${id}"]`);
      if (panel) panel.setAttribute('aria-hidden', true);
    });
    const { id } = target;
    target.setAttribute('aria-selected', true);
    target.removeAttribute('tabindex');
    const panel = document.querySelector(`[aria-labelledby="${id}"]`);
    if (panel) panel.setAttribute('aria-hidden', false);
  }
}

function updateHolesSourceValues(code, perm, courseId) {
  const damCode = document.getElementById('damCode');
  if (damCode) damCode.value = code;
  const damPerm = document.getElementById('damPerm');
  if (damPerm) damPerm.value = perm;
  const damCourseId = document.getElementById('damCourseId');
  if (damCourseId) damCourseId.value = courseId;
}

function updateCourseBlock(holes) {
  const table = document.querySelector('.preview tbody');
  [...table.children].forEach((row) => row.remove());
  if (table) {
    holes.forEach((hole) => {
      const row = document.createElement('tr');
      row.setAttribute('data-hole', hole.holeNum);
      row.innerHTML = `<td></td>
        <td>
          <h2>Hole #${hole.holeNum}</h2>
        </td>`;
      table.append(row);
    });
  }
}

function buildUrlFromFields(fields) {
  let url = '';
  fields.forEach((field) => {
    if (field.nodeName === 'P') url += field.textContent.trim();
    if (field.nodeName === 'INPUT') url += field.value.trim();
  });
  return url;
}

async function fetchCourseData(e, fetchCors) {
  const target = e.target.closest('button');
  if (target) {
    const form = target.closest('.form');
    if (form) {
      const fields = form.querySelectorAll('.form-input p, .form-input input');
      const source = buildUrlFromFields(fields);
      try {
        // eslint-disable-next-line no-console
        console.log('FETCHING COURSE DATA from', source);
        const resp = await fetchCors(source);
        const json = await resp.json();
        // eslint-disable-next-line no-console
        console.log(`JSON RESPONSE from ${source}:\n`, json);
        if (json && json.courses && json.courses[0].holes) {
          updateHolesSourceValues(json.tourCode, json.permNum, json.courses[0].courseId);
          updateCourseBlock(json.courses[0].holes);
          const courseHolesBtn = document.getElementById('hole-data-source-btn');
          if (courseHolesBtn) courseHolesBtn.disabled = false;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`ERROR RESPONSE from ${source}:\n`, error);
        const inputs = [...fields].filter((f) => f.nodeName === 'INPUT');
        writeToast(
          `Error retrieving course data.<br />Check course data source values: <code>${inputs.map((i) => i.value).join(', ')}</code>`,
          'failure',
        );
      }
    }
  }
}

// eslint-disable-next-line no-unused-vars
async function fetchHolesData(e, fetchCors) {
  e.preventDefault();
  const target = e.target.closest('button');
  if (target) {
    target.disabled = true;
    const form = target.closest('.form');
    if (form) {
      const vals = {};
      const fields = [...form.querySelectorAll('.form-input input')].filter((i) => i.value);
      fields.forEach((field) => { vals[field.id] = field.value; });
      const cloudinaryPrefix = `https://${vals.cloudinarySource}/${vals.cloudinaryPathname}`;
      /* TEMP JCR FETCH TURN OFF */
      // const damPrefix = `https://${vals.damSource}`;
      const rows = [...document.querySelectorAll('.preview tbody tr')];
      if (!rows.length) {
        // add dummy data
        const holes = Array.from({ length: 18 }, (v, i) => i + 1);
        const holesData = holes.map((h) => ({ holeNum: h }));
        updateCourseBlock(holesData);
        [...document.querySelectorAll('.preview tbody tr')].forEach((tr) => rows.push(tr));
      }
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const row of rows) {
        const hole = row.getAttribute('data-hole');
        const [img, text] = [...row.children];
        const damMainPath = `${vals.damPrefix}/${vals.damCode}${vals.damPerm}/${vals.damCourseId}/${vals.damPathname}${hole}${vals.damFileType}`;
        const damHolePath = `holes_${vals.damYear}_${vals.damCode}_${vals.damPerm}_${vals.damCourseId}_overhead_full_${hole}.png`;
        /* TEMP JCR FETCH TURN OFF */
        // const damSrc = `${damPrefix}/${damMainPath}`;
        const mainSrc = `${cloudinaryPrefix}/w_1290/v1/${damMainPath}`;
        const holeSrc = `${cloudinaryPrefix}/w_150/v1/${damHolePath}`;
        try {
          /* TEMP JCR FETCH TURN OFF */
          // eslint-disable-next-line no-await-in-loop
          // const resp = await fetchCors(`${damSrc}/jcr:content/metadata.json`);
          // eslint-disable-next-line no-await-in-loop
          // const meta = await resp.json();
          const meta = {};
          const title = meta['dc:title'] || '';
          const desc = meta['dc:description'] || '';
          /* TEMP JCR FETCH TURN OFF */
          // eslint-disable-next-line max-len
          // const creator = typeof meta['dc:creator'] === 'object' ? meta['dc:creator'].join(', ') : meta['dc:creator'];
          const creator = '';
          const rights = meta['dc:rights'] || '';
          // add image
          img.innerHTML = `<p><img src="${mainSrc}" alt="${title}" width="288" height="151" /></p>`;
          const mainImg = img.querySelector('img');
          mainImg.addEventListener('error', () => {
            // only display first image error
            if (!rows.indexOf(row)) {
              writeToast(
                `Invalid image source: <a href="${mainImg.src}">${mainImg.src}</a><br />Check DAM and Cloudinary info: <code>${fields.map((f) => f.value).join(', ')}</code>`,
                'failure',
              );
            }
            mainImg.src = `https://via.placeholder.com/523x270?text=${encodeURIComponent(
              'Invalid image source\nCheck DAM & Cloudinary info',
            )}`;
          });
          // update text
          const h2 = text.querySelector('h2');
          text.innerHTML = h2.outerHTML;
          text.innerHTML += `<p><img src="${holeSrc}" alt="${title}" width="150" height="68" /></p>`;
          if (desc) text.innerHTML += `<p>${desc}</p>`;
          if (creator && rights) {
            text.innerHTML += `<p>PHOTO BY <strong>${creator.toUpperCase()}</strong> / ${rights}`;
          }
          const holeImg = text.querySelector('img');
          holeImg.addEventListener('error', () => {
            // only display first image error
            if (!rows.indexOf(row)) {
              writeToast(
                `Invalid overhead hole image source: <a href="${holeImg.src}">${holeImg.src}</a><br />Check DAM and Cloudinary info: <code>${fields.map((f) => f.value).join(', ')}</code>`,
                'failure',
              );
            }
            holeImg.parentElement.remove();
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`could not load hole ${hole} data`, error);
        }
      }
      const courseHolesBtn = document.getElementById('hole-data-source-btn');
      if (courseHolesBtn) courseHolesBtn.disabled = false;
    }
  }
}

function convertTableToBlock(table) {
  const name = table.querySelector('thead th').textContent.replace(/[{()}]/g, '').toLowerCase();
  const blockName = name.split(' ')[0];
  const block = document.createElement('div');
  block.className = `${name} block`;
  block.setAttribute('data-block-name', blockName);
  const tableRows = table.querySelectorAll('tbody tr');
  tableRows.forEach((tr) => {
    const row = document.createElement('div');
    const cells = tr.querySelectorAll('td');
    cells.forEach((cell) => {
      const col = document.createElement('div');
      col.innerHTML = cell.innerHTML;
      const img = col.querySelector('img');
      if (img) { // wrap img in picture
        const picture = document.createElement('picture');
        picture.innerHTML = img.outerHTML;
        img.replaceWith(picture);
      }
      row.append(col);
    });
    block.append(row);
  });
  const wrapper = document.createElement('div');
  wrapper.className = `${blockName}-wrapper`;
  wrapper.append(block);
  const section = document.createElement('div');
  section.className = `${blockName}-container`;
  section.append(wrapper);
  return section;
}

async function init() {
  const { fetchPlaceholders, fetchCors, loadBlock } = await import(`${window.location.origin}/scripts/scripts.js`);
  const ph = await fetchPlaceholders(window.location.origin);
  updateDateSourceValues(ph);

  const courseStatsBtn = document.getElementById('courseStats');
  if (courseStatsBtn) {
    courseStatsBtn.addEventListener('change', toggleStatsVariant);
  }

  const courseDataSourceBtn = document.getElementById('course-data-source-btn');
  if (courseDataSourceBtn) {
    courseDataSourceBtn.addEventListener('click', async (e) => fetchCourseData(e, fetchCors));
    courseDataSourceBtn.disabled = false;
  }

  const courseHolesBtn = document.getElementById('hole-data-source-btn');
  if (courseHolesBtn) {
    courseHolesBtn.addEventListener('click', async (e) => fetchHolesData(e, fetchCors));
    courseHolesBtn.disabled = false;
  }

  const tabs = document.querySelectorAll('.tabs button[role="tab"]');
  if (tabs) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', openTab);
    });
  }

  const table = document.querySelector('.preview table');
  if (table) {
    const debounce = (func, timeout = 500) => {
      let timer;
      return async (...args) => {
        clearTimeout(timer);
        timer = setTimeout(async () => func.apply(this, args), timeout);
      };
    };

    const previewPanel = document.getElementById('block-preview-panel');
    const updateBlockPreview = debounce(async () => {
      const preview = document.querySelector('.preview');
      if (preview && preview.firstElementChild) {
        preview.firstElementChild.classList.remove('default-content-wrapper');
      }
      const block = convertTableToBlock(table, loadBlock);
      previewPanel.innerHTML = '';
      previewPanel.append(block);
      // eslint-disable-next-line import/no-unresolved
      const mod = await import(`${window.location.origin}/blocks/course/course.js`);
      if (mod.default) {
        await mod.default(block.querySelector('.block'), 'course', document, true);
      }
    }, 500);

    const observer = new MutationObserver((record) => {
      record.forEach((r) => {
        updateBlockPreview(r);
      });
    });
    observer.observe(table, { childList: true, subtree: true });
  }

  const copyBlockBtn = document.getElementById('copy-block-preview');
  if (copyBlockBtn) {
    copyBlockBtn.addEventListener('click', copyTable);
    copyBlockBtn.disabled = false;
  }

  const toastWrapper = document.querySelector('.toast-wrapper');
  if (toastWrapper) {
    const observer = new MutationObserver((record) => {
      record.forEach((r) => {
        if (!r.target.hasChildNodes()) {
          setTimeout(() => {
            r.target.setAttribute('aria-hidden', true);
          }, 3000);
        }
      });
    });
    observer.observe(toastWrapper, { childList: true });
  }
}

init();
