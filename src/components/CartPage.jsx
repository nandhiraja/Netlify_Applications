import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ktr.css';
import { useCart } from './CartContext';
import {
  getKioskBaseUrl,
  getCatalogChannel,
  storeScopedHeaders,
  getStoreIdForHeader,
} from '../utils/kioskApi';
import { lineType, orderTypeLabel, orderTypePayload, readOrderType } from '../lib/orderType';
import { dishImage } from '../lib/dishImages';

const BASE_URL = getKioskBaseUrl();

// Items excluded from the takeaway packing charge (extras, add-on chutneys and the like).
const EXCLUDED_TAKEAWAY_ITEM_IDS = [
  '1302832751',
  '1302832750',
  '1302832749',
  '1302832748',
  '1302832747',
  '1302832746',
  '1302832198',
  '1303112180',
  '1303001035',
];

const NO_DISCOUNT = {
  couponApplied: false,
  discountId: null,
  discountCode: '',
  discountType: '',
  discountValue: 0,
  discountAmount: 0,
};

/** Pre-tax unit price and tax per unit for a cart line (variation + add-ons). */
function unitPrices(item) {
  let base = item.price || 0;
  let tax = item.taxAmount || 0;
  const c = item.selectedCustomizations;
  if (c) {
    const addons = (c.addons || []).reduce((s, a) => s + parseFloat(a.price || 0), 0);
    base = (c.variation ? parseFloat(c.variation.price || 0) : item.price || 0) + addons;
    tax = (item.taxes || []).reduce((s, t) => s + (base * t.percentage) / 100, 0);
  }
  return { base, tax };
}

function CartPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { cart, removeItem, updateQuantity, setLineType, clearCart } = useCart();
  const orderType = state?.orderType || readOrderType();
  const storeId = getStoreIdForHeader();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCouponPrompt, setShowCouponPrompt] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [isEligibleForCoupon, setIsEligibleForCoupon] = useState(false);
  const [discountState, setDiscountState] = useState(NO_DISCOUNT);

  const breakdown = cart.items.reduce(
    (acc, item) => {
      const { base, tax } = unitPrices(item);
      return { subtotal: acc.subtotal + base * item.quantity, tax: acc.tax + tax * item.quantity };
    },
    { subtotal: 0, tax: 0 },
  );

  // Packing charge: ₹10 per parcel item (excluded items free), capped at ₹100, plus 5% tax.
  // Same rule as the server, which recomputes and checks it.
  const parcelQty = cart.items.reduce((n, item) => {
    const id = item.skuCode || item.itemId?.toString() || '';
    return lineType(item, orderType) === 'takeaway' && !EXCLUDED_TAKEAWAY_ITEM_IDS.includes(id) ? n + item.quantity : n;
  }, 0);
  const takeawayChargesWithoutTax = Math.min(parcelQty * 10, 100);
  const takeawayTax = takeawayChargesWithoutTax * 0.05;
  const takeawayChargesWithTax = takeawayChargesWithoutTax + takeawayTax;

  const total = breakdown.subtotal + breakdown.tax + takeawayChargesWithTax;
  const finalPayableAmount = Math.max(0, total - (discountState.discountAmount || 0));

  // A changed cart invalidates an applied coupon.
  useEffect(() => {
    if (discountState.couponApplied) {
      setDiscountState(NO_DISCOUNT);
      setCouponCode('');
    }
  }, [total]);

  useEffect(() => {
    if (cart.items.length === 0 || !storeId) return;
    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/discounts/eligible?store_id=${storeId}&cart_amount=${total}&application_type=COUPON`,
          { headers: storeScopedHeaders() },
        );
        if (!res.ok) return;
        const data = await res.json();
        const eligible = Array.isArray(data) && data.length > 0;
        setIsEligibleForCoupon(eligible);
        if (eligible && !discountState.couponApplied) setShowCouponPrompt(true);
      } catch (err) {
        console.error('Error fetching eligible coupons', err);
      }
    })();
  }, [cart.items.length, storeId, total]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(false);
    try {
      const res = await fetch(`${BASE_URL}/discounts/validate`, {
        method: 'POST',
        headers: storeScopedHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          application_type: 'COUPON',
          code: couponCode.trim(),
          store_id: parseInt(storeId, 10),
          cart_amount: total,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountState({
          couponApplied: true,
          discountId: data.discount_id,
          discountCode: couponCode.trim(),
          discountType: data.discount_type,
          discountValue: data.discount_value,
          discountAmount: data.discount_amount,
        });
        setCouponSuccess(true);
        setShowCouponInput(false);
        setTimeout(() => setCouponSuccess(false), 3000);
      } else {
        setCouponError(data.message || 'Invalid coupon');
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountState(NO_DISCOUNT);
    setCouponCode('');
  };

  const handleProceedToPayment = async () => {
    if (cart.items.length === 0) return;
    setLoading(true);
    setError(null);

    const totalWithTax = breakdown.subtotal + breakdown.tax + takeawayChargesWithTax;
    const totalWithoutTax = breakdown.subtotal + takeawayChargesWithoutTax;
    const orderLevelType = orderTypePayload(orderType);

    const orderPayload = {
      channel: getCatalogChannel(),
      order_type: orderLevelType,
      items: cart.items.map((item) => {
        const line = { item_skuid: item.skuCode || item.itemId.toString(), quantity: item.quantity };
        const c = item.selectedCustomizations;
        if (c?.variation) line.variation_id = c.variation.variation_id;
        if (c?.addons?.length) {
          line.addon_items = c.addons.map((a) => ({ addon_item_id: a.addon_item_id, quantity: a.quantity || 1 }));
        }
        if (c?.options?.length) line.options = c.options;
        if (c?.note) line.note = c.note;
        const lt = lineType(item, orderType) === 'takeaway' ? 'TAKEAWAY' : 'DINEIN';
        if (lt !== orderLevelType) line.order_type = lt;
        return line;
      }),
      total_amount_include_tax: Math.round(totalWithTax),
      total_amount_exclude_tax: Math.round(totalWithoutTax),
      takeaway_charges_without_tax: takeawayChargesWithoutTax,
      takeaway_charges_with_tax: takeawayChargesWithTax,
    };
    if (discountState.couponApplied && discountState.discountId) {
      orderPayload.discount_id = discountState.discountId;
    }

    try {
      const res = await fetch(`${BASE_URL}/orders/`, {
        method: 'POST',
        headers: storeScopedHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.detail || 'Failed to create order');
      }
      const result = await res.json();
      navigate('/payment', {
        state: {
          KDSInvoiceId: result.kds_invoice_id,
          orderId: result.order_id,
          payment_status: result.payment_status,
          totalAmount: result.total_amount_include_tax,
          orderDetails: {
            items: cart.items,
            subtotal: breakdown.subtotal,
            tax: breakdown.tax,
            takeawayChargeWithoutTax: takeawayChargesWithoutTax,
            takeawayTax,
            takeawayChargeWithTax: takeawayChargesWithTax,
            total: totalWithTax,
            discountAmount: result.discount_amount || discountState.discountAmount,
            discountCode: result.discount_code || discountState.discountCode,
          },
        },
      });
      clearCart();
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to process your order. Please try again.');
      setLoading(false);
      setTimeout(() => setError(null), 5000);
    }
  };

  const count = cart.items.reduce((n, it) => n + it.quantity, 0);

  return (
    <div className="ktr ktr-screen checkout">
      <div className="topbar">
        <div className="topbar-in wrap">
          <button type="button" className="restart" onClick={() => navigate('/category', { state: { orderType } })}>
            ← Add more
          </button>
          <span className="topbar-title">Your order</span>
          <span className="spacer" />
          <span className="chip-type">{orderTypeLabel(orderType)}</span>
        </div>
      </div>
      <div className="topbar-plaid" />

      <main className="co wrap">
        {cart.items.length === 0 ? (
          <section className="panel center-msg">
            <h2>Your order is empty</h2>
            <button type="button" className="btn primary" onClick={() => navigate('/category', { state: { orderType } })}>
              Browse the menu
            </button>
          </section>
        ) : (
          <>
            <section className="panel">
              <h2>
                {count} {count === 1 ? 'item' : 'items'}
                {orderType === 'mixed' && <small> · tap to switch eat here / take away</small>}
              </h2>
              <div className="lines">
                {cart.items.map((item, idx) => {
                  const img = dishImage(item);
                  const { base, tax } = unitPrices(item);
                  const c = item.selectedCustomizations || {};
                  const parcel = lineType(item, orderType) === 'takeaway';
                  return (
                    <div key={item.cartId || idx} className={`ln ${parcel && orderType === 'mixed' ? 'is-parcel' : ''}`}>
                      <span className={`ln-th ${img ? '' : 'pl'}`} style={img ? { backgroundImage: `url(${img})` } : undefined} />
                      <div className="ln-main">
                        <b>{item.itemName}</b>
                        <div className="mods">
                          {c.variation && <span className="mod soft">{c.variation.name}</span>}
                          {(c.addons || []).map((a) => (
                            <span key={a.addon_item_id} className="mod soft">+ {a.name}</span>
                          ))}
                          {(c.options || []).map((o) => (
                            <span key={o} className="mod">{o}</span>
                          ))}
                        </div>
                        {c.note && <div className="note">“{c.note}”</div>}
                      </div>
                      <span className="price">₹{((base + tax) * item.quantity).toFixed(0)}</span>
                      <div className="ctl">
                        <div className="step">
                          <button
                            type="button"
                            aria-label="One less"
                            disabled={loading}
                            onClick={() => (item.quantity <= 1 ? removeItem(idx) : updateQuantity(idx, item.quantity - 1))}
                          >
                            {item.quantity <= 1 ? '🗑' : '−'}
                          </button>
                          <output>{item.quantity}</output>
                          <button type="button" aria-label="One more" disabled={loading} onClick={() => updateQuantity(idx, item.quantity + 1)}>
                            +
                          </button>
                        </div>
                        {orderType === 'mixed' && (
                          <div className="split" role="group" aria-label="Eat here or take away">
                            <button type="button" aria-pressed={!parcel} onClick={() => setLineType(idx, 'dine-in')}>Eat here</button>
                            <button type="button" aria-pressed={parcel} onClick={() => setLineType(idx, 'takeaway')}>Take away</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel summary">
              <div className="sum-row"><span>Items</span><span>₹{breakdown.subtotal.toFixed(2)}</span></div>
              {takeawayChargesWithoutTax > 0 && (
                <div className="sum-row">
                  <span>Take-away packing{orderType === 'mixed' ? ` (${parcelQty} items)` : ''}</span>
                  <span>₹{takeawayChargesWithoutTax.toFixed(2)}</span>
                </div>
              )}
              <div className="sum-row"><span>Taxes</span><span>₹{(breakdown.tax + takeawayTax).toFixed(2)}</span></div>
              {discountState.couponApplied && (
                <div className="sum-row save">
                  <span>Coupon {discountState.discountCode}</span>
                  <span>−₹{discountState.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span>To pay</span>
                <span className="price">₹{finalPayableAmount.toFixed(2)}</span>
              </div>

              {couponSuccess && (
                <div className="coupon-ok">
                  {discountState.discountCode} applied. You saved ₹{discountState.discountAmount.toFixed(2)}.
                </div>
              )}
              {discountState.couponApplied && !couponSuccess && (
                <button type="button" className="btn ghost" onClick={handleRemoveCoupon}>Remove coupon</button>
              )}
              {isEligibleForCoupon && !discountState.couponApplied && (
                <button type="button" className="btn ghost" onClick={() => setShowCouponInput(true)}>Have a coupon?</button>
              )}

              {error && <div className="err-box" role="alert">{error}</div>}

              <button type="button" className="btn primary big" disabled={loading} onClick={handleProceedToPayment}>
                <span>{loading ? 'Placing your order…' : 'Continue to payment'}</span>
                <span className="price">₹{finalPayableAmount.toFixed(0)}</span>
              </button>
            </section>
          </>
        )}
      </main>

      {showCouponPrompt && !showCouponInput && (
        <div className="scrim" onClick={() => setShowCouponPrompt(false)} role="presentation">
          <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Coupon">
            <h3>Have a coupon?</h3>
            <p>You have discounts available. Apply one now?</p>
            <div className="row">
              <button type="button" className="btn primary" onClick={() => { setShowCouponPrompt(false); setShowCouponInput(true); }}>
                Yes, enter code
              </button>
              <button type="button" className="btn soft" onClick={() => setShowCouponPrompt(false)}>Maybe later</button>
            </div>
          </div>
        </div>
      )}

      {showCouponInput && !discountState.couponApplied && (
        <div className="scrim" onClick={() => setShowCouponInput(false)} role="presentation">
          <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Enter coupon code">
            <h3>Enter coupon code</h3>
            <input
              className="note-in"
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. STORE10"
              disabled={couponLoading}
              autoFocus
            />
            {couponError && <div className="err-box">{couponError}</div>}
            <div className="row">
              <button type="button" className="btn primary" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                {couponLoading ? 'Checking…' : 'Apply'}
              </button>
              <button type="button" className="btn soft" onClick={() => setShowCouponInput(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
