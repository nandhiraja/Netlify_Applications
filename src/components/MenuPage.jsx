import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ktr.css';
import { useCart } from './CartContext';
import MenuItemModal from './MenuItemModal';
import MenuSkeleton from './MenuSkeleton';
import { displayPrice, rupee, useCatalog, activeVariations } from '../lib/catalog';
import { matchMenuItem, useMenuMeta } from '../lib/menuMeta';
import { orderTypeLabel, readOrderType } from '../lib/orderType';
import { dishImage } from '../lib/dishImages';

/** Time-of-day suggestion card (copy from the kiosk design). */
function moodNow() {
  const h = new Date().getHours();
  if (h < 11) return { k: 'Good morning', t: 'Morning tiffin', p: 'A Benne Masala Dose and a Hot Filter Coffee. The way Karnataka starts the day.', ids: ['dv-masala', 'cf-hot'] };
  if (h < 16) return { k: 'Lunch hour', t: 'A proper Karnataka lunch', p: 'Bisi Bele Bath, then something sweet. Kesari Bath is the classic finish.', ids: ['rc-bisi', 'ds-kesari'] };
  if (h < 19) return { k: 'Evening tiffin', t: 'Crunch with coffee', p: 'Medu Wada and filter coffee: the evening ritual at every tiffin room.', ids: ['vd-medu', 'cf-hot'] };
  return { k: 'Dinner', t: 'Light and comforting', p: 'Thatte Idli with benne, and a cold filter coffee to finish.', ids: ['id-bthatte', 'cf-cold'] };
}

const MenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderType = location.state?.orderType || readOrderType();
  const { data, error, loading, reload } = useCatalog();
  const meta = useMenuMeta();
  const { cart, getCartTotal } = useCart();
  const [catId, setCatId] = useState(location.state?.category?.categoryId ?? null);
  const [sheetItem, setSheetItem] = useState(null);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(0);

  const categories = data?.categories || [];
  const activeCat = catId ?? categories[0]?.categoryId ?? null;

  // Catalog item → hard-coded menu entry (descriptions, tags, options).
  const metaFor = useMemo(() => {
    const m = new Map();
    for (const item of data?.items || []) m.set(item.itemId, matchMenuItem(meta, item.itemName));
    return m;
  }, [data, meta]);
  const byMenuId = useMemo(() => {
    const m = new Map();
    for (const item of data?.items || []) {
      const mm = metaFor.get(item.itemId);
      if (mm && !m.has(mm.id)) m.set(mm.id, item);
    }
    return m;
  }, [data, metaFor]);

  // Petpooja charge lines (packaging) are billed by the kiosk itself, not ordered as dishes.
  const isCharge = (i) => /\bcharges?\b/i.test(i.itemName || '');
  const items = (data?.items || []).filter((i) => i.categoryId === activeCat && !isCharge(i));
  const categoryName = (id) => categories.find((c) => c.categoryId === id)?.name || '';
  const inCart = useMemo(() => {
    const m = new Map();
    for (const it of cart.items) m.set(it.itemId, (m.get(it.itemId) || 0) + it.quantity);
    return m;
  }, [cart.items]);
  const count = cart.items.reduce((n, it) => n + it.quantity, 0);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
    return undefined;
  }, [count]);

  // "Make it complete?" nudge: food but no coffee → suggest one.
  const nudge = useMemo(() => {
    if (!cart.items.length) return null;
    const cats = cart.items.map((it) => metaFor.get(it.itemId)?.category).filter(Boolean);
    const hasCoffee = cats.includes('coffee');
    const hasFood = cats.some((c) => c !== 'coffee' && c !== 'addon');
    if (hasFood && !hasCoffee) {
      const h = new Date().getHours();
      const pick = byMenuId.get(h >= 12 && h < 17 ? 'cf-cold' : 'cf-hot') || byMenuId.get('cf-hot');
      if (pick) return { item: pick, title: `Add a ${pick.itemName}?`, body: 'Every tiffin ends with a tumbler of filter coffee.' };
    }
    if (hasCoffee && !hasFood) {
      const pick = byMenuId.get('vd-medu');
      if (pick) return { item: pick, title: `Add a ${pick.itemName}?`, body: 'Made for dunking in your coffee.' };
    }
    return null;
  }, [cart.items, metaFor, byMenuId]);

  if (loading) return <MenuSkeleton />;

  if (error) {
    return (
      <div className="ktr ktr-screen wrap center-msg">
        <h2>Unable to load the menu</h2>
        <p>{error}</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={reload}>Try again</button>
          <button type="button" className="btn soft" onClick={() => navigate('/')}>Back to start</button>
        </div>
        <small>Please check the connection or ask our staff for help.</small>
      </div>
    );
  }

  const mood = moodNow();
  const moodItems = mood.ids.map((id) => byMenuId.get(id)).filter(Boolean);

  return (
    <div className="ktr ktr-screen menu">
      <div className="topbar">
        <div className="topbar-in wrap">
          <img src="/img/logo.png" alt="KTR" />
          <button type="button" className="chip-type" onClick={() => navigate('/', { replace: true })} title="Change order type">
            {orderTypeLabel(orderType)}
          </button>
          <span className="spacer" />
          <button type="button" className="restart" onClick={() => navigate('/')}>Start over</button>
        </div>
      </div>
      <div className="topbar-plaid" />

      <nav className="cats wrap" aria-label="Menu categories">
        {categories.map((c) => (
          <button
            key={c.categoryId}
            type="button"
            className="cat"
            aria-pressed={c.categoryId === activeCat}
            onClick={() => setCatId(c.categoryId)}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <main className="content wrap">
        {moodItems.length > 0 && activeCat === categories[0]?.categoryId && (
          <section className="mood">
            <span className="k">{mood.k}</span>
            <h3>{mood.t}</h3>
            <p>{mood.p}</p>
            <div className="mood-picks">
              {moodItems.map((it) => (
                <button key={it.itemId} type="button" className="mood-pick" onClick={() => setSheetItem(it)}>
                  + {it.itemName}
                </button>
              ))}
            </div>
          </section>
        )}

        <h2 className="sec-title">
          {categories.find((c) => c.categoryId === activeCat)?.name}
          <small>{items.length} dishes</small>
        </h2>
        <div className="grid">
          {items.map((item) => {
            const mm = metaFor.get(item.itemId);
            const img = dishImage(item, categoryName(item.categoryId));
            const n = inCart.get(item.itemId) || 0;
            const variants = activeVariations(item).length > 0;
            return (
              <button key={item.itemId} type="button" className="item" onClick={() => setSheetItem(item)}>
                <span className={`ph ${img ? '' : 'pl'}`} style={img ? { backgroundImage: `url(${img})` } : undefined}>
                  {!img && <span className="pl-name">{item.itemName.split(' ')[0]}</span>}
                  <span className="tags">
                    {mm?.signature && <span className="tag sig">Signature</span>}
                    {mm?.traditional && <span className="tag trad">Traditional</span>}
                  </span>
                </span>
                <span className="tx">
                  <b>{item.itemName}</b>
                  {(mm?.short || item.itemDescription) && <span className="ds">{mm?.short || item.itemDescription}</span>}
                  <span className="row">
                    <span className="price">{variants ? `from ${rupee(displayPrice(item))}` : rupee(displayPrice(item))}</span>
                    {n > 0 && <span className="incart">{n} in order</span>}
                    <span className="plus" aria-hidden="true">+</span>
                  </span>
                </span>
              </button>
            );
          })}
          {items.length === 0 && <p className="empty-order">No dishes in this category right now.</p>}
        </div>
      </main>

      {nudge && (
        <div className="nudge-bar wrap">
          <div className="t">
            <b>{nudge.title}</b>
            {nudge.body}
          </div>
          <button type="button" onClick={() => setSheetItem(nudge.item)}>Add</button>
        </div>
      )}

      <div className="orderbar">
        <button
          type="button"
          className={`btn primary ${bump ? 'cart-bump' : ''}`}
          disabled={count === 0}
          onClick={() => navigate('/cart', { state: { orderType } })}
        >
          <span>
            <span className="badge">{count}</span> {count === 0 ? 'Your order is empty' : 'Review order'}
          </span>
          <span className="price">{rupee(getCartTotal())}</span>
        </button>
      </div>

      {sheetItem && (
        <MenuItemModal
          item={sheetItem}
          menuItem={metaFor.get(sheetItem.itemId)}
          addonGroups={data?.addongroups || []}
          orderType={orderType}
          onClose={() => setSheetItem(null)}
          onAddToCart={() => {}}
        />
      )}
    </div>
  );
};

export default MenuPage;
