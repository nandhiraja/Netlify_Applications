/**
 * Hard-coded dish copy (descriptions, facts, Signature/Traditional tags, kitchen options) from
 * GET /tms/menu-meta — the same content the token board uses. Matched to Petpooja catalog items
 * by name, so the kiosk works without it (cards just show the catalog data).
 */
import { useEffect, useState } from 'react';
import { defaultFetchHeaders, getKioskBaseUrl } from '../utils/kioskApi';

let cache = null;
let inflight = null;

function normalise(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildIndex(meta) {
  const byName = new Map();
  for (const item of meta.items || []) {
    for (const n of [item.name, ...(item.aliases || [])]) {
      const k = normalise(n);
      if (!byName.has(k)) byName.set(k, item);
    }
  }
  const categories = new Map((meta.categories || []).map((c) => [c.id, c]));
  return { ...meta, byName, categoryById: categories };
}

export function loadMenuMeta() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  const base = getKioskBaseUrl();
  if (!base) return Promise.resolve(null);
  inflight = fetch(`${base}/tms/menu-meta`, { headers: defaultFetchHeaders() })
    .then((r) => (r.ok ? r.json() : null))
    .then((meta) => {
      cache = meta ? buildIndex(meta) : null;
      return cache;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Menu content or null while loading / unavailable. */
export function useMenuMeta() {
  const [meta, setMeta] = useState(cache);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadMenuMeta().then((m) => alive && setMeta(m));
    return () => {
      alive = false;
    };
  }, []);
  return meta;
}

/**
 * Menu entry for a catalog item name: exact (normalised) match first, then the longest menu name
 * contained in it ("Medu Wada (2 pcs)" → Medu Wada). Mirrors the backend's match_menu_item.
 */
export function matchMenuItem(meta, itemName) {
  if (!meta || !itemName) return null;
  const key = normalise(itemName);
  const hit = meta.byName.get(key);
  if (hit) return hit;
  let best = null;
  for (const [n, m] of meta.byName) {
    if (n && key.includes(n) && (!best || n.length > best[0])) best = [n, m];
  }
  return best ? best[1] : null;
}

export function imageUrl(key) {
  return key ? `/img/${key}.jpg` : null;
}
