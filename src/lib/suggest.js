/**
 * Suggestion copy from the kiosk design: time-of-day picks, "not sure what to order?" groups,
 * pairings and the special of the day. Everything refers to menu-meta ids (dv-masala, cf-hot …);
 * a suggestion is simply skipped when the store's catalog doesn't carry that dish.
 */

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Sunday first, like Date.getDay().
const DAY_SPECIAL = [
  ['rc-chowchow', 'Sunday breakfast, the Karnataka way.'],
  ['id-bthatte', 'Start the week soft and light.'],
  ['rc-bisi', 'Tuesday comfort in a bowl.'],
  ['rc-puli', 'Midweek, temple style.'],
  ['dv-open', 'Benne Thursday.'],
  ['rc-vangi', 'Friday spice.'],
  ['dv-masala', "Weekend benne. You've earned it."],
];

export function todaySpecial(now = new Date()) {
  const d = now.getDay();
  return { id: DAY_SPECIAL[d][0], line: DAY_SPECIAL[d][1], day: WEEKDAYS[d] };
}

/** Cold coffee through the afternoon, hot otherwise. */
export function coffeeForNow(now = new Date()) {
  const h = now.getHours();
  return h >= 12 && h < 17 ? 'cf-cold' : 'cf-hot';
}

export function moodNow(now = new Date()) {
  const h = now.getHours();
  if (h < 11) return { k: 'Good morning', t: 'Morning tiffin', p: 'A Benne Masala Dose and a Hot Filter Coffee. The way Karnataka starts the day.', ids: ['dv-masala', 'cf-hot'] };
  if (h < 16) return { k: 'Lunch hour', t: 'Rice and something sweet', p: 'Bisi Bele Bath or Temple Puliyogare, with Kesari Bath to finish.', ids: ['rc-bisi', 'ds-kesari'] };
  if (h < 19) return { k: 'Evening tiffin', t: 'Crunch with coffee', p: 'Medu Wada and filter coffee: the evening ritual at every tiffin room.', ids: ['vd-medu', 'cf-hot'] };
  return { k: 'Tonight', t: 'Light and soft', p: 'Benne Thatte Idli and a Medu Wada make an easy, light dinner.', ids: ['id-bthatte', 'vd-medu'] };
}

/** "Not sure what to order?" — shown to guests who browse without adding anything. */
export const HELP_GROUPS = [
  { k: 'crisp', label: 'Something crisp', ids: ['dv-masala', 'bl-bpm', 'vd-medu'] },
  { k: 'soft', label: 'Soft and light', ids: ['id-bthatte', 'id-wada', 'id-chutney'] },
  { k: 'meal', label: 'A proper meal', ids: ['rc-bisi', 'rc-puli', 'rc-chowchow'] },
  { k: 'coffee', label: 'Just coffee and a bite', ids: ['cf-hot', 'cf-cold', 'vd-medu'] },
  { k: 'sweet', label: 'Something sweet', ids: ['ds-kesari', 'rc-chowchow', 'cf-hot'] },
];

const PAIR_BY_CAT = {
  davangere: ['cf-hot', 'vd-medu'],
  bengaluru: ['cf-hot', 'vd-medu'],
  idli: ['vd-medu', 'cf-hot'],
  vada: ['cf-hot', 'id-chutney'],
  rice: ['ds-kesari', 'cf-cold'],
  dessert: ['cf-hot', 'rc-khara'],
  coffee: ['vd-medu', 'ds-kesari'],
};

export const PAIR_WHY = {
  'cf-hot': 'Every tiffin ends with a hot tumbler.',
  'cf-cold': 'Cools down the spice.',
  'vd-medu': 'Add crunch to the softness.',
  'id-chutney': 'Make it a full tiffin.',
  'ds-kesari': 'Finish sweet, the Karnataka way.',
  'rc-khara': 'Sweet and spicy: a chow chow bath of your own.',
};

/** Menu ids that go well with a dish (by its menu-meta entry). */
export function pairIdsFor(menuItem) {
  if (!menuItem) return [];
  return (PAIR_BY_CAT[menuItem.category] || []).filter((id) => id !== menuItem.id);
}

/**
 * Up to three "add this?" nudges for the live order panel.
 * @param {Array<{id?: string, category?: string}>} metas menu-meta entries of the dishes in the cart
 */
export function orderNudges(metas) {
  const known = metas.filter(Boolean);
  if (!known.length) return [];
  const cats = known.map((m) => m.category);
  const ids = known.map((m) => m.id);
  const hasDrink = cats.includes('coffee');
  const hasFood = cats.some((c) => c !== 'coffee' && c !== 'addon');
  const hasRice = known.some((m) => m.category === 'rice' && m.id !== 'rc-chowchow');
  const hasSweet = cats.includes('dessert') || ids.includes('rc-chowchow');
  const hasVada = cats.includes('vada') || ids.includes('id-wada');
  const out = [];
  if (!hasDrink) {
    out.push({
      id: coffeeForNow(),
      title: (name) => `Add a ${name}?`,
      body: hasFood ? 'Every tiffin ends with a tumbler of filter coffee.' : 'Strong decoction, poured high for froth.',
    });
  }
  if (!hasVada) {
    out.push({
      id: 'vd-medu',
      title: () => 'Add a crispy Medu Wada?',
      body: hasDrink && !hasFood ? 'Made for dunking in your coffee.' : 'Golden and crisp, it goes with everything.',
    });
  }
  if (hasRice && !hasSweet) {
    out.push({ id: 'ds-kesari', title: () => 'Finish with Kesari Bath?', body: 'Sweet rava with ghee, the Karnataka way.' });
  }
  return out.slice(0, 3);
}
