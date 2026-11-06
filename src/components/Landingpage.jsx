import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ktr.css';
import { useCart } from './CartContext';
import { imageUrl, useMenuMeta } from '../lib/menuMeta';
import { resetCatalog } from '../lib/catalog';

const SLIDE_MS = 7000;
const IDLE_MS = 40000; // same as the app-wide idle timeout in main.jsx

// Shown before menu-meta loads (or if it is unavailable).
const FALLBACK_SLIDES = [
  { image: 'dav', kicker: 'Signature', title: 'Benne-roasted, made to order', body: 'Order here, collect at the counter when your token is called.' },
  { image: 'coffee', kicker: 'The ritual', title: 'Filter coffee, poured high', body: 'Strong decoction, hot frothy milk, steel tumbler.' },
];

const TYPES = [
  { id: 'dine-in', title: 'Dine in', body: 'Grab a seat. We call your token when it is ready.', image: 'table' },
  { id: 'takeaway', title: 'Take away', body: 'Packed to go. Collect it at the counter when your token is called.', image: 'store' },
  { id: 'mixed', title: 'Both', body: 'Eat some here, take some home. Choose for each dish.', image: 'thatte' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const meta = useMenuMeta();
  const [step, setStep] = useState('attract');
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    clearCart();
    localStorage.removeItem('restaurantCart');
    localStorage.removeItem('orderType');
    resetCatalog();
  }, []);

  const slides = (meta?.reel || []).filter((s) => s.image).slice(0, 6);
  const shown = slides.length ? slides : FALLBACK_SLIDES;

  useEffect(() => {
    if (step !== 'attract') return undefined;
    const t = setTimeout(() => setSlide((n) => (n + 1) % shown.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, step, shown.length]);

  // The app-wide idle timer skips "/", so the order-type step returns to the attract screen itself.
  useEffect(() => {
    if (step !== 'type') return undefined;
    let t = setTimeout(() => setStep('attract'), IDLE_MS);
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => setStep('attract'), IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [step]);

  const choose = (orderType) => {
    localStorage.setItem('orderType', orderType);
    navigate('/category', { state: { orderType } });
  };

  if (step === 'attract') {
    return (
      <div
        className="ktr ktr-screen attract"
        role="button"
        tabIndex={0}
        aria-label="Start your order"
        onClick={() => setStep('type')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStep('type')}
      >
        {shown.map((s, i) => (
          <div key={s.title} className={`att-slide ${i === slide % shown.length ? 'on' : ''}`} aria-hidden={i !== slide}>
            <img src={imageUrl(s.image)} alt="" />
          </div>
        ))}
        <div className="att-top wrap">
          <img src="/img/logo.png" alt="KTR" />
          <span className="att-special">Karnataka Tiffin Room</span>
        </div>
        <div className="att-copy wrap">
          <span className="att-kicker">{shown[slide % shown.length].kicker}</span>
          <h1>{shown[slide % shown.length].title}</h1>
          <p>{shown[slide % shown.length].body}</p>
          <span className="tap">
            Tap to order
            <span aria-hidden="true">→</span>
          </span>
        </div>
        <div className="plaid-band" />
      </div>
    );
  }

  return (
    <div className="ktr ktr-screen type-screen wrap">
      <header className="type-head">
        <img src="/img/logo.png" alt="KTR" className="type-logo" />
        <button type="button" className="back" onClick={() => setStep('attract')}>
          ← Back
        </button>
      </header>
      <h1 className="type-title">Where will you enjoy it?</h1>
      <div className="type-list">
        {TYPES.map((t) => (
          <button key={t.id} type="button" className="type-row" onClick={() => choose(t.id)}>
            <span className="ph" style={{ backgroundImage: `url(${imageUrl(t.image)})` }} />
            <span className="tx">
              <b>{t.title}</b>
              <span>{t.body}</span>
            </span>
            <span className="go" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <p className="lang-note">Your token number is called out and shown on the screen when your food is ready.</p>
    </div>
  );
};

export default LandingPage;
