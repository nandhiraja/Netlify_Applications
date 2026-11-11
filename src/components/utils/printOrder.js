/**
 * Store details printed on bills, and a bill-only print (used for reprints) that follows the same
 * printer order as a new order: Android USB bridge → local 9101 print service → browser print.
 */
import { isAndroidBridge, androidPrintBill } from './androidPrint';
import { sendTo9101Printer } from './backendPrintService';
import { generateBackendBill } from './backendPrintTemplates';
import { silentPrintBill } from './silentPrint';

const STORES = {
  versova: {
    ADDRESS_LINE_1: 'Shop no. 202, Aram nagar, JP Rd, Aram Nagar Part 2, Machlimar,',
    ADDRESS_LINE_2: 'Versova, Andheri West, Mumbai, Maharashtra 400061',
    GST_NUMBER: '27AA0FH7156G1Z0',
    FSSAI_NUMBER: '21524006001802',
    CIN_NUMBER: '6731',
  },
  bandra: {
    ADDRESS_LINE_1: 'Shop No.36/A, Off Carter Rd, Rizvi Complex, Union Park,',
    ADDRESS_LINE_2: ' Bandra West, Mumbai, Maharashtra 400050',
    GST_NUMBER: '27AA0FH7156G1Z0',
    FSSAI_NUMBER: '21524006001802',
    CIN_NUMBER: '6731',
  },
};
const BLANK = { ADDRESS_LINE_1: '', ADDRESS_LINE_2: '', GST_NUMBER: '', FSSAI_NUMBER: '', CIN_NUMBER: '' };

/** Store name from the kiosk config plus the address and registration lines for its bills. */
export function storePrintInfo() {
  let storeName = '';
  try {
    storeName = JSON.parse(localStorage.getItem('kiosk_config'))?.store_name || '';
  } catch {
    storeName = '';
  }
  const lower = storeName.toLowerCase();
  const details = lower.includes('versova') ? STORES.versova : lower.includes('bandra') ? STORES.bandra : BLANK;
  return { storeName, ...details };
}

/**
 * Prints the customer bill only (no kitchen tickets).
 * @param {object} order entry from lib/orderHistory
 * @returns {Promise<{ok: boolean, via?: string, error?: string}>}
 */
export async function printBillOnly(order) {
  const { orderId, kot_code, KDSInvoiceId, orderDetails, transactionDetails, orderTypePrint } = order;
  const s = storePrintInfo();
  const tail = [s.storeName, s.ADDRESS_LINE_1, s.ADDRESS_LINE_2, s.GST_NUMBER, s.FSSAI_NUMBER, s.CIN_NUMBER];

  if (isAndroidBridge()) {
    try {
      androidPrintBill(orderId, kot_code, KDSInvoiceId, orderDetails, orderTypePrint, transactionDetails, ...tail);
      return { ok: true, via: 'android' };
    } catch (e) {
      return { ok: false, error: `Android USB print failed: ${e.message}` };
    }
  }

  try {
    const html = generateBackendBill(orderId, kot_code, orderDetails, orderTypePrint, ...tail);
    const result = await sendTo9101Printer(html, `Bill_${orderId}_reprint`);
    if (result?.success) return { ok: true, via: '9101' };
  } catch (e) {
    console.error('[Reprint] 9101 print failed:', e);
  }

  try {
    silentPrintBill(orderId, kot_code, orderDetails, orderTypePrint, ...tail);
    return { ok: true, via: 'browser' };
  } catch (e) {
    return { ok: false, error: `Could not reach the printer: ${e.message}` };
  }
}
