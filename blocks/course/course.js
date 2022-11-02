import { fetchPlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
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
        block.parentElement.prepend(buttons);
        const courseData = courseJson.data;
        const courseStats = statsJson.courses[0].holes;
        if (courseData.length === courseStats.length) {
          courseData.forEach((data, i) => {
            const stats = courseStats[i];
            console.log('data:', data);
            console.log('stats:', stats);
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
              </div>
              <div class="course-hole-credits">
                <p>Photo by <strong>${data.creator}</strong> / ${data.rights}</p>
              </div>
              <div class="course-hole-stats"></div>`;
            hole.append(holeImg, holeText);
            block.append(hole);
          });
        }
      }
    }
  }, { threshold: 0 });

  observer.observe(block);
}
