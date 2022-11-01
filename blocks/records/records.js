import { fetchPlaceholders, decorateIcons } from '../../scripts/scripts.js';

function generateUserTrackingId(id) {
  return window.pgatour.setTrackingUserId(`id${id}`);
}

function loadScript(url, callback, type) {
  const head = document.querySelector('head');
  if (!head.querySelector(`script[src="${url}"]`)) {
    const script = document.createElement('script');
    script.src = url;
    if (type) script.setAttribute('type', type);
    head.append(script);
    script.onload = callback;
    return script;
  }
  return head.querySelector(`script[src="${url}"]`);
}

function buildRow() {
  return document.createElement('tr');
}

function buildCell(contents, isHead = false) {
  const cell = isHead ? document.createElement('th') : document.createElement('td');
  cell.innerHTML = contents;
  // eslint-disable-next-line eqeqeq
  if (cell.textContent == Number(cell.textContent)) {
    // if cell contents are only numerical
    cell.classList.add('table-cell-num');
  }
  return cell;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  block.textContent = '';

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadScript('https://microservice.pgatour.com/js', async () => {
        const resp = await fetch(`https://statdata.pgatour.com/r/500/pcup.json?userTrackingId=${generateUserTrackingId(placeholders.userTrackingId)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.tournament && json.tournament.rounds) {
            const round = json.tournament.rounds.pop();
            if (round && round.cupTeams) {
              const teams = round.cupTeams;
              teams.forEach((team) => {
                const wrapper = document.createElement('div');
                wrapper.className = `records-team records-team-${team.shortName.toLowerCase()}`;
                wrapper.innerHTML = `<h2>
                    ${placeholders.teamRecords} <strong>${team.name}</strong>
                    <span class="icon icon-flag-${team.shortName.toLowerCase()}"></span>
                  </h2>`;
                decorateIcons(wrapper);
                // build table
                const table = document.createElement('table');
                table.className = 'records-table';
                // build table head
                const head = document.createElement('thead');
                const headRow = buildRow();
                const headData = [
                  placeholders.player,
                  placeholders.win,
                  placeholders.loss,
                  placeholders.tie,
                  `${placeholders.total}*`,
                ];
                headData.forEach((d) => headRow.append(buildCell(d, true)));
                head.append(headRow);
                // build table body
                const body = document.createElement('tbody');
                const members = team.members.sort((a, b) => {
                  if (Number(a.points) > Number(b.points)) return -1;
                  if (Number(a.points) < Number(b.points)) return 1;
                  return 0;
                });
                members.forEach((member) => {
                  const row = buildRow();
                  const memberData = [
                    `<strong>${member.name}</strong>`,
                    member.wins,
                    member.losses,
                    member.draws,
                    member.points,
                  ];
                  memberData.forEach((d) => row.append(buildCell(d)));
                  body.append(row);
                });
                table.append(head, body);
                wrapper.append(table);
                block.append(wrapper);
              });
            }
          }
        }
      });
    }
  }, { threshold: 0 });

  observer.observe(block);
}
