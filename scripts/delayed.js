// eslint-disable-next-line import/no-cycle
import { decorateIcons, sampleRUM, fetchPlaceholders } from './scripts.js';

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

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
window.pgatour = window.pgatour || {};
window.pgatour.tracking = {
  branch: {
    apiKey: 'key_live_nnTvCBCejtgfn40wtbQ6ckiprsemNktJ',
    isWebView: 'false',
  },
  krux: {
    id: '',
  },
  indexExchange: {
    status: false,
  },
};
window.pgatour.docWrite = document.write.bind(document);

loadScript('https://assets.adobedtm.com/d17bac9530d5/90b3c70cfef1/launch-1ca88359b76c.min.js');

/* setup favorite players */
function alphabetize(a, b) {
  if (a.nameL.toUpperCase() < b.nameL.toUpperCase()) return -1;
  if (a.nameL.toUpperCase() > b.nameL.toUpperCase()) return 1;
  return 0;
}

async function loadPlayers() {
  if (!window.players) {
    const resp = await fetch('https://statdata.pgatour.com/players/player.json');
    if (resp.ok) {
      const { plrs } = await resp.json();
      const players = {
        byId: {},
        r: [],
        s: [],
        h: [],
      };
      plrs.forEach((p) => {
        if (!players.byId[p.pid]) {
          players.byId[p.pid] = p;
          // display in pga tour (R)
          if (p.disR === 'y') players.r.push(p);
          // display in champions tour (S)
          if (p.disS === 'y') players.s.push(p);
          // display in korn ferry tour (H)
          if (p.disH === 'y') players.h.push(p);
        }
      });
      players.r.sort(alphabetize);
      players.s.sort(alphabetize);
      players.h.sort(alphabetize);
      window.players = players;
    }
  }
  return window.players || {};
}

function removeFavoritePlayer(e) {
  e.preventDefault();
  // const id = e.target.closest('div').getAttribute('data-id');
  // console.log('remove pid:', id);
}

function updateSelectPlayer(select, tour, players) {
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select Player';
  select.prepend(defaultOption);
  players.forEach((player) => {
    const option = document.createElement('option');
    option.setAttribute('data-tour', tour);
    option.setAttribute('value', player.pid);
    option.textContent = `${player.nameL}, ${player.nameF}`;
    select.append(option);
  });
}

async function setupFavoritePlayersScreen(userData) {
  const players = await loadPlayers();
  // setup user favorites
  const wrapper = document.createElement('div');
  wrapper.className = 'gigya-your-favorites';
  const h2 = document.querySelector('h2[data-translation-key="HEADER_53211634253006840_LABEL"]');
  if (h2) h2.after(wrapper);
  if (userData && userData.favorites) {
    userData.favorites.forEach((favorite) => {
      const player = players.byId[favorite.playerId];
      const row = document.createElement('div');
      row.setAttribute('data-tour', favorite.tourCode);
      row.setAttribute('data-id', favorite.playerId);
      row.innerHTML = `<p>${player.nameF} ${player.nameL}</p>
        <button><span class="icon icon-close"></span></button>`;
      const button = row.querySelector('button');
      button.addEventListener('click', removeFavoritePlayer);
      wrapper.append(row);
    });
  }
  // setup add more
  const tourDropdown = document.querySelector('select[name="data.tour"]');
  const findPlayer = document.querySelector('input[name="data.findPlayer"]');
  const selectPlayer = document.querySelector('select[name="data.players"]');
  if (tourDropdown && findPlayer && selectPlayer) {
    tourDropdown.addEventListener('change', () => {
      const { value } = tourDropdown;
      findPlayer.setAttribute('data-filter', value);
      selectPlayer.setAttribute('data-filter', value);
      updateSelectPlayer(selectPlayer, value, players[value]);
    });
    updateSelectPlayer(selectPlayer, tourDropdown.value, players[tourDropdown.value]);
  }
}

