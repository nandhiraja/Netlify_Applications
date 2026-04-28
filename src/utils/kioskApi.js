/**
 * Shared helpers for KTR kiosk HTTP API (see API.md).
 * Store-scoped routes require X-Store-Id; payments do not.
 */

const NGROK_HEADER = 'ngrok-skip-browser-warning';

export function getCatalogChannel() {
  return import.meta.env.VITE_CATALOG_CHANNEL || 'Palas Kiosk';
}

export function getKioskBaseUrl() {
  const url = import.meta.env.VITE_Base_url;
  if (url == null || String(url).trim() === '') return '';
  return String(url).trim().replace(/\/$/, '');
}

export function getKioskConfig() {
  try {
    const raw = localStorage.getItem('kiosk_config');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** X-Store-Id value: numeric stores.id or case-insensitive store_code (API.md). */
export function getStoreIdForHeader() {
  const c = getKioskConfig();
  if (!c) return null;
  if (c.store_id != null && c.store_id !== '') return String(c.store_id);
  if (c.store_code) return String(c.store_code);
  return null;
}

export function defaultFetchHeaders() {
  return {
    [NGROK_HEADER]: 'true',
  };
}

/**
 * Headers for routes that require X-Store-Id (catalog, orders, etc.).
 * @param {Record<string, string>} [extra] — e.g. { 'Content-Type': 'application/json' }
 */
export function storeScopedHeaders(extra = {}) {
  const storeId = getStoreIdForHeader();
  if (!storeId) {
    throw new Error('Kiosk store is not configured');
  }
  return {
    ...defaultFetchHeaders(),
    'X-Store-Id': storeId,
    ...extra,
  };
}
