/**
 * Guest activity tracking shared by the "Still ordering?" prompt and the menu's gentle helpers.
 */

let last = Date.now();
let promptOpen = false;

if (typeof window !== 'undefined') {
  const touch = () => {
    last = Date.now();
  };
  ['pointerdown', 'touchstart', 'keydown', 'input', 'scroll', 'wheel'].forEach((ev) =>
    window.addEventListener(ev, touch, { passive: true, capture: true }),
  );
}

export function markActivity() {
  last = Date.now();
}

export function lastActivity() {
  return last;
}

export function setIdlePromptOpen(open) {
  promptOpen = open;
}

export function isIdlePromptOpen() {
  return promptOpen;
}

/** Idle time before "Still ordering?" appears, and how long its countdown runs. */
export const IDLE_MS = 20000;
export const IDLE_COUNTDOWN_S = 15;
/** The payment screen waits longer: guests are busy with their phone or the card machine. */
export const PAYMENT_IDLE_MS = 120000;
