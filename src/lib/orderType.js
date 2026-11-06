/**
 * Order type for the session: 'dine-in', 'takeaway' or 'mixed' (some items to eat here, some to
 * take away). Stored in localStorage('orderType') like before; mixed orders mark each cart line
 * with lineType 'dine-in' | 'takeaway'.
 */

export const ORDER_TYPES = {
  'dine-in': { label: 'Dine in', print: 'DINE IN', payload: 'DINEIN' },
  takeaway: { label: 'Take away', print: 'TAKE AWAY', payload: 'TAKEAWAY' },
  mixed: { label: 'Dine in + Take away', print: 'DINE IN + TAKE AWAY', payload: 'DINEIN' },
};

export function readOrderType() {
  const v = localStorage.getItem('orderType');
  return ORDER_TYPES[v] ? v : 'dine-in';
}

export function orderTypeLabel(type = readOrderType()) {
  return ORDER_TYPES[type]?.label ?? 'Dine in';
}

/** Label printed on bills and KOTs. */
export function orderTypePrintLabel(type = readOrderType()) {
  return ORDER_TYPES[type]?.print ?? 'DINE IN';
}

/** Order-level order_type for POST /orders (mixed orders are dine-in with parcel lines). */
export function orderTypePayload(type = readOrderType()) {
  return ORDER_TYPES[type]?.payload ?? 'DINEIN';
}

/** Effective 'dine-in' | 'takeaway' for one cart line. */
export function lineType(item, type = readOrderType()) {
  if (type === 'mixed') return item?.lineType === 'takeaway' ? 'takeaway' : 'dine-in';
  return type === 'takeaway' ? 'takeaway' : 'dine-in';
}
