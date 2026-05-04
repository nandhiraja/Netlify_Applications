/**
 * Android WebView Print Bridge - ESC/POS Utility
 *
 * This module generates ESC/POS command strings for:
 *   - Customer Bill (receipt)
 *   - Food KOT (kitchen order ticket)
 *   - Coffee KOT
 *
 * And sends them to the Android USB printer via window.AndroidPrint.printBill().
 *
 * Detection:
 *   Call isAndroidBridge() to check if running inside the Android WebView.
 *   Returns false in a desktop browser, so existing fallbacks still work.
 */

// Coffee Category ID (must match printBillTemplates.js)
const COFFEE_CATEGORY_ID = "6868ca5dc29c8ed4d3c98dd8";

// --------------------------------------------------
// ESC/POS COMMAND CONSTANTS
// --------------------------------------------------
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: ESC + '@',           // Reset / Initialize printer
  ALIGN_LEFT: ESC + 'a\x00',      // Left align
  ALIGN_CENTER: ESC + 'a\x01',      // Center align
  ALIGN_RIGHT: ESC + 'a\x02',      // Right align
  BOLD_ON: ESC + 'E\x01',      // Bold on
  BOLD_OFF: ESC + 'E\x00',      // Bold off
  DOUBLE_HEIGHT: ESC + '!\x10',      // Double height text
  DOUBLE_BOTH: ESC + '!\x38',      // Bold + Double width + Double height
  NORMAL_TEXT: ESC + '!\x00',      // Normal size text
  CUT: GS + 'V\x41\x00', // Full paper cut
  FEED3: '\n\n\n',           // Feed 3 lines before cut
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

/**
 * Returns true when running inside the Android WebView.
 */
export const isAndroidBridge = () =>
  typeof window !== 'undefined' && typeof window.AndroidPrint !== 'undefined';

/**
 * Pad string to a fixed width (left-aligned, space-padded on right)
 */
function padEnd(str, len) {
  const s = String(str);
  return s.length >= len ? s.substring(0, len) : s + ' '.repeat(len - s.length);
}

/**
 * Pad string to a fixed width (right-aligned, space-padded on left)
 */
function padStart(str, len) {
  const s = String(str);
  return s.length >= len ? s.substring(0, len) : ' '.repeat(len - s.length) + s;
}

/**
 * Format a two-column row: left text + right text, total ~40 chars (58mm paper char width)
 */
function twoCol(left, right, totalWidth = 40) {
  const l = String(left);
  const r = String(right);
  const padding = totalWidth - l.length - r.length;
  return l + (padding > 0 ? ' '.repeat(padding) : ' ') + r + '\n';
}

/**
 * Center a string within a fixed width
 */
function center(str, width = 40) {
  const s = String(str);
  if (s.length >= width) return s + '\n';
  const pad = Math.floor((width - s.length) / 2);
  return ' '.repeat(pad) + s + '\n';
}

/**
 * Format current date/time: DD/MM/YYYY  HH:MM AM/PM
 */
function getDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB');
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}  ${time}`;
}

// --------------------------------------------------
// ESC/POS DOCUMENT BUILDERS
// --------------------------------------------------

/**
 * Build ESC/POS string for the customer Bill / Receipt
 */
function buildBillEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER) {
  let r = '';

  r += CMD.INIT;
  r += CMD.BOLD_ON; // Global bold — makes all text print darker

  // ---- HEADER ----
  r += CMD.ALIGN_CENTER;
  r += CMD.DOUBLE_BOTH;
  r += 'KTR\n';
  r += CMD.NORMAL_TEXT;
  r += 'Karnataka Tiffin Room\n';
  r += 'Bringing the flavors of Bengaluru\n';
  r += '-\n';
  r += `KTR-${storeName || 'Versova'}\n`;
  r += CMD.NORMAL_TEXT;
  r += `${ADDRESS_LINE_1 || 'Shop 202, JP Rd, Aram Nagar Pt 2,'}\n`;
  r += `${ADDRESS_LINE_2 || 'Versova, Andheri West, Mumbai 400061'}\n`;
  r += '----------------------------------------\n';

  // ---- KOT CODE ----
  r += CMD.ALIGN_CENTER;
  r += CMD.BOLD_ON;
  r += `KOT: ${kot_code}\n`;
  r += CMD.BOLD_OFF;
  r += '----------------------------------------\n';

  // ---- BILL INFO ----
  r += CMD.ALIGN_LEFT;
  r += `BILL NO : ${orderId}\n`;
  if (KDSInvoiceId) r += `KDS ID  : ${KDSInvoiceId}\n`;
  r += `DATE    : ${getDateTime()}\n`;
  r += `TYPE    : ${orderType || orderDetails.billType || 'DINE IN'}\n`;
  r += `KIOSK   : ${orderDetails.kiosk || 'KTR1'}\n`;
  r += '----------------------------------------\n';

  // ---- ITEMS HEADER ----
  r += CMD.BOLD_ON;
  r += padEnd('DESCRIPTION', 22) + padEnd('QTY', 4) + padStart('AMOUNT', 14) + '\n';
  r += CMD.BOLD_OFF;
  r += '----------------------------------------\n';

  // ---- ITEMS ----
  (orderDetails.items || []).forEach(item => {
    let basePrice = item.price || 0;
    
    if (item.selectedCustomizations) {
        let addonsTotal = 0;
        if (item.selectedCustomizations.addons) {
             item.selectedCustomizations.addons.forEach(a => {
                 addonsTotal += parseFloat(a.price || 0);
             });
        }
        
        if (item.selectedCustomizations.variation) {
             basePrice = parseFloat(item.selectedCustomizations.variation.price || 0) + addonsTotal;
        } else {
             basePrice = (item.price || 0) + addonsTotal;
        }
    }

    const itemPriceWithTax = basePrice + (item.taxAmount || 0);
    const itemTotal = (itemPriceWithTax * item.quantity).toFixed(2);
    const nameLine = padEnd(item.itemName, 22);
    const qty = padEnd(String(item.quantity), 4);
    const amt = padStart(`Rs ${itemTotal}`, 14);
    r += nameLine + qty + amt + '\n';
    
    // If item has customizations, print them indented
    if (item.selectedCustomizations) {
        if (item.selectedCustomizations.variation) {
             r += `  [Var: ${item.selectedCustomizations.variation.name}]\n`;
        }
        if (item.selectedCustomizations.addons && item.selectedCustomizations.addons.length > 0) {
             item.selectedCustomizations.addons.forEach(a => {
                 r += `  [Add: ${a.name}]\n`;
             });
        }
    }
  });

  r += '----------------------------------------\n';

  // ---- TOTALS ----
  r += twoCol('Total:', `Rs ${orderDetails.subtotal.toFixed(2)}`);
  
  if ((Number(orderDetails.takeawayChargeWithTax) || 0) > 0) {
    r += twoCol('Takeaway Charges (Incl. Tax):', `+${(Number(orderDetails.takeawayChargeWithTax) || 0).toFixed(2)}`);
  }

  r += twoCol('CGST 2.5%:', `+${(orderDetails.tax / 2).toFixed(2)}`);
  r += twoCol('SGST 2.5%:', `+${(orderDetails.tax / 2).toFixed(2)}`);
  r += '----------------------------------------\n';
  r += CMD.BOLD_ON;
  r += CMD.DOUBLE_HEIGHT;
  r += twoCol('TOTAL:', `Rs ${orderDetails.total.toFixed(0)}`);
  r += CMD.NORMAL_TEXT;
  r += CMD.BOLD_OFF;
  r += '----------------------------------------\n';

  // ---- GST FOOTER ----
  r += CMD.ALIGN_CENTER;
  r += `GST: ${GST_NUMBER || '27AA0FH7156G1Z0'}\n`;
  if (CIN_NUMBER) r += `CIN: ${CIN_NUMBER}\n`;
  r += `FSSAI: ${FSSAI_NUMBER || '21524005001190'}\n`;
  r += '\n';
  r += CMD.BOLD_ON;
  r += 'Thank You! Visit Again :)\n';
  r += CMD.BOLD_OFF;

  // ---- CUT ----
  r += CMD.FEED3;
  r += CMD.CUT;

  return r;
}

/**
 * Build ESC/POS string for Food KOT (non-coffee items)
 * Returns null if no food items exist.
 */
function buildFoodKOTEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, storeName) {
  const foodItems = (orderDetails.items || []).filter(
    item => item.categoryId !== COFFEE_CATEGORY_ID
  );

  if (foodItems.length === 0) return null;

  let r = '';

  r += CMD.INIT;
  r += CMD.BOLD_ON; // Global bold — makes all text print darker

  // ---- HEADER ----
  r += CMD.ALIGN_CENTER;
  r += `Karnataka Tiffin Room (${storeName || 'Versova'})\n`;
  r += '*** FOOD KOT ***\n';
  r += '----------------------------------------\n';

  // ---- TOKEN NUMBER (large) ----
  r += CMD.ALIGN_CENTER;
  r += CMD.DOUBLE_BOTH;
  r += `${String(kot_code).slice(4)}\n`;
  r += CMD.NORMAL_TEXT;
  r += `KOT: ${kot_code}\n`;
  r += '----------------------------------------\n';

  // ---- ORDER INFO ----
  r += CMD.ALIGN_LEFT;
  r += `BILL TYPE : ${orderDetails.billType || 'DINE IN'}\n`;
  r += `BILL NO   : KTR-${String(orderId).slice(4, 10)}\n`;
  r += `DATE/TIME : ${getDateTime()}\n`;
  r += `KIOSK     : ${orderDetails.kiosk || 'KTR1'}\n`;
  r += '----------------------------------------\n';

  // ---- ITEMS ----
  r += CMD.BOLD_ON;
  r += 'QTY  ITEM\n';
  r += CMD.BOLD_OFF;
  r += '----------------------------------------\n';

  foodItems.forEach(item => {
    r += `${padEnd(item.quantity, 5)}${item.itemName}\n`;
    if (item.selectedCustomizations) {
        if (item.selectedCustomizations.variation) {
             r += `       [Var: ${item.selectedCustomizations.variation.name}]\n`;
        }
        if (item.selectedCustomizations.addons && item.selectedCustomizations.addons.length > 0) {
             item.selectedCustomizations.addons.forEach(a => {
                 r += `       [Add: ${a.name}]\n`;
             });
        }
    }
  });

  r += '----------------------------------------\n';
  r += 'Instruction:\n';
  r += '\n';

  // ---- CUT ----
  r += CMD.FEED3;
  r += CMD.CUT;

  return r;
}

/**
 * Build ESC/POS string for Coffee KOT (coffee items only)
 * Returns null if no coffee items exist.
 */
function buildCoffeeKOTEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, storeName) {
  const coffeeItems = (orderDetails.items || []).filter(
    item => item.categoryId === COFFEE_CATEGORY_ID
  );

  if (coffeeItems.length === 0) return null;

  let r = '';

  r += CMD.INIT;
  r += CMD.BOLD_ON; // Global bold — makes all text print darker

  // ---- HEADER ----
  r += CMD.ALIGN_CENTER;
  r += `Karnataka Tiffin Room (${storeName || 'Versova'})\n`;
  r += '*** COFFEE KOT ***\n';
  r += '--- COFFEE COUNTER ---\n';
  r += '----------------------------------------\n';

  // ---- TOKEN NUMBER (large) ----
  r += CMD.ALIGN_CENTER;
  r += CMD.DOUBLE_BOTH;
  r += `${String(kot_code).slice(4)}\n`;
  r += CMD.NORMAL_TEXT;
  r += `KOT: ${kot_code}\n`;
  r += '----------------------------------------\n';

  // ---- ORDER INFO ----
  r += CMD.ALIGN_LEFT;
  r += `BILL TYPE : ${orderDetails.billType || 'DINE IN'}\n`;
  r += `BILL NO   : KTR-${String(orderId).slice(4, 10)}\n`;
  r += `DATE/TIME : ${getDateTime()}\n`;
  r += `KIOSK     : ${orderDetails.kiosk || 'KTR1'}\n`;
  r += '----------------------------------------\n';

  // ---- ITEMS ----
  r += CMD.BOLD_ON;
  r += 'QTY  COFFEE ITEM\n';
  r += CMD.BOLD_OFF;
  r += '----------------------------------------\n';

  coffeeItems.forEach(item => {
    r += `${padEnd(item.quantity, 5)}${item.itemName}\n`;
    if (item.selectedCustomizations) {
        if (item.selectedCustomizations.variation) {
             r += `       [Var: ${item.selectedCustomizations.variation.name}]\n`;
        }
        if (item.selectedCustomizations.addons && item.selectedCustomizations.addons.length > 0) {
             item.selectedCustomizations.addons.forEach(a => {
                 r += `       [Add: ${a.name}]\n`;
             });
        }
    }
  });

  r += '----------------------------------------\n';
  r += 'Instruction: COFFEE COUNTER\n';
  r += '\n';

  // ---- CUT ----
  r += CMD.FEED3;
  r += CMD.CUT;

  return r;
}

// --------------------------------------------------
// ANDROID BRIDGE CALLERS
// --------------------------------------------------

/**
 * Print customer bill via Android USB bridge.
 */
export const androidPrintBill = (orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER) => {
  const escPos = buildBillEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER);
  console.log('[AndroidPrint] 🧾 Sending Bill to printer...');
  window.AndroidPrint.printBill('USB', '', escPos);
};

/**
 * Print Food KOT via Android USB bridge.
 * Returns false if no food items (skipped).
 */
export const androidPrintFoodKOT = (orderId, kot_code, KDSInvoiceId, orderDetails, storeName) => {
  const escPos = buildFoodKOTEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, storeName);
  if (!escPos) {
    console.log('[AndroidPrint] ⚠️ No food items - Food KOT skipped');
    return false;
  }
  console.log('[AndroidPrint] 📄 Sending Food KOT to printer...');
  window.AndroidPrint.printBill('USB', '', escPos);
  return true;
};

/**
 * Print Coffee KOT via Android USB bridge.
 * Returns false if no coffee items (skipped).
 */
export const androidPrintCoffeeKOT = (orderId, kot_code, KDSInvoiceId, orderDetails, storeName) => {
  const escPos = buildCoffeeKOTEscPos(orderId, kot_code, KDSInvoiceId, orderDetails, storeName);
  if (!escPos) {
    console.log('[AndroidPrint] ⚠️ No coffee items - Coffee KOT skipped');
    return false;
  }
  console.log('[AndroidPrint] ☕ Sending Coffee KOT to printer...');
  window.AndroidPrint.printBill('USB', '', escPos);
  return true;
};

/**
 * Print all three documents sequentially via Android USB bridge.
 * Adds a 350ms delay between each print to avoid overwhelming the printer buffer.
 */
export const androidPrintAll = (orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER) => {
  console.log('[AndroidPrint] ✅ Android bridge detected — starting USB print...');

  // Bill — immediate
  androidPrintBill(orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER);

  // Food KOT — after 350ms
  setTimeout(() => {
    androidPrintFoodKOT(orderId, kot_code, KDSInvoiceId, orderDetails, storeName);
  }, 350);

  // Coffee KOT — after 700ms
  setTimeout(() => {
    androidPrintCoffeeKOT(orderId, kot_code, KDSInvoiceId, orderDetails, storeName);
  }, 700);
};
