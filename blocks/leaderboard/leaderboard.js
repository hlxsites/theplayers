import {
  readBlockConfig,
  decorateIcons,
  fetchPlaceholders,
  updateExternalLinks,
  loadScript,
} from '../../scripts/scripts.js';

function generateUserTrackingId(id) {
  return window.pgatour.setTrackingUserId(`id${id}`);
}

function buildCell() {
  return document.createElement('td');
}

function buildRow() {
  return document.createElement('tr');
}

function buildLeaderboardTable() {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headRow = buildRow();
  const cols = [' ', 'POS', 'TP', 'Country', 'Total', 'Thru'];
  cols.forEach((col) => {
    const cell = document.createElement('th');
    if (col !== 'TP') {
      cell.textContent = col;
    } else {
      cell.innerHTML = '<p><span class="icon icon-up"></span><span class="icon icon-down"></span></p>';
    }
    headRow.append(cell);
  });
  head.append(headRow);
  table.append(head);
  const body = document.createElement('tbody');
  return [table, body];
}

function calculateTP(start, current) {
  // eslint-disable-next-line no-param-reassign
  start = parseInt(start.replace('T', ''), 10);
  // eslint-disable-next-line no-param-reassign
  current = parseInt(current.replace('T', ''), 10);
  const tp = start - current;
  return { tp: Math.abs(tp), posMove: tp > 0 };
}

async function populateLeaderboard(block, config) {
  const placeholders = await fetchPlaceholders();
  // fetch leaderboard content
  const tournament = `${placeholders.tourCode}/${placeholders.tournamentId}`;
  const resp = await fetch(`https://statdata.pgatour.com/${tournament}/leaderboard-top5.json?userTrackingId=${generateUserTrackingId(config.id)}`);
  if (resp.ok) {
    const json = await resp.json();
    if (json.leaderboard && json.leaderboard.players) {
      const { players } = json.leaderboard;
      const [table, body] = buildLeaderboardTable();
      const buttons = document.createElement('div');
      buttons.className = 'button-container';
      const leaderWrapper = document.createElement('div');
      players.forEach((player, i) => {
        const bio = player.player_bio;
        const { tp, posMove } = calculateTP(player.start_position, player.current_position);
        if (!i) { // setup leader info for leaderboard leader
          const leader = document.createElement('div');
          leader.className = 'leaderboard-leader';
          leader.innerHTML = `
          <div class="leaderboard-leader-img">
            <img
              src="https://pga-tour-res.cloudinary.com/image/upload/f_auto,q_auto,c_fill,r_max,dpr_2.0,g_face:center,h_260,w_260,d_headshots_default.png/headshots_${player.player_id}.png"
              alt="${bio.first_name} ${bio.last_name}"
            />
          </div>
          <div class="leaderboard-leader-body">
            <p class="leaderboard-leader-body-title">${bio.first_name} ${bio.last_name}</p>
            <div class="leaderboard-leader-stats">
              <div>
                <span class="icon icon-flag-${bio.country.toLowerCase()}"></span>
              </div>
              <div>
                <p class="leaderboard-leader-stats-title">Total</p>
                <p class="leaderboard-leader-stats-stat">${player.total}</p>
              </div>
              <div>
                <p class="leaderboard-leader-stats-title">Thru</p>
                <p class="leaderboard-leader-stats-stat">${player.thru < 18 ? player.thru : 'F'}</p>
              </div>
            </div>
          </div>`;
          const scorecard = document.createElement('a');
          scorecard.className = 'button primary';
          scorecard.textContent = 'View full scorecard';
          scorecard.href = `https://www.pgatour.com/players/player.${player.player_id}.${bio.first_name}-${bio.last_name}.html/scorecards/${json.leaderboard.tournament_id}`.toLowerCase();
          buttons.append(scorecard);
          if (config['button-link'] && config['button-text']) {
            const secondaryBtn = document.createElement('a');
            secondaryBtn.className = 'button secondary';
            secondaryBtn.textContent = config['button-text'];
            secondaryBtn.href = config['button-link'];
            buttons.append(secondaryBtn);
          }
          decorateIcons(leader);
          leader.append(buttons);
          leaderWrapper.append(leader);
          block.append(leaderWrapper);
        }
        const row = buildRow();
        const favoriteButtonCell = buildCell();
        favoriteButtonCell.className = 'leaderboard-favorite';
        favoriteButtonCell.innerHTML = `<button class="leaderboard-favorite-button" data-tour="${json.leaderboard.tour_code}" data-id="${player.player_id}" data-op="add">
          <span class="icon icon-plus"></span>
        </button>
        <span class="tooltip"><span class="tooltip-op">Add to</span> <br /><strong>Favorite Players</strong></span>`;
        row.append(favoriteButtonCell);
        const favoriteButton = favoriteButtonCell.querySelector('button');
        favoriteButton.addEventListener('click', () => {
          import('../../scripts/delayed.js').then((module) => module.initGigya());
        });
        const playerData = [
          player.current_position,
          `<p>${tp !== 0 ? `<span class="icon icon-${posMove ? 'up' : 'down'}"></span> ${tp}` : '--'}</p>`,
          `<p class="leaderboard-player"><span class="icon icon-flag-${bio.country.toLowerCase()}"></span> ${bio.first_name} ${bio.last_name}</p>`,
          player.total,
          player.thru < 18 ? player.thru : 'F',
        ];
        playerData.forEach((d) => {
          const cell = buildCell();
          cell.innerHTML = d;
          if (typeof d === 'string' && d.includes('flag')) decorateIcons(cell);
          row.append(cell);
        });
        body.append(row);
      });
      /* setup footer */
      const footer = document.createElement('div');
      footer.className = 'leaderboard-footer';
      footer.innerHTML = `<div class="button-container">
        <a href="${config.leaderboard}" class="button primary">View full leaderboard</a>
      </div>`;
      /* setup sponsors */
      const sponsors = document.createElement('div');
      sponsors.className = 'leaderboard-sponsors';
      const configSponsors = Object.keys(config).filter((key) => (
        key.startsWith('sponsor-') // is a sponsor
        && !key.endsWith('-link') // is not a sponsor link
        && config[`${key}-link`])); // but HAS a sponsor link
      configSponsors.forEach((s) => {
        const img = config[s];
        const link = config[`${s}-link`];
        const a = document.createElement('a');
        a.className = 'leaderboard-sponsors-sponsor';
        a.setAttribute('href', link);
        a.innerHTML = `<img src="${img}" alt="${s.replace('sponsor-', '')}"/>`;
        sponsors.append(a);
      });
      footer.prepend(sponsors);
      /* setup table column */
      const tableWrapper = document.createElement('div');
      table.append(body);
      tableWrapper.append(table, footer);
      block.append(tableWrapper);
    }
    updateExternalLinks(block);
  }
}

