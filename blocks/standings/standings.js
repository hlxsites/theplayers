import { fetchPlaceholders, readBlockConfig, decorateIcons } from '../../scripts/scripts.js';

async function formatStandingsData(src) {
  const resp = await fetch(src);
  const standings = {};
  if (resp.ok) {
    const { data } = await resp.json();
    if (data) {
      data.forEach((player) => {
        // if team doesn't exist, create team > year, flag, finalized, players
        if (!standings[player.playerFlag]) {
          standings[player.playerFlag] = {
            team: player.team,
            year: player.year,
            flag: player.playerFlag,
            teamFinalized: player.teamFinalized.toLowerCase() === 'true',
            players: [],
          };
        }
        if (player.isCaptain.toLowerCase() === 'true') { // add team captain
          standings[player.playerFlag].captain = player.playerName;
        } else { // add players
          standings[player.playerFlag].players.push({
            id: player.playerId,
            name: player.playerName,
          });
        }
      });
    }
  }
  return standings;
}

function writeImgSrc(id, year = new Date().getFullYear()) {
  return `https://pga-tour-res.cloudinary.com/image/upload/f_auto,q_auto,c_fill,r_max,dpr_2.0,g_face:center,w_72,h_72,t_headshots_leaderboard_l/headshots_pcup_${year}_${id}.png`;
}

async function populateInternalStandingsBlock(block, config, ph) {
  const data = await formatStandingsData(config.source);
  if (data.international && data.usa) {
    Object.keys(data).forEach((team) => {
      const teamData = data[team];
      const wrapper = document.createElement('div');
      wrapper.className = `standings-team standings-team-${team}`;
      wrapper.innerHTML = `<h2 class="standings-team-name">${teamData.team}</h2>
        <p class="standings-team-info">
          <span>
            <strong>${ph.captain}:</strong> ${teamData.captain || ''}
          </span>
          <span>
            ${config['how-players-qualify'] ? `<a href="/junior-presidents-cup-qualifying">${ph.howPlayersQualify}</a>` : ''}
          </span>
        </p>`;
      const roster = document.createElement('div');
      roster.className = 'standings-team-roster';
      roster.innerHTML = `<p>
          <strong>${teamData.year}</strong> ${ph.playerRoster}
        </p>`;
      const list = document.createElement('ul');
      list.className = 'standings-team-players';
      teamData.players.forEach((player) => {
        const li = document.createElement('li');
        li.innerHTML = `<img src="${writeImgSrc(player.id, config.year)}" alt="${player.name}" />
          <strong>${player.name}</strong>
          <span class="icon icon-flag-${teamData.flag}"></span>`;
        list.append(li);
      });
      decorateIcons(list);
      roster.append(list);
      const footnote = document.createElement('div');
      footnote.className = 'standings-team-footnote';
      footnote.innerHTML = `<p>
          <strong>${teamData.teamFinalized ? ph.teamFinalized : ''}</strong>
          <span class="button-container">
            ${config.standings ? `<a class="button" href="${config.standings}-${team}-standings">${ph.standings}</a>` : ''}
          </span>
        </p>`;
      wrapper.append(roster, footnote);
      block.append(wrapper);
    });
  }
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

async function populateExternalStandingsBlock(block, config, ph) {
  loadScript('https://microservice.pgatour.com/js', async () => {
    const resp = await fetch(`${config.source}${config.source.endsWith('.json') ? '?' : '&'}userTrackingId=${generateUserTrackingId(ph.userTrackingId)}`);
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.tours && json.tours[0] && json.tours[0].years && json.tours[0].years[0]) {
        const data = json.tours[0].years[0];
        // build intl table
        if (data.stats && data.stats.statTitles && data.stats.details) {
          const table = document.createElement('table');
          table.className = 'standings-table standings-table-international';
          // build table head
          const head = document.createElement('thead');
          const headRow = buildRow();
          const headData = [
            ph.rankThisWeek,
            ph.rankLastWeek,
            ph.player,
            data.stats.statTitles.evntsPlayed,
            data.stats.statTitles.statTitle1,
          ];
          headData.forEach((d) => headRow.append(buildCell(d, true)));
          head.append(headRow);
          // build table body
          const body = document.createElement('tbody');
          for (let i = 0; i < 25; i += 1) {
            const player = data.stats.details[i];
            const row = buildRow();
            const playerData = [
              player.curRank,
              player.prevRank,
              `<p><span class="icon icon-flag-${player.country.toLowerCase()}"></span> <strong>${player.plrName.first} ${player.plrName.last}</strong></p>`,
              player.statValues.evntsPlayed,
              player.statValues.statValue1,
            ];
            playerData.forEach((d) => row.append(buildCell(d)));
            body.append(row);
          }
          decorateIcons(body);
          table.append(head, body);
          block.append(table);
        }
        // build usa table
        if (data.stats && data.stats[0] && data.stats[0].statTitles && data.stats[0].details) {
          const stats = data.stats[0];
          const table = document.createElement('table');
          table.className = 'standings-table standings-table-usa';
          // build table head
          const head = document.createElement('thead');
          const headRow = buildRow();
          const headData = [
            ph.rankThisWeek,
            ph.rankLastWeek,
            ph.player,
            stats.statTitles.statTitle1,
          ];
          headData.forEach((d) => headRow.append(buildCell(d, true)));
          head.append(headRow);
          // build table body
          const body = document.createElement('tbody');
          for (let i = 0; i < 25; i += 1) {
            const player = stats.details[i];
            const row = buildRow();
            const playerData = [
              player.curRank,
              player.prevRank,
              `<strong>${player.plrName.first} ${player.plrName.last}</strong>`,
              player.statValues.statValue1,
            ];
            playerData.forEach((d) => row.append(buildCell(d)));
            body.append(row);
          }
          table.append(head, body);
          block.append(table);
        }
      }
    }
  });
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const placeholders = await fetchPlaceholders();
  block.textContent = '';

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      if (config.source) {
        if (config.source.includes('statdata')) { // external data source
          await populateExternalStandingsBlock(block, config, placeholders);
        } else { // internal data source
          await populateInternalStandingsBlock(block, config, placeholders);
        }
      }
    }
  }, { threshold: 0 });

  observer.observe(block);
}
