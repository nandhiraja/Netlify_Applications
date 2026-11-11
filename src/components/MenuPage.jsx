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
import { buildCartLine, needsChoice } from '../lib/cartLine';
import { HELP_GROUPS, PAIR_WHY, coffeeForNow, moodNow, orderNudges, pairIdsFor, todaySpecial } from '../lib/suggest';
import { isIdlePromptOpen, lastActivity, markActivity } from '../lib/idle';
import { flyToCart } from '../lib/flyToCart';

const HELP_AFTER_MS = 20000; // browsing with an empty order
const COMPLETE_AFTER_MS = 25000; // since the last dish was added
const COMPLETE_QUIET_MS = 8000; // and no touch for this long

// Petpooja charge lines (packaging) are billed by the kiosk itself, not ordered as dishes.
const isCharge = (i) => /\bcharges?\b/i.test(i.itemName || '');

const MenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderType = location.state?.orderType || readOrderType();
  const { data, error, loading, reload } = useCatalog();
  const meta = useMenuMeta();
  const { cart, addItem, removeItem, updateQuantity, getCartTotal } = useCart();
  const [catId, setCatId] = useState(location.state?.category?.categoryId ?? null);
  const [sheetItem, setSheetItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [help, setHelp] = useState(null); // null | { pick }
  const [complete, setComplete] = useState(null); // null | menu ids still on offer
  const [toast, setToast] = useState('');
  const [justIdx, setJustIdx] = useState(-1);

  const screenRef = useRef(null);
  const prevCount = useRef(null);
  const lastAdded = useRef(null);
  const lastAddAt = useRef(0);
  const menuAt = useRef(Date.now());
  const completeShown = useRef(false);
  const logoTaps = useRef([]);

  const categories = data?.categories || [];
  const addonGroups = data?.addongroups || [];
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
      if (mm && !isCharge(item) && !m.has(mm.id)) m.set(mm.id, item);
    }
    return m;
  }, [data, metaFor]);

  const items = (data?.items || []).filter((i) => i.categoryId === activeCat && !isCharge(i));
  const categoryName = (id) => categories.find((c) => c.categoryId === id)?.name || '';
  const inCart = useMemo(() => {
    const m = new Map();
    for (const it of cart.items) m.set(it.itemId, (m.get(it.itemId) || 0) + it.quantity);
    return m;
  }, [cart.items]);
  const count = cart.items.reduce((n, it) => n + it.quantity, 0);
  const special = todaySpecial();
  const specialItem = byMenuId.get(special.id);

  // Something was added: fly the dish to the order total and highlight its line.
  useEffect(() => {
    if (prevCount.current !== null && count > prevCount.current) {
      lastAddAt.current = Date.now();
      const added = lastAdded.current;
      flyToCart(screenRef.current, added ? dishImage(added, categoryName(added.categoryId)) : null);
      const idx = added ? cart.items.map((it) => it.itemId).lastIndexOf(added.itemId) : cart.items.length - 1;
      setJustIdx(idx);
      prevCount.current = count;
      const t = setTimeout(() => setJustIdx(-1), 1200);
      return () => clearTimeout(t);
    }
    prevCount.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /** One tap adds the dish as it comes; dishes with a required choice open their sheet instead. */
  const quickAdd = (item) => {
    if (!item) return false;
    if (needsChoice(item, addonGroups)) {
      setHelp(null);
      setCartOpen(false);
      setSheetItem(item);
      return false;
    }
    lastAdded.current = item;
    addItem(buildCartLine(item, { orderType }));
    setToast(`${item.itemName} added`);
    return true;
  };

  const cartMetas = cart.items.map((it) => metaFor.get(it.itemId));
  const nudges = orderNudges(cartMetas)
    .map((n) => ({ ...n, item: byMenuId.get(n.id) }))
    .filter((n) => n.item && !inCart.has(n.item.itemId));

  // Gentle helpers: "Not sure what to order?" for guests who browse without adding anything,
  // "Make it complete?" for guests who pause with food but no coffee or vada.
  const overlayOpen = Boolean(sheetItem || cartOpen || help);
  useEffect(() => {
    if (loading || error) return undefined;
    const t = setInterval(() => {
      if (overlayOpen || isIdlePromptOpen()) return;
      const now = Date.now();
      if (count === 0 && !sessionStorage.getItem('ktrHelpShown') && now - menuAt.current > HELP_AFTER_MS) {
        sessionStorage.setItem('ktrHelpShown', '1');
        markActivity();
        setHelp({ pick: null });
        return;
      }
      if (
        count > 0 && !completeShown.current && !complete && lastAddAt.current &&
        now - lastAddAt.current > COMPLETE_AFTER_MS && now - lastActivity() > COMPLETE_QUIET_MS
      ) {
        completeShown.current = true;
        const metas = cart.items.map((it) => metaFor.get(it.itemId)).filter(Boolean);
        const ids = [];
        if (!metas.some((m) => m.category === 'coffee')) ids.push(coffeeForNow());
        if (!metas.some((m) => m.category === 'vada' || m.id === 'id-wada')) ids.push('vd-medu');
        const offer = ids.filter((id) => byMenuId.get(id));
        if (offer.length) {
          markActivity();
          setComplete(offer);
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [loading, error, overlayOpen, count, complete, cart.items, metaFor, byMenuId]);

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

  // Staff shortcut: tap the KTR logo five times quickly to open "Reprint a bill".
  const staffTap = () => {
    const now = Date.now();
    logoTaps.current = [...logoTaps.current.filter((t) => now - t < 1500), now];
    if (logoTaps.current.length >= 5) {
      logoTaps.current = [];
      navigate('/reprint');
    }
  };

  const mood = moodNow();
  const moodItems = mood.ids.map((id) => byMenuId.get(id)).filter(Boolean);
  const goCheckout = () => navigate('/cart', { state: { orderType } });
  const thumb = (item) => {
    const img = dishImage(item, categoryName(item.categoryId));
    return <span className={`th ${img ? '' : 'pl'}`} style={img ? { backgroundImage: `url(${img})` } : undefined} />;
  };

  const orderPanel = (
    <>
      <h2>
        Your order <small>{orderTypeLabel(orderType)}</small>
      </h2>
      {cart.items.length === 0 ? (
        <div className="empty-order">Tap a dish to add it.</div>
      ) : (
        <>
          <div className="lines">
            {cart.items.map((it, idx) => {
              const c = it.selectedCustomizations || {};
              return (
                <div key={it.cartId || idx} className={`ln ${idx === justIdx ? 'just' : ''}`}>
                  <b>{it.itemName}</b>
                  <span className="price">{rupee((it.pricePerUnit || 0) * it.quantity)}</span>
                  {(c.variation || c.addons?.length > 0 || c.options?.length > 0 || c.parcel) && (
                    <div className="mods">
                      {c.parcel && <span className="mod parcel">Parcel</span>}
                      {c.variation && <span className="mod soft">{c.variation.name}</span>}
                      {(c.addons || []).map((a) => (
                        <span key={a.addon_item_id} className="mod soft">+ {a.name}</span>
                      ))}
                      {(c.options || []).map((o) => (
                        <span key={o} className="mod">{o}</span>
                      ))}
                    </div>
                  )}
                  {c.note && <div className="note">“{c.note}”</div>}
                  <div className="ctl">
                    <div className="step">
                      <button
                        type="button"
                        aria-label={`One less ${it.itemName}`}
                        onClick={() => (it.quantity <= 1 ? removeItem(idx) : updateQuantity(idx, it.quantity - 1))}
                      >
                        −
                      </button>
                      <output>{it.quantity}</output>
                      <button type="button" aria-label={`One more ${it.itemName}`} onClick={() => updateQuantity(idx, it.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="ln-remove" onClick={() => removeItem(idx)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          {nudges.map((n) => (
            <div key={n.id} className="nudge">
              <div className="t">
                <b>{n.title(n.item.itemName)}</b>
                {n.body}
              </div>
              <button type="button" onClick={() => quickAdd(n.item)}>+ {rupee(displayPrice(n.item))}</button>
            </div>
          ))}
          <div className="total-row">
            <span>
              Total <small>incl. taxes</small>
            </span>
            <span className="price">{rupee(getCartTotal())}</span>
          </div>
          <button type="button" className="btn primary" onClick={goCheckout}>Review and place order</button>
        </>
      )}
    </>
  );

  const helpGroup = help ? HELP_GROUPS.find((g) => g.k === help.pick) : null;
  const helpItems = helpGroup ? helpGroup.ids.map((id) => byMenuId.get(id)).filter(Boolean) : [];

  return (
    <div className="ktr ktr-screen menu" ref={screenRef}>
      <div className="topbar">
        <div className="topbar-in wrap">
          <img src="/img/logo.png" alt="KTR" onClick={staffTap} />
          <button
            type="button"
            className="chip-type"
            onClick={() => navigate('/', { state: { step: 'type' } })}
            title="Change order type"
          >
            {orderTypeLabel(orderType)} · change
          </button>
          <span className="spacer" />
          <button type="button" className="restart" onClick={() => navigate('/')}>Start over</button>
        </div>
      </div>
      <div className="topbar-plaid" />

      <div className="menu-body wrap">
        <nav className="cats" aria-label="Menu sections">
          {categories.map((c) => (
            <button
              key={c.categoryId}
              type="button"
              className="cat"
              aria-pressed={c.categoryId === activeCat}
              onClick={() => {
                setCatId(c.categoryId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>

        <main className="content">
          {moodItems.length > 0 && activeCat === categories[0]?.categoryId && (
            <section className="mood">
              <span className="k">{mood.k}</span>
              <h3>{mood.t}</h3>
              <p>{mood.p}</p>
              <div className="mood-picks">
                {moodItems.map((it) => (
                  <button key={it.itemId} type="button" className="mood-pick" onClick={() => quickAdd(it)}>
                    + {it.itemName} · {rupee(displayPrice(it))}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="sec-title">
              {categoryName(activeCat)}
              <small>{items.length} {items.length === 1 ? 'dish' : 'dishes'}</small>
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
                        {specialItem?.itemId === item.itemId && <span className="tag today">Today</span>}
                        {mm?.signature ? <span className="tag sig">Signature</span> : mm?.traditional && <span className="tag trad">Traditional</span>}
                      </span>
                    </span>
                    <span className="tx">
                      <b>{item.itemName}</b>
                      {(mm?.short || item.itemDescription) && <span className="ds">{mm?.short || item.itemDescription}</span>}
                      <span className="row">
                        <span>
                          <span className="price">{variants ? `from ${rupee(displayPrice(item))}` : rupee(displayPrice(item))}</span>
                          {n > 0 && <span className="incart"> · {n} in order</span>}
                        </span>
                        <span className="plus" aria-hidden="true">+</span>
                      </span>
                    </span>
                  </button>
                );
              })}
              {items.length === 0 && <p className="empty-order">No dishes in this category right now.</p>}
            </div>
          </section>
        </main>

        <aside className="order order-side" aria-label="Your order">{orderPanel}</aside>
      </div>

      <div className="orderbar">
        <button type="button" className={`btn ${count ? 'primary' : 'soft'}`} disabled={count === 0} onClick={() => setCartOpen(true)}>
          <span>
            <span className="badge">{count}</span> {count === 0 ? 'Your order is empty' : 'View order'}
          </span>
          <span className="price">{rupee(getCartTotal())}</span>
        </button>
      </div>

      {complete && !overlayOpen && (
        <div className="complete" role="dialog" aria-label="Complete your order">
          <div className="t">
            <b>Make it complete?</b>
            <span>Filter coffee and a crispy vada go with everything.</span>
          </div>
          <div className="acts">
            {complete.map((id) => {
              const it = byMenuId.get(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    quickAdd(it);
                    const rest = complete.filter((x) => x !== id);
                    setComplete(rest.length ? rest : null);
                  }}
                >
                  + {it.itemName} · {rupee(displayPrice(it))}
                </button>
              );
            })}
            <button type="button" className="btn ghost" onClick={() => setComplete(null)}>No thanks</button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="scrim" onClick={() => setCartOpen(false)} role="presentation">
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Your order" onClick={(e) => e.stopPropagation()}>
            <div className="bd">
              <div className="sheet-top">
                <button type="button" className="btn ghost" onClick={() => setCartOpen(false)}>Keep browsing</button>
              </div>
              <div className="order order-sheet">{orderPanel}</div>
            </div>
          </div>
        </div>
      )}

      {help && (
        <div className="scrim" onClick={() => setHelp(null)} role="presentation">
          <div className="sheet help-sheet" role="dialog" aria-modal="true" aria-label="Help choosing" onClick={(e) => e.stopPropagation()}>
            <div className="bd">
              <div className="help-head">
                <div>
                  <span className="tag today">We can help</span>
                  <h3>Not sure what to order?</h3>
                </div>
                <button type="button" className="btn ghost" onClick={() => setHelp(null)}>I&apos;m just looking</button>
              </div>
              <p className="lead">Tell us what you feel like and we&apos;ll suggest our favourites.</p>
              <div className="mod-grid">
                {HELP_GROUPS.map((g) => (
                  <button key={g.k} type="button" className="mod-btn" aria-pressed={g.k === help.pick} onClick={() => setHelp({ pick: g.k })}>
                    {g.label}
                  </button>
                ))}
              </div>
              {helpItems.length > 0 && (
                <div className="help-picks">
                  {helpItems.map((it) => (
                    <div key={it.itemId} className="help-pick">
                      {thumb(it)}
                      <div>
                        <b>{it.itemName}</b>
                        <span>{metaFor.get(it.itemId)?.short || it.itemDescription}</span>
                      </div>
                      <button type="button" className="btn primary" onClick={() => quickAdd(it) && setHelp(null)}>
                        + {rupee(displayPrice(it))}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {specialItem && (
                <button type="button" className="nudge special-n" onClick={() => quickAdd(specialItem) && setHelp(null)}>
                  <div className="t">
                    <b>Or try {special.day}&apos;s special: {specialItem.itemName}</b>
                    {special.line}
                  </div>
                  <span className="price">{rupee(displayPrice(specialItem))}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {sheetItem && (
        <MenuItemModal
          item={sheetItem}
          menuItem={metaFor.get(sheetItem.itemId)}
          addonGroups={addonGroups}
          orderType={orderType}
          pairs={pairIdsFor(metaFor.get(sheetItem.itemId))
            .map((id) => ({ id, item: byMenuId.get(id), why: PAIR_WHY[id] }))
            .filter((p) => p.item && p.item.itemId !== sheetItem.itemId && !needsChoice(p.item, addonGroups))}
          onClose={() => setSheetItem(null)}
          onAddToCart={(line, extras = 0) => {
            lastAdded.current = sheetItem;
            setToast(`${line.itemName}${extras ? ` and ${extras} extra${extras > 1 ? 's' : ''}` : ''} added`);
          }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
};

export default MenuPage;
