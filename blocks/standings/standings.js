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

async function populateStandingsBlock(block, config, ph) {
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
            <a href="/junior-presidents-cup-qualifying">${ph.howPlayersQualify}</a>
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
            <a class="button" href="/junior-presidents-cup-${team}-standings">${ph.standings}</a>
          </span>
        </p>`;
      wrapper.append(roster, footnote);
      block.append(wrapper);
    });
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const placeholders = await fetchPlaceholders();
  block.textContent = '';

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      if (config.source) {
        await populateStandingsBlock(block, config, placeholders);
      }
    }
  }, { threshold: 0 });

  observer.observe(block);
}
