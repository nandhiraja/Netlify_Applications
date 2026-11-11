import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ktr.css';
import { listCompletedOrders } from '../lib/orderHistory';
import { printBillOnly } from './utils/printOrder';

const PAY_LABEL = { qr: 'UPI', edc: 'Card', cash: 'Cash', zomato_district: 'Zomato District' };

function when(ts) {
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return today ? `Today, ${time}` : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

/** Staff screen: recent paid orders on this kiosk, each with a "Reprint bill" button. */
const ReprintPage = () => {
  const navigate = useNavigate();
  const orders = useMemo(() => listCompletedOrders(), []);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null); // { orderId, ok, text }

  const q = query.trim().toLowerCase();
  const shown = q
    ? orders.filter((o) =>
        `${o.kot_code || ''} ${o.orderId} ${(o.orderDetails.items || []).map((i) => i.itemName).join(' ')}`.toLowerCase().includes(q))
    : orders;

  const reprint = async (order) => {
    setBusy(order.orderId);
    setResult(null);
    const res = await printBillOnly(order);
    setBusy(null);
    setResult({
      orderId: order.orderId,
      ok: res.ok,
      text: res.ok ? 'Bill sent to the printer.' : res.error || 'Could not print the bill.',
    });
  };

  return (
    <div className="ktr ktr-screen checkout reprint">
      <div className="topbar">
        <div className="topbar-in wrap">
          <button type="button" className="restart" onClick={() => navigate('/')}>← Back</button>
          <span className="topbar-title">Reprint a bill</span>
          <span className="spacer" />
          <span className="chip-type">Staff</span>
        </div>
      </div>
      <div className="topbar-plaid" />

      <main className="co wrap">
        <input
          className="note-in"
          type="search"
          inputMode="search"
          placeholder="Search by token number or dish"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bills"
        />

        {shown.length === 0 ? (
          <section className="panel center-msg">
            <h2>{orders.length ? 'No bill matches that search' : 'No bills yet'}</h2>
            <p>Bills paid on this kiosk in the last 3 days appear here.</p>
          </section>
        ) : (
          shown.map((o) => {
            const d = o.orderDetails;
            const paid = Number(d.total || 0) - Number(d.discountAmount || 0);
            const res = result?.orderId === o.orderId ? result : null;
            return (
              <section key={o.orderId} className="panel bill-row">
                <div className="bill-top">
                  <span className="tok">{(o.kot_code || '—').replace(/^KTR-/, '')}</span>
                  <div className="meta">
                    <b>{when(o.at)} · ₹{paid.toFixed(0)}</b>
                    <span>
                      {o.orderTypeLabel}
                      {PAY_LABEL[o.paymentMethod] ? ` · ${PAY_LABEL[o.paymentMethod]}` : ''} · Order {o.orderId}
                    </span>
                  </div>
                  <button type="button" className="btn primary" disabled={busy !== null} onClick={() => reprint(o)}>
                    {busy === o.orderId ? 'Printing…' : 'Reprint bill'}
                  </button>
                </div>
                <p className="its">{(d.items || []).map((i) => `${i.quantity} × ${i.itemName}`).join(' · ')}</p>
                {res && <div className={res.ok ? 'coupon-ok' : 'err-box'} role="status">{res.text}</div>}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
};

export default ReprintPage;