function setupAccountMenu(res) {
  // setup favorite players
  if (res.currentScreen === 'gigya-players-screen') {
    setupFavoritePlayersScreen(res.data);
  }
  // setup logout
  const logoutBtn = document.querySelector('a[href="javascript:pgatour.GigyaSocialize.logout()"]');
  if (logoutBtn) {
    logoutBtn.removeAttribute('href');
    // eslint-disable-next-line no-use-before-define
    logoutBtn.addEventListener('click', logout);
    logoutBtn.style.cursor = 'pointer';
  }
}

/* setup user authentication */
function showAccountMenu() {
  // eslint-disable-next-line no-undef
  gigya.accounts.showScreenSet({
    screenSet: 'Website-ManageProfile',
    onAfterScreenLoad: setupAccountMenu,
  });
}

function showLoginMenu() {
  // eslint-disable-next-line no-undef
  gigya.accounts.showScreenSet({
    screenSet: 'Website-RegistrationLogin',
    startScreen: 'gigya-long-login-screen',
    // eslint-disable-next-line no-use-before-define
    onAfterSubmit: updateUserButton,
  });
}

function updateUserButton(user) {
  // eslint-disable-next-line no-param-reassign
  if (user.eventName === 'afterSubmit') user = user.response.user;
  const button = document.getElementById('nav-user-button');
  if (user && user != null && user.isConnected) {
    // add button caret
    button.innerHTML = `${button.innerHTML}<span class="icon icon-caret"></span>`;
    // update button text
    const text = button.querySelector('span:not([class])');
    text.textContent = 'Manage Profile';
    // update button icon
    if (user.thumbnailURL.length > 0) {
      const icon = button.querySelector('span.icon');
      const img = document.createElement('img');
      img.src = user.thumbnailURL;
      img.alt = 'User Profile Thumbnail';
      icon.replaceWith(img);
    }
    // reset click to open manage account
    button.removeEventListener('click', showLoginMenu);
    button.addEventListener('click', showAccountMenu);
  }
}

function clearUserButton() {
  const button = document.getElementById('nav-user-button');
  if (button) {
    // remove caret
    button.querySelector('.icon.icon-caret').remove();
    // update button text
    const text = button.querySelector('span:not([class])');
    text.textContent = 'Login/Register';
    // update button icon
    const img = button.querySelector('img');
    if (img) {
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-user');
      img.replaceWith(icon);
      decorateIcons(button);
    }
    // reset click to open login menu
    button.removeEventListener('click', showAccountMenu);
    button.addEventListener('click', showLoginMenu);
  }
}

function logout() {
  // eslint-disable-next-line no-undef
  gigya.accounts.hideScreenSet({ screenSet: 'Website-ManageProfile' });
  // eslint-disable-next-line no-undef
  gigya.socialize.logout({ callback: clearUserButton });
}

function setupUserButton(res) {
  const button = document.getElementById('nav-user-button');
  if (button) {
    if (res && res != null && res.errorCode === 0) { // user is logged in
      const user = res.profile;
      user.isConnected = true;
      updateUserButton(user);
    } else {
      // set click to open login menu
      button.addEventListener('click', showLoginMenu);
    }
    button.setAttribute('data-status', 'initialized');
  }
}

function checkIfLoggedIn(res) {
  if (res && res != null && res.errorCode === 0) { // user is logged in
    // eslint-disable-next-line no-undef
    gigya.accounts.getAccountInfo({ callback: setupUserButton });
  } else {
    setupUserButton();
  }
}

function setupGigya() {
  // eslint-disable-next-line no-undef
  gigya.accounts.session.verify({ callback: checkIfLoggedIn });
}

function initGigya() {
  loadScript(
    'https://cdns.gigya.com/JS/socialize.js?apikey=3__4H034SWkmoUfkZ_ikv8tqNIaTA0UIwoX5rsEk96Ebk5vkojWtKRZixx60tZZdob',
    setupGigya,
  );
}

initGigya();

/* status bar countdown and weather */
function parseCountdown(ms) {
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  let days = Math.floor(ms / dayMs);
  let hours = Math.floor((ms - days * dayMs) / hourMs);
  let minutes = Math.round((ms - days * dayMs - hours * hourMs) / 60000);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  } else if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (hours === 24) {
    days += 1;
    hours = 0;
  } else if (hours < 10) {
    hours = `0${hours}`;
  }
  return { days, hours, minutes };
}

