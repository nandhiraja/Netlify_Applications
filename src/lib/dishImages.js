/**
 * One image per dish, hard-coded in public/img/dishes:
 *  - .jpg: KTR's own photoshoot (shared by the KTR team)
 *  - .svg: KTR-style illustrations (wood table, cane mat, plate on banana leaf) for dishes the
 *          shoot doesn't cover yet. To swap one for a real photo, drop `<slug>.jpg` in
 *          public/img/dishes and change its entry below from .svg to .jpg.
 * Matched by Petpooja item name (both stores' spellings). Every dish on a store's menu gets its own
 * image; the Petpooja image is only used for dishes not listed here.
 */

const PHOTO = 'jpg';
const ART = 'svg';

// slug → [file type, names it matches]
const DISHES = {
  // Bengaluru dose
  'benne-masala-dose': [PHOTO, ['Benne Masala Dose']],
  'benne-plain-dose': [PHOTO, ['Benne Plain Dose']],
  'ghee-pudi-plain-dose': [PHOTO, ['Ghee Pudi Plain Dose']],
  'benne-garlic-roast-dose': [PHOTO, ['Benne Garlic Roast Dose', 'Benne Garlic Roast Masala Dose']],
  'ghee-pudi-masala-dose': [ART, ['Ghee Pudi Masala Dose']],
  'ghee-masala-dose': [ART, ['Ghee Masala Dose']],
  'benne-pudi-masala-dose': [ART, ['Benne Pudi Masala Dose']],
  'benne-pudi-masala': [ART, ['Benne Pudi Masala']], // a separate dish on the Versova menu
  'benne-pudi-plain-dose': [ART, ['Benne Pudi Plain Dose']],
  'ghee-plain-dose': [ART, ['Ghee Plain Dose']],
  'ghee-garlic-roast-dose': [ART, ['Ghee Garlic Roast Dose']],
  'benne-garlic-roast-plain-dose': [ART, ['Benne Garlic Roast Plain Dose']],
  // Davanagere dose
  'davanagere-benne-open-dose': [PHOTO, ['Davanagere Benne Open Dose', 'Benne Open Dose']],
  'davanagere-khali-dose': [PHOTO, ['Davanagere Khali Dose', 'Khali Dose']],
  'davanagere-benne-masala-dose': [ART, ['Davanagere Benne Masala Dose']],
  'davanagere-benne-sada-dose': [ART, ['Davanagere Benne Sada Dose', 'Benne Sada Dose']],
  // Idli
  'ghee-pudi-thatte-idli': [PHOTO, ['Ghee Pudi Thatte Idli']],
  'idli-wada': [PHOTO, ['Idli Wada', 'Idli Vada']],
  'idli-chutney': [PHOTO, ['Idli Chutney']],
  'ghee-pudi-idli': [ART, ['Ghee Pudi Idli']],
  'benne-idli': [ART, ['Benne Idli']],
  'benne-thatte-idli': [ART, ['Benne Thatte Idli']],
  'thatte-idli': [ART, ['Thatte Idli']],
  // Wada / snacks
  'medu-wada': [PHOTO, ['Medu Wada', 'Medu Vada']],
  'dal-vada': [PHOTO, ['Dal Vada', 'Dal Wada']],
  'maddur-wada': [ART, ['Maddur Wada', 'Maddur Vada']],
  // Paddu
  'pudi-paddu': [ART, ['Pudi Paddu']],
  'ghee-paddu': [ART, ['Ghee Paddu']],
  'plain-paddu': [ART, ['Plain Paddu']],
  // Rice and sweets
  'temple-puliyogare': [PHOTO, ['Temple Puliyogare', 'Puliyogare']],
  'bisi-bele-bath': [PHOTO, ['Bisi Bele Bath']],
  'shavige-bath': [PHOTO, ['Shavige Bath']],
  'kesari-bath': [PHOTO, ['Kesari Bath']],
  'khara-bath': [ART, ['Khara Bath']],
  // Coffee and extras
  'hot-filter-coffee': [PHOTO, ['Hot Filter Coffee', 'Filter Coffee']],
  'cold-filter-coffee': [PHOTO, ['Cold Filter Coffee']],
  'black-filter-coffee': [ART, ['Black Filter Coffee']],
  'drinking-water': [ART, ['Drinking Water', 'Water']],
};

// Last resort for dishes added to Petpooja later, by keyword in the item or category name.
const FALLBACKS = [
  [/paddu|paniyaram/, 'fallback-paddu'],
  [/idli/, 'fallback-idli'],
  [/wada|vada/, 'fallback-vada'],
  [/dose|dosa/, 'fallback-dose'],
  [/coffee|tea/, 'fallback-coffee'],
  [/bath|rice|puliyogare|sweet|kesari/, 'fallback-rice'],
];

function normalise(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const BY_NAME = new Map();
for (const [slug, [ext, names]] of Object.entries(DISHES)) {
  for (const n of names) BY_NAME.set(normalise(n), `/img/dishes/${slug}.${ext}`);
}

/** Curated image for a dish name: exact match, then the longest listed name it contains. */
export function curatedDishImage(itemName) {
  const key = normalise(itemName);
  if (!key) return null;
  if (BY_NAME.has(key)) return BY_NAME.get(key);
  let best = null;
  for (const [n, url] of BY_NAME) {
    if (key.includes(n) && (!best || n.length > best[0])) best = [n, url];
  }
  return best ? best[1] : null;
}

/**
 * Image for a catalog item: curated KTR image → the item's Petpooja image → a KTR-style
 * illustration for its kind of dish → null (the caller shows a plain tile).
 */
export function dishImage(item, categoryName = '') {
  const curated = curatedDishImage(item?.itemName);
  if (curated) return curated;
  if (item?.imageURL) return item.imageURL;
  const text = `${item?.itemName || ''} ${categoryName}`.toLowerCase();
  const hit = FALLBACKS.find(([re]) => re.test(text));
  return hit ? `/img/dishes/${hit[1]}.svg` : null;
}
