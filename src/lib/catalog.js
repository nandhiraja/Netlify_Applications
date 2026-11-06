/**
 * Petpooja catalog for the configured store and channel, fetched once per kiosk session and
 * shared by the menu, item sheet and checkout. Items are enriched with tags, taxes and taxAmount
 * exactly like the old MenuSection did, so cart and payment maths are unchanged.
 */
import { useCallback, useEffect, useState } from 'react';
import { getCatalogChannel, getKioskBaseUrl, storeScopedHeaders } from '../utils/kioskApi';

let cache = null;

function enrich(data) {
  const tags = data.itemTags || [];
  const taxTypes = data.taxTypes || [];
  const items = (data.items || []).map((item) => {
    const taxes = (item.taxTypeIds || []).map((id) => taxTypes.find((t) => t.taxTypeId === id)).filter(Boolean);
    return {
      ...item,
      tags: (item.itemTagIds || []).map((id) => tags.find((t) => t.itemTagId === id)?.name).filter(Boolean),
      taxes,
      taxAmount: taxes.reduce((sum, t) => sum + (item.price * t.percentage) / 100, 0),
    };
  });
  return { ...data, items };
}

export async function fetchCatalog() {
  const base = getKioskBaseUrl();
  if (!base) throw new Error('VITE_Base_url is not set');
  const channel = encodeURIComponent(getCatalogChannel());
  const res = await fetch(`${base}/catalog/?channel=${channel}`, { headers: storeScopedHeaders() });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  cache = enrich(await res.json());
  return cache;
}

/** Drops the cached catalog (the attract screen calls this so each guest sees fresh prices). */
export function resetCatalog() {
  cache = null;
}

export function useCatalog() {
  const [state, setState] = useState(() => ({ data: cache, error: null, loading: !cache }));

  const load = useCallback(() => {
    setState({ data: null, error: null, loading: true });
    fetchCatalog()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((e) => setState({ data: null, error: e.message || 'Failed to load menu', loading: false }));
  }, []);

  useEffect(() => {
    if (!cache) load();
  }, [load]);

  return { ...state, reload: load };
}

/** Active variations in POS order (same rule as the old item modal). */
export function activeVariations(item) {
  if (!item?.itemallowvariation || !Array.isArray(item.variation)) return [];
  return item.variation
    .filter((v) => v.active === undefined || String(v.active) === '1')
    .sort((a, b) => (parseInt(a.variationrank) || 0) - (parseInt(b.variationrank) || 0));
}

/** Pre-tax display price: base price, or the lowest variation price. */
export function displayPrice(item) {
  const vars = activeVariations(item);
  if (vars.length) return Math.min(...vars.map((v) => parseFloat(v.price) || 0));
  return item.price || 0;
}

export function rupee(n) {
  return `₹${Math.round(Number(n) || 0)}`;
}
