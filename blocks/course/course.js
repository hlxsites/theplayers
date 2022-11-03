import { readBlockConfig, fetchPlaceholders, toClassName } from '../../scripts/scripts.js';

function findStatPercent(id, stats, divisor) {
  const stat = stats.find((s) => s.id === id);
  if (stat) {
    const percent = parseInt(stat.eV2, 10) / divisor;
    return Math.round(percent * 100);
  }
  return 0;
}

function buildStatRow(stat, value) {
  const row = document.createElement('tr');
  row.className = `course-hole-${toClassName(stat)}`;
  row.innerHTML = `<td>
      <div class="course-hole-bar" style="width: ${value}%"></div>
    </td>
    <td>${value}%</td>
    <td>${stat}</td>`;
  return row;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = '';
  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      const placeholders = await fetchPlaceholders();
      const code = placeholders.tourCode;
      const id = placeholders.tournamentId;
      const statsResp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(`https://statdata.pgatour.com/${code}/${id}/coursestat.json`)}`);
      const statsJson = await statsResp.json();
      const courseResp = await fetch('/course.json');
      const courseJson = await courseResp.json();
      if (
        courseJson && courseJson.data
        && statsJson && statsJson.courses && statsJson.courses[0].holes
      ) {
        const buttons = document.createElement('div');
        buttons.className = 'button-container';
        // block.parentElement.prepend(buttons);
        const courseData = courseJson.data;
        const courseStats = statsJson.courses[0].holes;
        if (courseData.length === courseStats.length) {
          courseData.forEach((data, i) => {
            const stats = courseStats[i];
            // setup button
            const button = document.createElement('button');
            if (!i) button.classList.add('selected');
            buttons.append(button);
            // setup hole slide
            const hole = document.createElement('div');
            hole.className = 'course-hole';
            const holeImg = document.createElement('div');
            holeImg.className = 'course-hole-image';
            holeImg.innerHTML = `<picture><img src="${data.image}" alt="${data.title}" /></picture>`;
            const holeText = document.createElement('div');
            holeText.className = 'course-hole-text';
            holeText.innerHTML = `<div class="course-hole-data">
                <h2 class="course-hole-title">Hole #${data.hole || i + 1}</h2>
                <p class="course-hole-subtitle">
                  ${stats.par ? `<span class="course-hole-par">Par ${stats.par}</span>` : ''}, 
                  ${stats.yards ? `<span class="course-hole-yards">${stats.yards} Yards</span>` : ''}
                </p>
                ${data.overheadImage ? `<img class="course-hole-overhead" src="${data.overheadImage}" alt="${data.title}" />` : ''}
                <p>${data.description}</p>
              </div>
              <div class="course-hole-credits">
                <p>Photo by <strong>${data.creator}</strong> / ${data.rights}</p>
              </div>`;
            if (config.stats === statsJson.year) { // build stats block
              const avg = stats.stats.find((stat) => stat.id === '43108').eV2;
              const allStats = stats.stats.filter((stat) => stat.id !== '43108');
              const statsDivisor = allStats.reduce((a, b) => {
                // eslint-disable-next-line no-param-reassign
                if (a.eV2) a = a.eV2;
                return parseInt(a, 10) + parseInt(b.eV2, 10);
              });
              const tableStats = [
                { stat: 'Eagle', value: findStatPercent('43106', allStats, statsDivisor) },
                { stat: 'Birdie', value: findStatPercent('43107', allStats, statsDivisor) },
                { stat: 'Par', value: findStatPercent('43523', allStats, statsDivisor) },
                { stat: 'Bogey', value: findStatPercent('41184', allStats, statsDivisor) },
                { stat: '2+ Bogey', value: findStatPercent('43520', allStats, statsDivisor) },
              ];
              const table = document.createElement('tbody');
              tableStats.forEach((s) => table.append(buildStatRow(s.stat, s.value)));
              const statsEl = document.createElement('div');
              statsEl.className = 'course-hole-stats';
              statsEl.innerHTML = `<h3>${config.stats} Statistics</h3>
                <div class="course-hole-avg">
                  <p><span>${avg}</span> Scoring Avg</p>
                </div>
                <table class="course-hole-chart"><tbody>
                  ${table.outerHTML}
                </tbody></table>`;
              holeText.append(statsEl);
            }
            hole.append(holeImg, holeText);
            block.append(hole);
          });
        }
      }
    }
  }, { threshold: 0 });

  observer.observe(block);
}