function createNavBtn(link, label) {
  const btn = document.createElement('li');
  btn.innerHTML = `<a href="${link}" ${link.includes('leaderboard') ? 'class="active"' : ''}>${label}</a>`;
  return btn;
}

function createMediaBtn(type, ph, forLegend = false) {
  const el = !forLegend ? 'button' : 'i';
  const btn = document.createElement(el);
  btn.className = 'leaderboard-round-score-button';
  btn.title = `${ph.view} ${ph[`${type}s`]}`;
  btn.innerHTML = `<span class="icon icon-${type}"></span>`;
  return btn;
}

function findTeam(teams, country) {
  return teams.find((t) => t.country.toLowerCase() === country);
}

function createTeamCell(team) {
  const cell = buildCell();
  team.players.forEach((player, i) => {
    if (!i) {
      cell.textContent += `${player.firstName} ${player.lastName}`;
    } else {
      cell.textContent += ` / ${player.firstName} ${player.lastName}`;
    }
  });
  return cell;
}

async function populateFullLeaderboard(block, config) {
  const placeholders = await fetchPlaceholders();
  // fetch leaderboard content
  const tournament = `${placeholders.tourCode}/${placeholders.tournamentId}`;
  const resp = await fetch(`https://statdata.pgatour.com/${tournament}/${config.year}/pcup_summary.json?userTrackingId=${generateUserTrackingId(config.id)}`);
  if (resp.ok) {
    const json = await resp.json();
    // build button nav
    const nav = document.createElement('ul');
    nav.className = 'leaderboard-nav';
    if (config.leaderboard) nav.append(createNavBtn(config.leaderboard, placeholders.leaderboard));
    if (config.tourcast) nav.append(createNavBtn(config.tourcast, placeholders.tourcast));
    if (config['tee-times']) nav.append(createNavBtn(config['tee-times'], placeholders.teeTimes));
    if (nav.hasChildNodes()) block.append(nav);
    // build updated time
    if (json.generatedUTC) {
      const date = new Date(json.generatedUTC);
      const months = placeholders.months.split(',').map((m) => m.trim());
      const updated = document.createElement('div');
      updated.className = 'leaderboard-updated';
      updated.innerHTML = `<p>${placeholders.updated}
          <strong>
            <span class="leaderboard-updated-month">${months[date.getMonth()]}</span> 
            <span class="leaderboard-updated-day">${date.getDate()}</span>, 
            <span class="leaderboard-updated-year">${date.getFullYear()}</span> 
            <span class="leaderboard-updated-hour">${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}</span>:<span class="leaderboard-updated-minutes">${date.getMinutes().toString().padStart(2, '0')}</span>
            <span class="leaderboard-updated-suffix">${date.getHours() < 12 ? placeholders.am : placeholders.pm}</span>
          </strong>
        </p>`;
      block.append(updated);
    }
    // build experience on tourcast button
    if (config.tourcast) {
      const tourcast = document.createElement('div');
      tourcast.className = 'leaderboard-tourcast';
      tourcast.innerHTML = `<p class="button-container">
          ${placeholders.experienceOn}
          <a class="leaderboard-tourcast-button" href="${config.tourcast}">
            <span>${placeholders.tourcast}</span><span>${placeholders.threed}</span>
          </a>
        </p>`;
      block.append(tourcast);
    }
    // build tables per round
    if (json.rounds) {
      const rounds = document.createElement('div');
      rounds.className = 'leaderboard-rounds';
      json.rounds.forEach((round) => {
        const table = document.createElement('table');
        table.className = 'leaderboard-round';
        // setup "header" / caption
        const caption = document.createElement('caption');
        caption.innerHTML = `<h2>
            ${placeholders.round} ${round.roundNum}: ${round.roundFormat.split(' ').slice(2)}
          </h2>
          <p class="leaderboard-round-scores">
            <span class="icon icon-flag-international"></span>
            <span class="leaderboard-round-score-intl">
              ${round.scores.find((s) => s.shortName.toLowerCase() === 'intl').score}
              </span>&nbsp;|&nbsp;<span class="leaderboard-round-score-usa">
              ${round.scores.find((s) => s.shortName.toLowerCase() === 'usa').score}
            </span>
            <span class="icon icon-flag-usa"></span>
          </p>`;
        decorateIcons(caption);
        const body = document.createElement('tbody');
        // create row for each match
        round.matches.forEach((match) => {
          const matchRow = buildRow();
          // create cells for teams
          const intlTeam = findTeam(match.teams, 'intl');
          const usaTeam = findTeam(match.teams, 'usa');
          const intlCell = createTeamCell(intlTeam);
          const usaCell = createTeamCell(usaTeam);
          // create column for score
          const score = buildCell();
          score.className = 'leaderboard-round-score';
          if (match.matchState === 'Complete') {
            score.innerHTML = `<span>${match.teams[0].finalMatchScore.replace('and', '&')}</span>`;
            const banner = document.createElement('span');
            banner.className = 'icon';
            banner.innerHTML = `<span>${placeholders.win}</span>`;
            if (intlTeam.matchWinner) {
              banner.classList.add('icon-banner-left');
              score.prepend(banner);
            } else if (usaTeam.matchWinner) {
              banner.classList.add('icon-banner-right');
              score.prepend(banner);
            }
          } // TODO: setup display when match state is NOT complete
          // setup match media
          // if (intlTeam.media && usaTeam.media) {
          //   const hasVideo = intlTeam.media.hasVideo === 'true' || usaTeam.media.hasVideo === 'true';
          //   const hasArticle = intlTeam.media.hasArticle === 'true' || usaTeam.media.hasArticle === 'true';
          //   if (hasVideo || hasArticle) {
          //     const btnContainer = document.createElement('div');
          //     btnContainer.className = 'button-container';
          //     if (hasVideo) btnContainer.append(createMediaBtn('video', placeholders));
          //     if (hasArticle) btnContainer.append(createMediaBtn('article', placeholders));
          //     score.append(btnContainer);
          //   }
          // }
          matchRow.append(intlCell, score, usaCell);
          body.append(matchRow);
        });
        table.append(caption, body);
        rounds.prepend(table);
      });
      block.append(rounds);
    }
    // build legend
    // const legend = document.createElement('div');
    // legend.className = 'leaderboard-legend';
    // legend.innerHTML = `<p><strong>${placeholders.legend}</strong></p>
    //   <ul>
    //     <li>${createMediaBtn('video', placeholders, true).outerHTML} = ${placeholders.videoLegend}</li>
    //     <li>${createMediaBtn('article', placeholders, true).outerHTML} = ${placeholders.articleLegend}</li>
    //     <li><span class="leaderboard-legend-key">#</span> = ${placeholders.hashLegend}</li>
    //   </ul>`;
    // decorateIcons(legend);
    // block.append(legend);
    // build abbreviations
    const abbreviations = document.createElement('div');
    abbreviations.className = 'leaderboard-abbreviations';
    abbreviations.innerHTML = `<p><strong>${placeholders.abbreviations}</strong></p>
      <ul>
        <li><span class="leaderboard-abbreviations-key">T</span> = ${placeholders.tied}</li>
        <li><span class="leaderboard-abbreviations-key">C</span> = ${placeholders.conceded}</li>
        <li><span class="leaderboard-abbreviations-key">WD</span> = ${placeholders.withdrawn}</li>
        <li><span class="leaderboard-abbreviations-key">DQ</span> = ${placeholders.disqualified}</li>
        <li><span class="leaderboard-abbreviations-key">DNS</span> = ${placeholders.didNotStart}</li>
      </ul>`;
    block.append(abbreviations);
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadScript('https://microservice.pgatour.com/js', () => {
        if (block.className.includes('full')) {
          populateFullLeaderboard(block, config);
        } else {
          populateLeaderboard(block, config);
        }
      });
    }
  }, { threshold: 0 });

  observer.observe(block);
}
