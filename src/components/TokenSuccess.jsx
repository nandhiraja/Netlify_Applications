import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import '../styles/ktr.css';
import './Styles/TokenSuccess.css';
import { Printer, MessageCircle } from 'lucide-react';
import { IoLogoWhatsapp } from "react-icons/io";
import { silentPrintBill, silentPrintFoodKOT, silentPrintCoffeeKOT, silentPrintAll } from './utils/silentPrint';
import { triggerBackend9101Prints } from './utils/backendPrintService';
import { isAndroidBridge, androidPrintAll } from './utils/androidPrint';
import { orderTypeLabel, orderTypePrintLabel } from '../lib/orderType';
import { saveCompletedOrder } from '../lib/orderHistory';
import { printBillOnly, storePrintInfo } from './utils/printOrder';

const DONE_HOLD_S = 20;

const TokenSuccess = ({
  token,
  kot_code,
  KDSInvoiceId,
  orderId,
  orderDetails,
  transactionDetails,
  onPrintAll,
  onSendWhatsapp,
  paymentMethod
}) => {

  const navigate = useNavigate();

  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [printError, setPrintError] = useState(null); // Error state for print failures
  const [isPrintSuccess, setIsPrintSuccess] = useState(false); // Track successful print
  const [printStatus, setPrintStatus] = useState('idle'); // 'idle', 'printing', 'success', 'error'
  const [printNotification, setPrintNotification] = useState(''); // User-facing notification message
  const [secondsLeft, setSecondsLeft] = useState(DONE_HOLD_S);
  const [reprintNote, setReprintNote] = useState('');

  // Keep the paid order on this kiosk so staff can reprint its bill later.
  useEffect(() => {
    saveCompletedOrder({
      orderId,
      kot_code,
      KDSInvoiceId,
      orderDetails,
      transactionDetails,
      paymentMethod,
      orderTypePrint: orderTypePrintLabel(),
      orderTypeLabel: orderTypeLabel(),
    });
  }, [orderId]);

  // Once everything is done the token stays up for 20 s, then the welcome screen returns.
  // Not while a print error is showing: staff close that themselves.
  const counting = !printError && isPrintSuccess;
  useEffect(() => {
    if (!counting) return undefined;
    if (secondsLeft <= 0) {
      navigate('/');
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [counting, secondsLeft, navigate]);

  const handleReprint = async () => {
    setSecondsLeft(DONE_HOLD_S);
    setReprintNote('Printing your bill again…');
    const res = await printBillOnly({
      orderId, kot_code, KDSInvoiceId, orderDetails, transactionDetails, orderTypePrint: orderTypePrintLabel(),
    });
    setReprintNote(res.ok ? 'Bill printed again, please collect it.' : res.error || 'Could not print the bill.');
  };

  // 🔥 AUTOMATED PARALLEL PRINTING WITH FALLBACK - Triggered automatically on page load
  useEffect(() => {

    const autoPrintAll = async () => {
      // Set printing status and show notification
      const orderType = orderTypePrintLabel();
      const { storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER } = storePrintInfo();

      console.log("storeName : ", storeName);
      console.log("orderType : ", orderType);
      try {
        setPrintNotification('Bills are printing...');
        console.log('[TokenSuccess] 🖨️ Starting automated printing via 9101...');
        setPrintStatus('printing');

        /*
        // ==========================================
        // ❌ OLD 9100 PRINT METHOD (COMMENTED OUT)
        // ==========================================
        // const printResults = await Promise.all([
        //   fetch('http://localhost:9100/print/food-kot', { ... }),
        //   fetch('http://localhost:9100/print/coffee-kot', { ... }),
        //   fetch('http://localhost:9100/print/bill', { ... })
        // ]);
        */

        // ============================================================
        // TIER 1: Android WebView USB Bridge (ESC/POS direct)
        // ============================================================
        if (isAndroidBridge()) {
          console.log('[TokenSuccess] 🤖 Android bridge detected — using USB ESC/POS printing');
          try {
            androidPrintAll(
              orderId,
              kot_code,
              KDSInvoiceId,
              orderDetails,
              orderType,
              transactionDetails,
              storeName,
              ADDRESS_LINE_1,
              ADDRESS_LINE_2,
              GST_NUMBER,
              FSSAI_NUMBER,
              CIN_NUMBER
            );
            // Android print is fire-and-forget; assume success after dispatch
            setPrintStatus('success');
            setPrintNotification('Bills printed successfully, please collect them');
            setIsPrintSuccess(true);
          } catch (androidError) {
            console.error('[TokenSuccess] ✗ Android bridge print error:', androidError);
            setPrintError(['Android USB print failed: ' + androidError.message]);
            setPrintStatus('error');
            setPrintNotification('');
          }
          return; // Do not attempt network-based methods on Android
        }

        // ✅ PRIMARY METHOD: STANDALONE 9101 PRINT SERVICE
        let is9101Success = false;
        try {
           const result = await triggerBackend9101Prints(
              orderId, kot_code, orderDetails, orderType, storeName,
              ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER
           );
           
           if (result && result.success) {
               console.log('[TokenSuccess] ✅ All print jobs completed successfully via 9101 backend');
               setPrintStatus('success');
               setPrintNotification('Bills printed successfully, please collect them');
               setIsPrintSuccess(true);
               is9101Success = true;
           } else {
               throw new Error(result?.errors?.join(', ') || 'Unknown print error from 9101');
           }
        } catch (newPrinterErr) {
           console.error('[TokenSuccess] ✗ 9101 printer flow failed:', newPrinterErr);
        }

        // ⚠️ FALLBACK METHOD: Browser Print (if 9101 failed)
        if (!is9101Success) {
           console.log('[TokenSuccess - Local print Failed] ⚡ Backend 9101 print failed, attempting browser print fallback...');
           try {
             // 9101 doesn't return partial success easily, so we fallback and print all
             silentPrintAll(orderId, kot_code, orderDetails, orderType, storeName, ADDRESS_LINE_1, ADDRESS_LINE_2, GST_NUMBER, FSSAI_NUMBER, CIN_NUMBER);

             console.log('[TokenSuccess] ✅ Fallback print triggered successfully');
             setPrintStatus('success');
             setPrintNotification('Bills printed successfully, please collect them');
             setIsPrintSuccess(true);
           } catch (fallbackError) {
             console.error('[TokenSuccess] ✗ Both backend and browser print failed:', fallbackError);
             setPrintError([
               'Could not connect to print service',
               'Browser print fallback also failed',
               `Details: ${fallbackError.message}`
             ]);
             setPrintStatus('error');
             setPrintNotification('');
           }
        }
      } catch (error) {
        console.error('[TokenSuccess] Unexpected error in automated printing:', error);
      }
    };

    // Trigger automatic printing after a small delay to ensure component is mounted
    const printTimer = setTimeout(() => {
      autoPrintAll();
    }, 500);

    return () => clearTimeout(printTimer);
  }, [orderId, kot_code, KDSInvoiceId, orderDetails, transactionDetails]);

  // Handle error modal close - redirect to home after staff closes
  const handleCloseError = () => {
    setPrintError(null);
    navigate('/');
  };

  const handleWhatsappSend = () => {
    if (whatsappNumber && whatsappNumber.length >= 10) {
      onSendWhatsapp(whatsappNumber);
      setShowWhatsappInput(false);
      setWhatsappNumber('');
    } else {
      alert('Please enter a valid 10-digit phone number');
    }
  };

  // Rough wait: base kitchen time plus a little per dish (coffee and add-ons don't add time).
  const foodUnits = (orderDetails?.items || []).reduce((n, it) => {
    const name = (it.itemName || '').toLowerCase();
    return /coffee|chutney|pudi powder/.test(name) ? n : n + (it.quantity || 0);
  }, 0);
  const waitMins = Math.min(25, 8 + 2 * Math.max(0, foodUnits - 1));
  const tokenNo = token ? token.replace(/^KTR-/, '') : 'N/A';

  return (
    <div className="ktr ktr-screen done wrap">
      <div className="done-wrap">
        <section className="ticket" aria-live="polite">
          <span className="k">Your token</span>
          <span className="num">{tokenNo}</span>
          <div className="tear" aria-hidden="true" />
          <p className="its">
            {(orderDetails?.items || []).map((it, i) => (
              <span key={i}>
                {it.quantity} × {it.itemName}
                {it.selectedCustomizations?.parcel ? <span className="tg p">Parcel</span> : null}
                <br />
              </span>
            ))}
          </p>
          <p>{orderTypeLabel()} · Paid ₹{Number(orderDetails?.total || 0).toFixed(0)}</p>
        </section>

        <section className="promise">
          <div className="pr-time">
            <b>~{waitMins}</b>
            <span>minutes</span>
          </div>
          <div className="pr-tx">
            <span className="pr-k">Thank you!</span>
            <h2>Good food takes a little time.</h2>
            <p>
              Nothing here waits under a heat lamp. Our team is pouring your batter, roasting it in benne and grinding the
              chutney fresh, just for you. Please allow about <b>{waitMins} minutes</b> for your order.
            </p>
            <p className="pr-tip">
              Collect your printed token below the screen, grab a seat and keep an eye on the token board.
              We&apos;ll call out <b>token {tokenNo}</b> the moment it&apos;s ready.
            </p>
          </div>
        </section>
      </div>

      {printNotification && (
        <div className={`print-note ${printStatus}`}>
          {printStatus === 'printing' && <span className="print-spinner" />}
          {printStatus === 'success' && <span aria-hidden="true">✓</span>}
          <span>{printNotification}</span>
        </div>
      )}

      {reprintNote && <div className="print-note">{reprintNote}</div>}

      <div className="done-foot">
        <span className="cd">
          Namaskara, and enjoy your tiffin!{counting ? ` New order screen in ${secondsLeft}s.` : ''}
        </span>
        <div className="row">
          {isPrintSuccess && (
            <button type="button" className="btn soft" onClick={handleReprint}>Print bill again</button>
          )}
          <button type="button" className="btn primary" onClick={() => navigate('/')}>
            Start a new order
          </button>
        </div>
      </div>

        {/* ⚠️ ERROR MODAL - Shows when print fails */}
        {printError && (
          <div className="print-error-overlay">
            <div className="print-error-modal">
              <div className="print-error-header">
                <span className="print-error-icon">⚠️</span>
                <h2>Print Service Error</h2>
              </div>

              <div className="print-error-content">
                <p className="print-error-message">
                  The following print job(s) failed. Please check the print service and try again.
                </p>

                <ul className="print-error-list">
                  {printError.map((error, index) => (
                    <li key={index} className="print-error-item">
                      <span className="error-bullet">✗</span>
                      {error}
                    </li>
                  ))}
                </ul>

                <div className="print-error-instructions">
                  <strong>Staff Instructions:</strong>
                  <ol>
                    <li>Check if the print service is running</li>
                    <li>Verify printer connections</li>
                    <li>Review the error details above</li>
                    <li>Click "Close & Return" to go back to home page</li>
                  </ol>
                </div>
              </div>

              <div className="print-error-actions">
                <button
                  className="print-error-close-btn"
                  onClick={handleCloseError}
                >
                  Close & Return to Home
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default TokenSuccess;