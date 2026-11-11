import React from 'react';
import '../styles/ktr.css';

/** Loading state shaped like the menu screen, so the real menu replaces it without a jump. */
const MenuSkeleton = () => (
  <div className="ktr ktr-screen menu menu-skeleton" aria-busy="true" aria-label="Loading the menu">
    <div className="topbar">
      <div className="topbar-in wrap">
        <img src="/img/logo.png" alt="KTR" />
        <span className="sk sk-chip" />
        <span className="spacer" />
        <span className="sk sk-chip" />
      </div>
    </div>
    <div className="topbar-plaid" />
    <div className="menu-body wrap">
      <nav className="cats">
        {[120, 140, 100, 110, 90].map((w, i) => (
          <span key={i} className="sk sk-pill" style={{ minWidth: w }} />
        ))}
      </nav>
      <main className="content">
        <span className="sk sk-title" />
        <div className="grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="item sk-card">
              <span className="ph sk" />
              <span className="tx">
                <span className="sk sk-line" />
                <span className="sk sk-line short" />
                <span className="sk sk-line price" />
              </span>
            </div>
          ))}
        </div>
      </main>
      <aside className="order order-side">
        <span className="sk sk-title" style={{ width: '70%' }} />
        <span className="sk sk-line" />
        <span className="sk sk-line short" />
      </aside>
    </div>
  </div>
);

export default MenuSkeleton;
