import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ktr.css';
import { useCart } from './CartContext';
import { imageUrl, useMenuMeta } from '../lib/menuMeta';
import { resetCatalog } from '../lib/catalog';
import IdlePrompt from './IdlePrompt';

const SLIDE_MS = 7000;

// Shown before menu-meta loads (or if it is unavailable).
const FALLBACK_SLIDES = [
  { image: 'dav', kicker: 'Signature', title: 'Benne-roasted, made to order', body: 'Order here, collect at the counter when your token is called.' },
  { image: 'coffee', kicker: 'The ritual', title: 'Filter coffee, poured high', body: 'Strong decoction, hot frothy milk, steel tumbler.' },
];

const MIXED_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 11h16" />
    <path d="M6 11v7" />
    <path d="M18 11v7" />
    <path d="M14 4h6l-1 5h-4z" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart, resetLineTypes } = useCart();
  const meta = useMenuMeta();
  // "Eat here · change" on the menu comes back to the order-type step and keeps the order.
  const changing = location.state?.step === 'type';
  const [step, setStep] = useState(changing ? 'type' : 'attract');
  const [slide, setSlide] = useState(0);

  const startFresh = () => {
    clearCart();
    localStorage.removeItem('restaurantCart');
    localStorage.removeItem('orderType');
    sessionStorage.removeItem('ktrHelpShown');
    resetCatalog();
  };

  useEffect(() => {
    if (!changing) startFresh();
  }, []);

  const slides = (meta?.reel || []).filter((s) => s.image).slice(0, 6);
  const shown = slides.length ? slides : FALLBACK_SLIDES;

  useEffect(() => {
    if (step !== 'attract') return undefined;
    const t = setTimeout(() => setSlide((n) => (n + 1) % shown.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, step, shown.length]);

  const backToAttract = () => {
    startFresh();
    if (changing) navigate('/', { replace: true, state: null });
    setStep('attract');
  };

  const choose = (orderType) => {
    localStorage.setItem('orderType', orderType);
    if (orderType !== 'mixed') resetLineTypes();
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
        <button type="button" className="back" onClick={backToAttract}>
          Cancel
        </button>
      </header>
      <h1 className="type-title">Eating here or taking it with you?</h1>
      <div className="type-grid">
        <button type="button" className="type-card" onClick={() => choose('dine-in')}>
          <span className="ph" style={{ backgroundImage: `url(${imageUrl('table')})` }} />
          <span className="tx">
            <b>Eat here</b>
            <span>Enjoy it bisi bisi: served steaming hot on a classic steel plate.</span>
          </span>
        </button>
        <button type="button" className="type-card" onClick={() => choose('takeaway')}>
          <span className="ph" style={{ backgroundImage: `url(${imageUrl('blr')})` }} />
          <span className="tx">
            <b>Parcel</b>
            <span>Packed hot to take away.</span>
          </span>
        </button>
      </div>
      <button type="button" className="type-mixed" onClick={() => choose('mixed')}>
        <span className="ic">{MIXED_ICON}</span>
        <span className="tx">
          <b>Some here, some parcel</b>
          <span>Eat a few dishes now, take the rest home.</span>
        </span>
        <span className="go" aria-hidden="true">→</span>
      </button>
      <p className="lang-note">Your token number is called out and shown on the screen when your food is ready.</p>
      <IdlePrompt onExpire={backToAttract} />
    </div>
  );
};

export default LandingPage;
