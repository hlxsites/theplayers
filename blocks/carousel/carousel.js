import { toClassName } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockClasses = [...block.classList];
  const buttons = document.createElement('div');
  buttons.className = 'carousel-buttons';
  if (blockClasses.includes('course')) buttons.classList.add('course-buttons');
  [...block.children].forEach((row, i) => {
    const classes = ['image', 'text'];
    classes.forEach((e, j) => {
      if (row.children[j]) row.children[j].classList.add(`carousel-${e}`);
    });
    /* course carousel */
    if (blockClasses.includes('course')) {
      const text = row.querySelector('.carousel-text');
      text.classList.add('course-text');
      // setup overview (title, img, desc)
      const overview = document.createElement('div');
      overview.classList.add('course-overview');
      overview.append(
        text.querySelector('h2'), // title
        text.querySelector('h2 + h3'), // par heading
        text.querySelector('h2 + h3 + p'), // course img
        text.querySelector('h2 + h3 + p + p'), // course desc
      );
      const holeImg = overview.querySelector('picture');
      if (holeImg) holeImg.parentNode.classList.add('course-hole');
      // setup stats
      const statistics = document.createElement('div');
      statistics.classList.add('course-statistics');
      statistics.append(
        text.querySelector('h3'), // statistics heading
        text.querySelector('h3 + ul'), // statistics list
      );
      const statsTable = document.createElement('table');
      const allStats = statistics.querySelector('ul');
      let stats = [];
      if (allStats) stats = allStats.querySelectorAll('li');
      stats.forEach((s) => {
        const stat = s.querySelector('strong').textContent;
        // setup scoring average ring
        if (stat.toUpperCase() === 'SCORING AVG') {
          const avg = document.createElement('div');
          avg.classList.add('course-avg');
          avg.innerHTML = `<p>${s.innerHTML}</p>`;
          allStats.parentNode.insertBefore(avg, allStats);
          s.remove();
        } else {
          const tableRow = document.createElement('tr');
          tableRow.classList.add(`course-${toClassName(stat)}`);
          const val = parseInt(s.textContent.split(' ')[s.textContent.split(' ').length - 1], 10);

          const bar = document.createElement('td');
          bar.classList.add('course-stat-graph');
          bar.innerHTML = `<div class="course-stat-bar" style="width: ${val}%"></div>`;

          const percent = document.createElement('td');
          percent.classList.add('course-stat-percent');
          percent.innerHTML = `${val}%`;

          const thisStat = document.createElement('td');
          thisStat.classList.add('course-stat-title');
          thisStat.innerHTML = s.querySelector('strong').textContent;

          tableRow.append(bar, percent, thisStat);
          statsTable.append(tableRow);
        }
      });
      if (allStats && statsTable) allStats.replaceWith(statsTable);

      text.prepend(overview, statistics);
      // setup photo credits
      const credits = text.querySelector('p > em');
      if (credits) credits.parentNode.classList.add('course-credits');
    }
    /* buttons */
    const button = document.createElement('button');
    if (!i) button.classList.add('selected');
    button.addEventListener('click', () => {
      block.scrollTo({ top: 0, left: row.offsetLeft - row.parentNode.offsetLeft, behavior: 'smooth' });
      [...buttons.children].forEach((r) => r.classList.remove('selected'));
      button.classList.add('selected');
    });
    buttons.append(button);
  });
  block.parentElement.prepend(buttons);
}
