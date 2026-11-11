/**
 * Paid orders from this kiosk, kept on the device so staff can reprint a bill later
 * (see ReprintPage). Newest first; old entries drop off by age and count.
 */

const KEY = 'ktr_order_history';
const MAX_ORDERS = 80;
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function listCompletedOrders() {
  const cutoff = Date.now() - MAX_AGE_MS;
  return read().filter((o) => o && o.orderId && o.at > cutoff);
}

/** Records a paid order once (repeat calls for the same order are ignored). */
export function saveCompletedOrder(order) {
  if (!order?.orderId || !order.orderDetails) return;
  let list = listCompletedOrders();
  if (list.some((o) => o.orderId === order.orderId)) return;
  list = [{ ...order, at: Date.now() }, ...list].slice(0, MAX_ORDERS);
  // If storage is full, keep the newest orders rather than failing.
  while (list.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return;
    } catch {
      list = list.slice(0, Math.floor(list.length / 2));
    }
  }
}
