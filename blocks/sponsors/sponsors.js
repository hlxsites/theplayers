import {
  createOptimizedPicture,
  lookupPages,
  fetchPlaceholders,
  toClassName,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  const pages = await lookupPages();
  const { sponsorOrder } = await fetchPlaceholders();
  const sponsors = pages.filter((e) => e.path.startsWith('/sponsors/'));
  const orderedSponsors = [];
  if (sponsorOrder) {
    sponsorOrder.split(',').forEach((sp) => {
      // eslint-disable-next-line no-param-reassign
      sp = sp.trim();
      const match = sponsors.find((sponsor) => sponsor.title === sp);
      if (match) {
        // remove match from sponsors
        sponsors.splice(sponsors.indexOf(match), 1);
        // add match to ordered sponsors
        orderedSponsors.push(match);
      }
    });
  }

  // combine ordered sponsors with any remaining unordered sponsors
  [...orderedSponsors, ...sponsors].forEach((sponsor) => {
    const card = document.createElement('div');
    card.className = 'sponsors-sponsor';
    const wrapper = document.createElement('div');
    const front = document.createElement('div');
    front.className = 'sponsors-sponsor-front';
    front.innerHTML = `${createOptimizedPicture(sponsor.image, sponsor.title, false, [{ width: '300' }]).outerHTML}`;
    const back = document.createElement('div');
    back.className = `sponsors-sponsor-back sponsor-${toClassName(sponsor.title)}`;
    back.innerHTML = `<h2>${sponsor.title}</h2>
      <p>${sponsor.description}</p>
      <p class="button-container"><a class="button" href="${sponsor.link}">${sponsor.title.replace(' ', '')}.com</a></p>`;
    wrapper.append(front, back);
    card.append(wrapper);
    block.append(card);
  });
}
