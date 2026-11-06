import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, QrCode, Wallet, Smartphone } from 'lucide-react';
import '../styles/ktr.css';
import './Styles/PaymentPage.css';
import { useCart } from './CartContext';
import TokenSuccess from './TokenSuccess';

import { getKioskBaseUrl, defaultFetchHeaders } from '../utils/kioskApi';
import { orderTypeLabel, orderTypePrintLabel } from '../lib/orderType';
import { imageUrl, matchMenuItem, useMenuMeta } from '../lib/menuMeta';

const BASE_URL = getKioskBaseUrl();

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const meta = useMenuMeta();

  // Extract order data from location state
  const { payment_status, orderId, totalAmount, orderDetails } = location.state || {};

  // State management
  const [kotCode, setKotCode] = useState(null);
  const [showTokenPage, setShowTokenPage] = useState(false);
  const [KDSInvoiceId, setKDSInvoiceId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [edcData, setEdcData] = useState(null);
  const [zomatoData, setZomatoData] = useState(null);
  const [cashData, setCashData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingEDC, setLoadingEDC] = useState(false);
  const [loadingZomato, setLoadingZomato] = useState(false);
  const [loadingCash, setLoadingCash] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);
  const [cashPin, setCashPin] = useState('');
  const [showCashPinInput, setShowCashPinInput] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(100); // 100 seconds timer
  const [timerActive, setTimerActive] = useState(false);

  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let timerInterval;
    if (timerActive && timeRemaining > 0) {
      timerInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setPaymentStatus('TIMEOUT');
            setError('Payment timeout. Redirecting...');
            setTimeout(() => navigate('/cart'), 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerActive, timeRemaining, navigate]);

  // Redirect if no order data
  if (!orderId || !orderDetails) {
    return (
      <div className="ktr ktr-screen payment-root">
        <div className="payment-error">
          <h2>No order found</h2>
          <button onClick={() => navigate('/cart')} className="back-to-cart-btn">
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get store configuration from localStorage
  const getStoreConfig = () => {
    const config = localStorage.getItem('kiosk_config');
    return config ? JSON.parse(config) : { store_id: 'default' };
  };

  // Amount in paise (integer) per payments API
  const amountInPaise = Math.round(Number(totalAmount) * 100);

  // ============================================
  // QR CODE PAYMENT HANDLERS
  // ============================================

  const handleGenerateQR = async () => {
    setLoadingQR(true);
    setError(null);

    try {
      const config = getStoreConfig();

      const response = await fetch(`${BASE_URL}/payments/qr/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultFetchHeaders(),
        },
        body: JSON.stringify({
          order_id: orderId,
          amount_paise: amountInPaise,
          ...(config.terminal_id ? { terminal_id: config.terminal_id } : {}),
        })
      });

      if (!response.ok) throw new Error('Failed to generate QR code');

      const result = await response.json();
      setQrData(result);
      setPaymentStatus('PROCESSING');
      setTimeRemaining(100);
      setTimerActive(true);
      startQRStatusPolling();

    } catch (error) {
      console.error('QR Generation Error:', error);
      setError('Failed to generate QR code. Please try again.');
      setLoadingQR(false);
    } finally {
      setLoadingQR(false);
    }
  };

  const startQRStatusPolling = () => {
    let pollCount = 0;
    const maxPolls = 120; // 6 minutes timeout

    pollingRef.current = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(pollingRef.current);
        setPaymentStatus('FAILED');
        setError('Payment timeout. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/payments/qr/status/${orderId}`, {
          headers: { ...defaultFetchHeaders() },
        });

        if (!response.ok) throw new Error('Failed to check status');

        const result = await response.json();

        if (result.payment_status === 'COMPLETED') {
          setPaymentStatus('SUCCESS');
          setTransactionDetails(result);
          setKDSInvoiceId(result.kds_invoice_id);
          if (result.kot_code) setKotCode(result.kot_code);
          clearCart();
          localStorage.removeItem('restaurantCart');
          clearInterval(pollingRef.current);
          setShowTokenPage(true);
        } else if (result.payment_status === 'FAILED') {
          setPaymentStatus('FAILED');
          setError('Payment failed. Redirecting...');
          clearInterval(pollingRef.current);
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        console.error('QR Status Check Error:', error);
        // Continue polling on network errors
      }
    }, 3000);
  };

  // ============================================
  // EDC CARD & ZOMATO PAYMENT HANDLERS
  // ============================================

  const handleEDCPayment = async (paymentMethod = "CARD") => {
    const isZomato = paymentMethod === "ZOMATO_DISTRICT";

    if (isZomato) {
      setLoadingZomato(true);
    } else {
      setLoadingEDC(true);
    }
    
    setError(null);

    try {
      const config = getStoreConfig();

      const response = await fetch(`${BASE_URL}/payments/edc/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultFetchHeaders(),
        },
        body: JSON.stringify({
          order_id: orderId,
          amount_paise: amountInPaise,
          terminal_id: config.terminal_id,
          payment_method: paymentMethod
        })
      });

      if (!response.ok) throw new Error(`Failed to initialize ${isZomato ? 'Zomato District' : 'EDC'} payment`);

      const result = await response.json();
      
      if (isZomato) {
        setZomatoData(result);
      } else {
        setEdcData(result);
      }
      
      setPaymentStatus('PROCESSING');
      setTimeRemaining(100);
      setTimerActive(true);

      startEDCStatusPolling();

    } catch (error) {
      console.error(`${isZomato ? 'Zomato' : 'EDC'} Initialization Error:`, error);
      setError(`Failed to initialize ${isZomato ? 'Zomato District' : 'card'} payment. Please try again.`);
      if (isZomato) {
        setLoadingZomato(false);
      } else {
        setLoadingEDC(false);
      }
    } finally {
      if (isZomato) {
        setLoadingZomato(false);
      } else {
        setLoadingEDC(false);
      }
    }
  };

  const startEDCStatusPolling = () => {
    let pollCount = 0;
    const maxPolls = 120;

    pollingRef.current = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(pollingRef.current);
        setPaymentStatus('TIMEOUT');
        setError('Payment timeout. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/payments/edc/status/${orderId}`, {
          headers: { ...defaultFetchHeaders() },
        });

        if (!response.ok) throw new Error('Failed to check status');

        const result = await response.json();

        if (result.payment_status === 'COMPLETED') {
          setPaymentStatus('SUCCESS');
          setTransactionDetails(result);
          setKDSInvoiceId(result.kds_invoice_id);
          if (result.kot_code) setKotCode(result.kot_code);
          clearCart();
          localStorage.removeItem('restaurantCart');
          clearInterval(pollingRef.current);
          setShowTokenPage(true);
        } else if (result.payment_status === 'FAILED' || result.payment_status === 'CANCELLED') {
          setPaymentStatus('FAILED');
          setError('Payment failed or cancelled. Redirecting...');
          clearInterval(pollingRef.current);
          setTimeout(() => navigate('/'), 2000);
        }

      } catch (error) {
        console.error('EDC Status Check Error:', error);
        // Continue polling on network errors
      }
    }, 3000);
  };

  // ============================================
  // CASH PAYMENT HANDLERS
  // ============================================

  const handleCashPayment = async () => {
    if (!cashPin || cashPin.length === 0) {
      setError('Please enter a PIN');
      return;
    }

    setLoadingCash(true);
    setError(null);

    try {
      const config = getStoreConfig();

      const response = await fetch(`${BASE_URL}/payments/cash/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultFetchHeaders(),
        },
        body: JSON.stringify({
          order_id: orderId,
          amount_paise: amountInPaise,
          terminal_id: config.terminal_id,
          pin: cashPin
        })
      });

      if (!response.ok) throw new Error('Failed to process cash payment');

      const result = await response.json();

      if (result.payment_status === 'COMPLETED') {
        setPaymentStatus('SUCCESS');
        setTransactionDetails(result);
        setKDSInvoiceId(result.kds_invoice_id);
        if (result.kot_code) setKotCode(result.kot_code);
        setCashData(result);
        setTimerActive(false);
        clearCart();
        localStorage.removeItem('restaurantCart');
        setShowTokenPage(true);
      } else {
        setPaymentStatus('FAILED');
        setError('Cash payment failed. Please try again.');
      }

    } catch (error) {
      console.error('Cash Payment Error:', error);
      setError('Failed to process cash payment. Please try again.');
      setPaymentStatus('FAILED');
    } finally {
      setLoadingCash(false);
    }
  };

  const handleCashPinSubmit = (e) => {
    if (e.key === 'Enter') {
      handleCashPayment();
    }
  };

  // ============================================
  // CANCEL HANDLER
  // ============================================

  const handleCancelPayment = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setTimerActive(false);
    navigate('/cart');
  };

  // ============================================
  // PRINT HANDLERS - Silent Background Printing
  // ============================================

  const handlePrintAll = async () => {
    const orderType = orderTypePrintLabel();

    console.log('\n' + '='.repeat(60));
    console.log('🖨️  PRINT SERVICE - Starting Print Jobs');
    console.log('='.repeat(60));

    let pdfCount = 0;
    let printCount = 0;

    try {
      // Print Bill
      console.log('\n[1/3] Printing Bill...');
      const billResponse = await fetch('http://localhost:9100/print/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          kot_code: kotCode,
          KDSInvoiceId,
          orderDetails,
          orderType,
          transactionDetails,
          whatsappNumber: ''
        })
      });
      const billResult = await billResponse.json();

      if (billResult.success) {
        console.log('  ✅ PDF saved to Downloads');
        pdfCount++;
        if (billResult.printedToDevice) {
          console.log('  ✅ Sent to thermal printer');
          printCount++;
        }
      }

      // Print Food KOT
      console.log('\n[2/3] Printing Food KOT...');
      const foodResponse = await fetch('http://localhost:9100/print/food-kot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          kot_code: kotCode,
          KDSInvoiceId,
          orderDetails
        })
      });
      const foodResult = await foodResponse.json();

      if (foodResult.success) {
        if (foodResult.skipped) {
          console.log('  ⚠️  No food items to print');
        } else {
          console.log('  ✅ PDF saved to Downloads');
          pdfCount++;
          if (foodResult.printedToDevice) {
            console.log('  ✅ Sent to thermal printer');
            printCount++;
          }
        }
      }

      // Print Coffee KOT
      console.log('\n[3/3] Printing Coffee KOT...');
      const coffeeResponse = await fetch('http://localhost:9100/print/coffee-kot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          kot_code: kotCode,
          KDSInvoiceId,
          orderDetails
        })
      });
      const coffeeResult = await coffeeResponse.json();

      if (coffeeResult.success) {
        if (coffeeResult.skipped) {
          console.log('  ⚠️  No coffee items to print');
        } else {
          console.log('  ✅ PDF saved to Downloads');
          pdfCount++;
          if (coffeeResult.printedToDevice) {
            console.log('  ✅ Sent to thermal printer');
            printCount++;
          }
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ PRINT SERVICE - All Jobs Completed!');
      console.log('='.repeat(60));
      console.log(`\n📊 Summary:`);
      console.log(`  📁 PDFs created: ${pdfCount}`);
      console.log(`  📂 Location: Downloads/KioskPrints/`);
      console.log(`  🖨️  Printed to device: ${printCount > 0 ? 'YES (' + printCount + ')' : 'NO (PDFs only)'}`);
      console.log('');

    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ PRINT SERVICE - Connection Error');
      console.error('='.repeat(60));
      console.error('Could not connect to print service at localhost:9100');
      console.error('Make sure the backend service is running!');
      console.error('='.repeat(60) + '\n');
    }
  };

  const handleWhatsAppKOT = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    const message = `*KITCHEN ORDER TICKET*\n\nOrder ID: ${kotCode}\nTransaction ID: ${transactionDetails?.transaction_id || 'N/A'}\nDate: ${new Date().toLocaleString()}\n\n*Items:*\n${orderDetails.items.map(item => `${item.itemName} x${item.quantity}`).join('\n')}\n\nSubtotal: ₹${orderDetails.subtotal.toFixed(2)}\nTax: ₹${orderDetails.tax.toFixed(2)}\nTotal: ₹${orderDetails.total.toFixed(2)}\n\nThank you!`;

    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ============================================
  // RENDER TOKEN SUCCESS PAGE
  // ============================================

  if (showTokenPage) {
    return (
      <TokenSuccess
        token={kotCode}
        kot_code={kotCode}
        KDSInvoiceId={KDSInvoiceId}
        orderId={orderId}
        orderDetails={orderDetails}
        transactionDetails={transactionDetails}
        onPrintAll={handlePrintAll}
        onSendWhatsapp={handleWhatsAppKOT}
      />
    );
  }


  // ============================================
  // RENDER PAYMENT PAGE
  // ============================================

  const startQR = () => {
    if (qrData || loadingQR || selectedMethod) return;
    setSelectedMethod('qr');
    handleGenerateQR();
  };
  const startCard = () => {
    if (edcData || loadingEDC || selectedMethod) return;
    setSelectedMethod('edc');
    handleEDCPayment('CARD');
  };
  const startZomato = () => {
    if (zomatoData || loadingZomato || selectedMethod) return;
    setSelectedMethod('zomato_district');
    handleEDCPayment('ZOMATO_DISTRICT');
  };
  const startCash = () => {
    if (cashData || loadingCash || selectedMethod) return;
    setSelectedMethod('cash');
    setShowCashPinInput(true);
    setTimeRemaining(100);
    setTimerActive(true);
  };

  // A failed QR / card init starts nothing (no data, no polling), so the guest can safely pick again.
  const initFailed =
    Boolean(error) &&
    ((selectedMethod === 'qr' && !qrData && !loadingQR) ||
      (selectedMethod === 'edc' && !edcData && !loadingEDC) ||
      (selectedMethod === 'zomato_district' && !zomatoData && !loadingZomato));
  const chooseAgain = () => {
    setError(null);
    setTimerActive(false);
    setSelectedMethod(null);
  };

  const itemCount = orderDetails.items.reduce((n, it) => n + (it.quantity || 0), 0);
  const taxTotal = orderDetails.tax + (orderDetails.takeawayTax || 0);
  const clock = `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`;
  const amount = `₹${(amountInPaise / 100).toFixed(0)}`;
  const PIN_MAX = 4;
  const pressPin = (key) => {
    if (key === 'del') setCashPin((p) => p.slice(0, -1));
    else if (key === 'clear') setCashPin('');
    else setCashPin((p) => (p.length < PIN_MAX ? p + key : p));
  };

  const focused = {
    qr: {
      title: 'Scan to pay with UPI',
      sub: 'Open GPay, PhonePe, Paytm or any UPI app and scan this code.',
      loading: loadingQR && !qrData,
      loadingText: 'Getting your QR code ready…',
      waitText: 'Waiting for your payment',
    },
    edc: {
      title: 'Pay on the card machine',
      sub: 'Tap, insert or swipe your card on the machine at the counter.',
      loading: loadingEDC && !edcData,
      loadingText: 'Starting the card machine…',
      waitText: 'Waiting for the card machine',
    },
    zomato_district: {
      title: 'Pay with Zomato District',
      sub: 'Complete the Zomato District payment on the card machine.',
      loading: loadingZomato && !zomatoData,
      loadingText: 'Starting the card machine…',
      waitText: 'Waiting for Zomato District',
    },
    cash: {
      title: 'Pay with cash',
      sub: 'Hand the cash to our staff. They enter their PIN here to confirm.',
      loading: false,
      waitText: '',
    },
  }[selectedMethod];

  return (
    <div className="ktr ktr-screen payment-root">
      <div className="topbar">
        <div className="topbar-in wrap">
          {selectedMethod ? (
            <span className="topbar-title">Pay {amount}</span>
          ) : (
            <button type="button" className="restart" onClick={() => navigate('/cart')}>
              ← Back to order
            </button>
          )}
          <span className="spacer" />
          {timerActive ? (
            <span className="pay-timer" aria-label="Time remaining">⏱ {clock}</span>
          ) : (
            <span className="chip-type">{orderTypeLabel()}</span>
          )}
        </div>
      </div>
      <div className="topbar-plaid" />

      <main className="pay wrap">
        {error && <div className="err-box" role="alert">{error}</div>}

        {!selectedMethod ? (
          <>
            <section className="bill">
              <div className="bill-main">
                <div className="bill-copy">
                  <span className="k">Your KTR bill</span>
                  <span className="v">{amount}</span>
                  <span className="s">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} · incl. ₹{taxTotal.toFixed(0)} taxes
                    {orderDetails.takeawayChargeWithoutTax > 0 ? ` and ₹${orderDetails.takeawayChargeWithoutTax.toFixed(0)} packing` : ''}
                  </span>
                  {orderDetails.discountAmount > 0 && (
                    <span className="save">You saved ₹{Number(orderDetails.discountAmount).toFixed(0)} with {orderDetails.discountCode}</span>
                  )}
                </div>
                <div className="bill-dishes" aria-hidden="true">
                  {orderDetails.items.slice(0, 3).map((it, i) => {
                    const img = it.imageURL || imageUrl(matchMenuItem(meta, it.itemName)?.image);
                    return (
                      <span key={i} className={`dish ${img ? '' : 'pl'}`} style={img ? { backgroundImage: `url(${img})` } : undefined}>
                        {it.quantity > 1 && <b>×{it.quantity}</b>}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="bill-chips">
                {orderDetails.items.map((it, i) => (
                  <span key={i}>{it.quantity} × {it.itemName}</span>
                ))}
              </div>
            </section>

            <h2 className="pay-h">How would you like to pay?</h2>
            <div className="pay-grid">
              <button type="button" className="pay-tile wide m-upi" onClick={startQR}>
                <span className="ic"><QrCode size={30} /></span>
                <span className="tx">
                  <b>UPI</b>
                  <span>GPay · PhonePe · Paytm · any UPI app</span>
                </span>
                <span className="badge-fast">Fastest</span>
                <QrCode className="wm" size={150} aria-hidden="true" />
              </button>
              <button type="button" className="pay-tile m-card" onClick={startCard}>
                <span className="ic"><CreditCard size={28} /></span>
                <span className="tx"><b>Card</b><span>Tap, insert or swipe</span></span>
                <CreditCard className="wm" size={120} aria-hidden="true" />
              </button>
              <button type="button" className="pay-tile m-cash" onClick={startCash}>
                <span className="ic"><Wallet size={28} /></span>
                <span className="tx"><b>Cash</b><span>Pay our staff</span></span>
                <Wallet className="wm" size={120} aria-hidden="true" />
              </button>
              <button type="button" className="pay-tile wide m-zomato" onClick={startZomato}>
                <span className="ic"><Smartphone size={28} /></span>
                <span className="tx"><b>Zomato District</b><span>Pay on the card machine</span></span>
                <Smartphone className="wm" size={130} aria-hidden="true" />
              </button>
            </div>

            <details className="pay-items">
              <summary>
                <span>{orderDetails.items.map((it) => `${it.quantity} × ${it.itemName}`).join(' · ')}</span>
                <span className="view">View</span>
              </summary>
              <div className="rows">
                {orderDetails.items.map((item, idx) => {
                  const unit = item.pricePerUnit !== undefined ? item.pricePerUnit : (item.price || 0) + (item.taxAmount || 0);
                  const variant = item.selectedCustomizations?.variation?.name;
                  return (
                    <div key={idx} className="r">
                      <span>{item.quantity} × {item.itemName}{variant ? ` (${variant})` : ''}</span>
                      <span>₹{(unit * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="r"><span>Items</span><span>₹{orderDetails.subtotal.toFixed(2)}</span></div>
                {orderDetails.takeawayChargeWithoutTax > 0 && (
                  <div className="r"><span>Take-away packing</span><span>₹{orderDetails.takeawayChargeWithoutTax.toFixed(2)}</span></div>
                )}
                <div className="r"><span>Taxes</span><span>₹{taxTotal.toFixed(2)}</span></div>
                {orderDetails.discountAmount > 0 && (
                  <div className="r save"><span>Coupon {orderDetails.discountCode}</span><span>−₹{Number(orderDetails.discountAmount).toFixed(2)}</span></div>
                )}
                <div className="r total"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
              </div>
            </details>
          </>
        ) : (
          <section className="pay-focus">
            <h2>{focused.title}</h2>
            <p className="sub">{focused.sub}</p>

            {focused.loading && (
              <div className="pay-wait"><span className="spinner" />{focused.loadingText}</div>
            )}

            {selectedMethod === 'qr' && qrData && (
              <div className="qr-box">
                <QRCodeSVG value={qrData.qr_string} size={260} level="H" includeMargin />
              </div>
            )}

            {(selectedMethod === 'edc' && edcData) || (selectedMethod === 'zomato_district' && zomatoData) ? (
              <div className="machine" aria-hidden="true">
                <CreditCard size={64} />
              </div>
            ) : null}

            {selectedMethod === 'cash' && showCashPinInput && (
              <div className="cash">
                <div className="pin-dots" aria-label={`${cashPin.length} of ${PIN_MAX} digits entered`}>
                  {Array.from({ length: PIN_MAX }, (_, i) => <i key={i} className={i < cashPin.length ? 'on' : ''} />)}
                </div>
                <input
                  type="password"
                  className="pin-hidden"
                  value={cashPin}
                  onChange={(e) => setCashPin(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX))}
                  onKeyPress={handleCashPinSubmit}
                  maxLength={PIN_MAX}
                  aria-label="Staff PIN"
                  autoFocus
                />
                <div className="pinpad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'].map((k) => (
                    <button key={k} type="button" className={`pk ${k.length > 1 ? 'fn' : ''}`} onClick={() => pressPin(k)} disabled={loadingCash}>
                      {k === 'del' ? '⌫' : k === 'clear' ? 'Clear' : k}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn primary big" onClick={handleCashPayment} disabled={!cashPin || loadingCash}>
                  <span>{loadingCash ? 'Confirming…' : 'Confirm cash received'}</span>
                  <span className="price">{amount}</span>
                </button>
              </div>
            )}

            {!initFailed && selectedMethod !== 'cash' && <div className="pay-big">{amount}</div>}

            {initFailed && (
              <button type="button" className="btn primary big" onClick={chooseAgain}>
                <span>Choose another way to pay</span>
                <span className="price">{amount}</span>
              </button>
            )}

            {selectedMethod !== 'cash' && !focused.loading && paymentStatus === 'PROCESSING' && (
              <div className="pay-wait"><span className="spinner" />{focused.waitText}</div>
            )}

            <button type="button" className="btn ghost" onClick={handleCancelPayment}>
              Cancel payment
            </button>
            <p className="fine">Your token prints as soon as the payment goes through.</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default PaymentPage;
