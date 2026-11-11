import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/ktr.css';
import { IDLE_COUNTDOWN_S, IDLE_MS, lastActivity, markActivity, setIdlePromptOpen } from '../lib/idle';

/**
 * "Still ordering?" — after `idleMs` without a touch, counts down and then calls `onExpire`
 * (clear the order, back to the welcome screen) unless the guest taps Keep ordering.
 */
const IdlePrompt = ({ idleMs = IDLE_MS, countdown = IDLE_COUNTDOWN_S, onExpire }) => {
  const [left, setLeft] = useState(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    markActivity();
    const t = setInterval(() => {
      setLeft((cur) => (cur === null && Date.now() - lastActivity() > idleMs ? countdown : cur));
    }, 1000);
    return () => {
      clearInterval(t);
      setIdlePromptOpen(false);
    };
  }, [idleMs, countdown]);

  useEffect(() => {
    if (left === null) {
      setIdlePromptOpen(false);
      return undefined;
    }
    setIdlePromptOpen(true);
    if (left <= 0) {
      setLeft(null);
      markActivity();
      expire.current();
      return undefined;
    }
    const t = setTimeout(() => setLeft((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (left === null) return null;

  const stay = () => {
    markActivity();
    setLeft(null);
  };
  const leave = () => {
    markActivity();
    setLeft(null);
    expire.current();
  };

  return (
    <div className="ktr scrim idle-scrim" role="presentation">
      <div className="idle-card" role="alertdialog" aria-label="Still ordering?">
        <span className="n">{left}</span>
        <h3>Still ordering?</h3>
        <p>We&apos;ll clear this order and go back to the welcome screen.</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={stay}>Keep ordering</button>
          <button type="button" className="btn ghost" onClick={leave}>Start over</button>
        </div>
      </div>
    </div>
  );
};

IdlePrompt.propTypes = {
  idleMs: PropTypes.number,
  countdown: PropTypes.number,
  onExpire: PropTypes.func.isRequired,
};

export default IdlePrompt;
