/**
 * Builds cart lines the same way everywhere (item sheet, one-tap suggestions), so cart and payment
 * maths stay identical however a dish was added.
 */
import { activeVariations } from './catalog';

/** Add-on groups configured on an item, with their Petpooja selection rules. */
export function addonGroupsFor(item, addonGroups = []) {
  if (!item?.itemallowaddon || !Array.isArray(item.addon)) return [];
  return item.addon
    .map((def) => {
      const group = addonGroups.find((g) => g.addongroupid === def.addon_group_id);
      if (!group?.addongroupitems?.length) return null;
      const min = parseInt(def.addon_item_selection_min || 0, 10);
      const max = parseInt(def.addon_item_selection_max || 0, 10);
      return { group, min, max, radio: max === 1 };
    })
    .filter(Boolean);
}

/** True when the guest has to choose something (a variation or a required add-on) before adding. */
export function needsChoice(item, addonGroups = []) {
  if (activeVariations(item).length > 0) return true;
  return addonGroupsFor(item, addonGroups).some((g) => g.min > 0);
}

/**
 * @param {object} item enriched catalog item
 * @param {object} [o]
 * @param {number} [o.quantity]
 * @param {object|null} [o.variation] Petpooja variation row
 * @param {object[]} [o.addons] Petpooja add-on item rows
 * @param {string[]} [o.options] free kitchen options
 * @param {string} [o.note]
 * @param {'dine-in'|'takeaway'} [o.lineType] only used for mixed orders
 * @param {string} [o.orderType]
 */
export function buildCartLine(item, o = {}) {
  const { quantity = 1, variation = null, addons = [], options = [], note = '', lineType = 'dine-in', orderType = 'dine-in' } = o;
  const base = variation ? parseFloat(variation.price) || 0 : item.price || 0;
  const addonsTotal = addons.reduce((s, a) => s + (parseFloat(a.addonitem_price) || 0), 0);
  const beforeTax = base + addonsTotal;
  const taxPerUnit = (item.taxes || []).reduce((s, t) => s + (beforeTax * t.percentage) / 100, 0);
  const pricePerUnit = beforeTax + taxPerUnit;
  const mixed = orderType === 'mixed';
  return {
    ...item,
    quantity,
    finalPrice: pricePerUnit * quantity,
    pricePerUnit,
    timestamp: Date.now(),
    lineType: mixed ? lineType : undefined,
    selectedCustomizations: {
      variation: variation
        ? { variation_id: variation.id, name: variation.name, price: parseFloat(variation.price) || 0 }
        : null,
      addons: addons.map((a) => ({
        addon_item_id: a.addonitemid,
        quantity: 1,
        name: a.addonitem_name,
        price: parseFloat(a.addonitem_price) || 0,
      })),
      options,
      note: (note || '').trim() || null,
      parcel: mixed && lineType === 'takeaway',
    },
  };
}
