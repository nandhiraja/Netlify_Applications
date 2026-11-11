/**
 * Fly-to-cart: a small round photo of the dish arcs from where the guest tapped to the order total.
 * The kiosk screens are scaled with CSS zoom, and browsers disagree on whether
 * getBoundingClientRect() includes that zoom, so the flyer lives inside the zoomed screen and we
 * measure the conversion factor with a probe instead of assuming it.
 */

let lastTap = { t: 0, rect: null };

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const card = e.target.closest?.('.item, .pair, .extra, .nudge, .sheet, .help-pick');
      const ph = card ? card.querySelector('.ph, .th') : null;
      const src = ph && ph.getBoundingClientRect().width ? ph : e.target.closest?.('button') || e.target;
      lastTap = { t: Date.now(), rect: src.getBoundingClientRect() };
    },
    true,
  );
}

function visible(el) {
  if (!el || el.offsetParent === null) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
}

function bump(target) {
  const host = target.closest('.btn') || target;
  host.classList.remove('cart-bump');
  void host.offsetWidth;
  host.classList.add('cart-bump');
}

/**
 * @param {HTMLElement|null} screen the zoomed .ktr-screen element
 * @param {string|null} imageUrl dish photo (falls back to the plaid tile)
 */
export function flyToCart(screen, imageUrl) {
  if (!screen) return;
  const target = ['.order-side .total-row', '.orderbar .badge'].map((s) => screen.querySelector(s)).find(visible);
  if (!target) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !document.body.animate) {
    bump(target);
    return;
  }

  const f = document.createElement('div');
  f.className = `fly${imageUrl ? '' : ' pl'}`;
  f.setAttribute('aria-hidden', 'true');
  if (imageUrl) f.style.backgroundImage = `url("${imageUrl}")`;
  f.style.left = '100px';
  f.style.top = '0px';
  f.style.width = '100px';
  f.style.height = '100px';
  f.style.opacity = '0';
  screen.appendChild(f);
  // CSS px per reported px (1 when rects are already in the screen's own coordinates).
  const k = 100 / (f.getBoundingClientRect().left || 100);

  const fresh = Date.now() - lastTap.t < 1500 && lastTap.rect;
  const sr = fresh ? lastTap.rect : null;
  const sx = (sr ? sr.left + sr.width / 2 : window.innerWidth / 2) * k;
  const sy = (sr ? sr.top + sr.height / 2 : window.innerHeight / 2) * k;
  const tr = target.getBoundingClientRect();
  const tx = (tr.left + tr.width / 2) * k;
  const ty = (tr.top + tr.height / 2) * k;
  const size = Math.max(64, Math.min(120, sr ? Math.min(sr.width, sr.height) * k : 96));

  f.style.width = `${size}px`;
  f.style.height = `${size}px`;
  f.style.left = `${sx - size / 2}px`;
  f.style.top = `${sy - size / 2}px`;
  f.style.opacity = '1';

  const dx = tx - sx;
  const dy = ty - sy;
  const lift = Math.min(160, Math.abs(dx) * 0.25 + 60);
  const end = 28 / size;
  const anim = f.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
      { transform: 'translate(0,0) scale(1.12) rotate(-6deg)', opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.5}px,${Math.min(dy, 0) * 0.5 - lift}px) scale(${0.7 + end * 0.3}) rotate(8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(${end}) rotate(0deg)`, opacity: 0.9, offset: 1 },
    ],
    { duration: 720, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' },
  );
  const done = () => {
    f.remove();
    bump(target);
    const ring = document.createElement('div');
    ring.className = 'fly-ring';
    ring.style.left = `${tx}px`;
    ring.style.top = `${ty}px`;
    screen.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  };
  anim.onfinish = done;
  anim.oncancel = () => f.remove();
}
