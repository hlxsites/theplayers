function updateDateSourceValues(ph) {
  if (ph) {
    const tourCode = document.getElementById('tourCode');
    if (tourCode && ph.tourCode) tourCode.value = ph.tourCode;
    const tournamentId = document.getElementById('tournamentId');
    if (tournamentId && ph.tournamentId) tournamentId.value = ph.tournamentId;
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
  const table = document.getElementById('course-block').querySelector('tbody');
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

async function fetchCourseData(e) {
  const target = e.target.closest('button');
  if (target) {
    const dataSource = target.getAttribute('data-source');
    const form = document.getElementById(dataSource);
    if (form) {
      const fields = form.querySelectorAll('p, input');
      const source = buildUrlFromFields(fields);
      try {
        // eslint-disable-next-line no-console
        console.log('FETCHING COURSE DATA from', source);
        const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(source)}`);
        const json = await resp.json();
        // eslint-disable-next-line no-console
        console.log(`JSON RESPONSE from ${source}:\n`, json);
        if (json && json.courses && json.courses[0].holes) {
          updateHolesSourceValues(json.tourCode, json.permNum, json.courses[0].courseId);
          updateCourseBlock(json.courses[0].holes);
          // const courseHolesBtn = document.getElementById('course-holes-btn');
          // if (courseHolesBtn) courseHolesBtn.disabled = false;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`ERROR RESPONSE from ${source}:\n`, error);
      }
    }
  }
}

async function fetchHolesData(e) {
  e.preventDefault();
  const target = e.target.closest('button');
  if (target) target.disabled = true;
  const form = target.closest('form');
  if (form) {
    const [origin, tour, perm, code, path, fileType, cloudinary] = [...form.querySelectorAll('input')].filter((i) => i.value).map((i) => i.value);
    const cloudinaryPrefix = `https://${cloudinary}/`;
    const rows = [...document.querySelectorAll('.course-block tbody tr')];
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const row of rows) {
      const hole = row.getAttribute('data-hole');
      const [img, text] = [...row.children];
      const imgPath = `${origin}/${tour}${perm}/${code}/${path}${hole}${fileType}`;
      const imgSrc = `${cloudinaryPrefix}/w_1290/v1/${imgPath}`;
      const holeSrc = `${cloudinaryPrefix}w_150/holes_${new Date().getFullYear()}_${tour}_${code}_${perm}_overhead_full_${hole}.png`;
      const dam = `https://www.pgatour.com/${imgPath}`;
      try {
        // eslint-disable-next-line no-await-in-loop
        const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(`${dam}/jcr:content/metadata.json`)}`);
        // eslint-disable-next-line no-await-in-loop
        const meta = await resp.json();
        const title = meta['dc:title'];
        const desc = meta['dc:description'];
        const creator = typeof meta['dc:creator'] === 'object' ? meta['dc:creator'].join(', ') : meta['dc:creator'];
        const rights = meta['dc:rights'];
        // fill block
        img.innerHTML = `<p><img src="${imgSrc}" alt=${title} /></p>`;
        text.innerHTML += `<p><img src="${holeSrc}" alt="${title}" /></p>
          <p>${desc}</p>
          <p>PHOTO BY <strong>${creator.toUpperCase()}</strong> / ${rights}`;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`could not load hole ${hole} data`, error);
      }
    }
    // const url = `https://statdata.pgatour.com/${tournament}/coursestat.json`;
    // try {
    //   const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(url)}`);
    //   const json = await resp.json();
    //   if (json && json.courses && json.courses[0].holes) {
    //     updateHolesSourceValues(json.tourCode, json.permNum, json.courses[0].courseId);
    //     updateCourseBlock(json.courses[0].holes);
    //     const courseHolesBtn = document.getElementById('course-holes-btn');
    //     if (courseHolesBtn) courseHolesBtn.disabled = false;
    //   }
    // } catch (error) {
    //   console.warn('failed to fetch course data', error);
    // }
  }
}

async function init() {
  const { fetchPlaceholders } = await import(`${window.location.origin}/scripts/scripts.js`);
  const ph = await fetchPlaceholders(window.location.origin);

  updateDateSourceValues(ph);
  const courseDataSourceBtn = document.getElementById('course-data-source-btn');
  if (courseDataSourceBtn) {
    courseDataSourceBtn.addEventListener('click', async (e) => fetchCourseData(e));
    courseDataSourceBtn.disabled = false;
  }
  const courseHolesBtn = document.getElementById('hole-data-source-btn');
  if (courseHolesBtn) {
    courseHolesBtn.addEventListener('click', async (e) => fetchHolesData(e));
  }
}

init();
