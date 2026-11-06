import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/ktr.css';
import { useCart } from './CartContext';
import { activeVariations, rupee } from '../lib/catalog';
import { dishImage } from '../lib/dishImages';

/**
 * Item sheet: photo, story, Petpooja variations and add-on groups (min/max rules), free-text
 * kitchen options and a note, and — for mixed orders — eat here or parcel.
 */
const MenuItemModal = ({ item, menuItem = null, addonGroups = [], orderType = 'dine-in', onClose, onAddToCart }) => {
  const { addItem } = useCart();
  const variations = activeVariations(item);
  const hasVariants = variations.length > 0;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [options, setOptions] = useState([]);
  const [note, setNote] = useState('');
  const [lineType, setLineType] = useState('dine-in');

  // Add-on groups configured on this item, with their selection rules.
  const groups = useMemo(() => {
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
  }, [item, addonGroups]);

  const toggleAddon = ({ group, max, radio }, addonItem) => {
    const gid = group.addongroupid;
    setSelectedAddons((prev) => {
      const cur = prev[gid] || [];
      const on = cur.some((a) => a.addonitemid === addonItem.addonitemid);
      if (on) return radio ? prev : { ...prev, [gid]: cur.filter((a) => a.addonitemid !== addonItem.addonitemid) };
      if (radio) return { ...prev, [gid]: [addonItem] };
      if (max > 0 && cur.length >= max) return prev;
      return { ...prev, [gid]: [...cur, addonItem] };
    });
  };

  const toggleOption = (opt) =>
    setOptions((cur) => (cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]));

  const basePrice = hasVariants ? (selectedVariation ? parseFloat(selectedVariation.price) || 0 : 0) : item.price;
  const addonsTotal = Object.values(selectedAddons)
    .flat()
    .reduce((s, a) => s + (parseFloat(a.addonitem_price) || 0), 0);
  const priceBeforeTax = basePrice + addonsTotal;
  const taxPerUnit = (item.taxes || []).reduce((s, t) => s + (priceBeforeTax * t.percentage) / 100, 0);
  const total = (priceBeforeTax + taxPerUnit) * quantity;

  const unmetGroup = groups.find((g) => g.min > 0 && (selectedAddons[g.group.addongroupid]?.length || 0) < g.min);
  const blocked = (hasVariants && !selectedVariation) || Boolean(unmetGroup);

  const handleAdd = () => {
    const addon_items = Object.values(selectedAddons)
      .flat()
      .map((a) => ({
        addon_item_id: a.addonitemid,
        quantity: 1,
        name: a.addonitem_name,
        price: parseFloat(a.addonitem_price) || 0,
      }));
    const parcel = orderType === 'mixed' && lineType === 'takeaway';
    const orderItem = {
      ...item,
      quantity,
      finalPrice: total,
      pricePerUnit: total / quantity,
      timestamp: Date.now(),
      lineType: orderType === 'mixed' ? lineType : undefined,
      selectedCustomizations: {
        variation: selectedVariation
          ? { variation_id: selectedVariation.id, name: selectedVariation.name, price: parseFloat(selectedVariation.price) || 0 }
          : null,
        addons: addon_items,
        options,
        note: note.trim() || null,
        parcel,
      },
    };
    onAddToCart(orderItem);
    addItem(orderItem);
    onClose();
  };

  const img = dishImage(item);
  const kitchenOptions = menuItem?.options || [];

  return (
    <div className="ktr scrim" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-label={item.itemName} onClick={(e) => e.stopPropagation()}>
        <div className={`ph ${img ? '' : 'pl'}`} style={img ? { backgroundImage: `url(${img})` } : undefined}>
          {!img && item.itemName.split(' ')[0]}
          <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="bd">
          <div>
            <div className="sheet-tags">
              {menuItem?.signature && <span className="tag sig">Signature</span>}
              {menuItem?.traditional && <span className="tag trad">Traditional</span>}
            </div>
            <h3>{item.itemName}</h3>
          </div>
          {(menuItem?.lead || item.itemDescription) && <p className="lead">{menuItem?.lead || item.itemDescription}</p>}
          {menuItem?.fact && (
            <div className="fact">
              <b>Did you know? </b>
              {menuItem.fact}
            </div>
          )}

          {hasVariants && (
            <div>
              <h4>Choose one <span className="h-sub">Required</span></h4>
              <div className="mod-grid">
                {variations.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="mod-btn"
                    aria-pressed={selectedVariation?.id === v.id}
                    onClick={() => setSelectedVariation(v)}
                  >
                    {v.name} · {rupee(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {groups.map((g) => (
            <div key={g.group.addongroupid}>
              <h4>
                {g.group.addongroup_name || 'Add-ons'}
                <span className="h-sub">
                  {g.min > 0 ? `Pick ${g.min}${g.max > g.min ? `–${g.max}` : ''}` : g.max > 0 ? `Up to ${g.max}` : 'Optional'}
                </span>
              </h4>
              <div className="addon-grid">
                {g.group.addongroupitems.map((a) => {
                  const on = (selectedAddons[g.group.addongroupid] || []).some((x) => x.addonitemid === a.addonitemid);
                  return (
                    <button key={a.addonitemid} type="button" className={`addon ${on ? 'on' : ''}`} onClick={() => toggleAddon(g, a)}>
                      <span>
                        <b>{a.addonitem_name}</b>
                        <span>{parseFloat(a.addonitem_price) > 0 ? `+ ${rupee(a.addonitem_price)}` : 'Free'}</span>
                      </span>
                      <span className="add-sm">{on ? 'Added' : 'Add'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {kitchenOptions.length > 0 && (
            <div>
              <h4>Make it your way <span className="h-sub">Free</span></h4>
              <div className="mod-grid">
                {kitchenOptions.map((opt) => (
                  <button key={opt} type="button" className="mod-btn" aria-pressed={options.includes(opt)} onClick={() => toggleOption(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4>Note for the kitchen <span className="h-sub">Optional</span></h4>
            <input
              className="note-in"
              type="text"
              maxLength={200}
              placeholder="e.g. no onion, extra chutney"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {orderType === 'mixed' && (
            <div>
              <h4>For this dish</h4>
              <div className="split" role="group" aria-label="Eat here or take away">
                <button type="button" aria-pressed={lineType === 'dine-in'} onClick={() => setLineType('dine-in')}>Eat here</button>
                <button type="button" aria-pressed={lineType === 'takeaway'} onClick={() => setLineType('takeaway')}>Take away</button>
              </div>
            </div>
          )}
        </div>

        <div className="sheet-foot">
          <div className="step">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="One less">−</button>
            <output>{quantity}</output>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="One more">+</button>
          </div>
          <button type="button" className="btn primary" disabled={blocked} onClick={handleAdd}>
            <span>{hasVariants && !selectedVariation ? 'Choose an option' : unmetGroup ? `Pick ${unmetGroup.group.addongroup_name || 'add-ons'}` : 'Add to order'}</span>
            <span className="price">{rupee(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

MenuItemModal.propTypes = {
  item: PropTypes.object.isRequired,
  menuItem: PropTypes.object,
  addonGroups: PropTypes.array,
  orderType: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func,
};

export default MenuItemModal;