function findTimeBetween(date, now = new Date()) {
  return Math.abs(date - now);
}

function updateCountdown() {
  const days = document.getElementById('countdown-days');
  const hours = document.getElementById('countdown-hours');
  const minutes = document.getElementById('countdown-minutes');
  const countdownData = parseCountdown(findTimeBetween(window.placeholders.countdown));
  days.textContent = countdownData.days;
  hours.textContent = countdownData.hours;
  minutes.textContent = countdownData.minutes;
}

async function populateStatusBar(statusBar) {
  if (statusBar) {
    const data = document.createElement('div');
    data.className = 'status-bar-data';
    // fetch placeholders
    try {
      const placeholders = await fetchPlaceholders();
      if (placeholders.course) data.insertAdjacentHTML('beforeend', `<div class="status-bar-course"><p>${placeholders.course}</p></div>`);
      if (placeholders.dates) data.insertAdjacentHTML('beforeend', `<div class="status-bar-dates"><p>${placeholders.dates}</p></div>`);
      // setup countdown
      if (placeholders.countdown) {
        window.placeholders.countdown = new Date(placeholders.countdown);
        const countdownData = parseCountdown(findTimeBetween(window.placeholders.countdown));
        const countdown = `<div class="status-bar-countdown">
          <p>
            <span id="countdown-days">${countdownData.days}</span> days : 
            <span id="countdown-hours">${countdownData.hours}</span> hours : 
            <span id="countdown-minutes">${countdownData.minutes}</span> minutes
          </p>
        </div>`;
        data.insertAdjacentHTML('beforeend', countdown);
        setInterval(updateCountdown, 60 * 1000); // update countdown every minute
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('failed to load placeholders', error);
    }
    // fetch weather
    try {
      const resp = await fetch('https://www.pgatour.com/bin/data/feeds/weather.json/r011');
      const { current_observation: weatherData } = await resp.json();
      const location = weatherData.display_location.full;
      const icon = weatherData.icon_url.replace('.gif', '.png');
      const temp = weatherData.temp_f;
      const weather = document.createElement('div');
      weather.className = 'status-bar-weather';
      weather.innerHTML = `<p>
          <a href="/weather">
            <span>${location}</span>
            <img src="${icon}" alt="${weatherData.weather}"/ >
            <span class="status-bar-temp">${temp}</span>
          </a>
        </p>`;
      data.append(weather);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('failed to load weather', error);
    }
    if (data.hasChildNodes()) statusBar.append(data);
  }
}

populateStatusBar(document.querySelector('header > .status-bar'));

/* setup cookie preferences */
function getCookie(cookieName) {
  const name = `${cookieName}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const split = decodedCookie.split(';');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < split.length; i++) {
    let c = split[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return null;
}

async function setGeoCookies() {
  try {
    const resp = await fetch('https://geolocation.onetrust.com/cookieconsentpub/v1/geo/location');
    if (resp.ok) {
      const text = await resp.text();
      const json = JSON.parse(text.replace('jsonFeed(', '').replace('"});', '"}'));
      Object.keys(json).forEach((key) => {
        const cookieName = `PGAT_${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const cookie = getCookie(cookieName);
        if (!cookie || cookie !== json[key]) document.cookie = `${cookieName}=${json[key]}`;
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Setting geo cookies failed', error);
  }
}

const cookieScript = loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', setGeoCookies);
cookieScript.setAttribute('data-domain-script', '262c6c79-a114-41f0-9c07-52cb1fb7390c');

/* open external links in new tab */
function updateExternalLinks() {
  document.querySelectorAll('a[href]').forEach((a) => {
    try {
      const { origin } = new URL(a.href, window.location.href);
      if (origin && origin !== window.location.origin) {
        a.setAttribute('rel', 'noopener');
        a.setAttribute('target', '_blank');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid link: ${a.href}`);
    }
  });
}

updateExternalLinks();
