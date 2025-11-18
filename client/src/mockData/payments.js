let mockPayments = {};

export const createMockQRPayment = (orderId, amountPaise) => {
  const transactionId = orderId;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
  
  const payment = {
    order_id: orderId,
    transaction_id: transactionId,
    qr_string: `upi://pay?pa=HIMALAYANSAVOURUAT@ybl&pn=KTR%20Kiosk&am=${amountPaise/100}&tr=${transactionId}&tn=Order%20Payment`,
    expires_at: expiresAt,
    provider: "PhonePe",
    amount_paise: amountPaise,
    status: "PENDING"
  };
  
  mockPayments[orderId] = payment;
  
  // Simulate payment success after 3 seconds (for demo)
  setTimeout(() => {
    if (mockPayments[orderId]) {
      mockPayments[orderId].status = "SUCCESS";
    }
  }, 3000);
  
  return payment;
};

export const getMockQRStatus = (orderId) => {
  return mockPayments[orderId] || { status: "NOT_FOUND" };
};

export const createMockEDCPayment = (orderId, amountPaise) => {
  const payment = {
    order_id: orderId,
    transaction_id: orderId,
    amount: amountPaise,
    message: "Your request has been successfully completed.",
    provider: "PhonePe EDC",
    payment_status: "PENDING"
  };
  
  mockPayments[orderId] = payment;
  
  // Simulate EDC success after 5 seconds
  setTimeout(() => {
    if (mockPayments[orderId]) {
      mockPayments[orderId].payment_status = "SUCCESS";
    }
  }, 5000);
  
  return payment;
};

export const getMockEDCStatus = (orderId) => {
  const payment = mockPayments[orderId];
  
  if (!payment) {
    return { status: "NOT_FOUND" };
  }
  
  return {
    order_id: orderId,
    transaction_id: orderId,
    payment_status: payment.payment_status,
    provider_code: payment.payment_status,
    payment_mode: "CARD",
    reference_number: `REF${Date.now()}`,
    amount: payment.amount,
    payment_state: payment.payment_status,
    provider_raw: {
      success: true,
      code: payment.payment_status,
      message: "Your request has been successfully completed.",
      data: {
        merchantId: "HIMALAYANSAVOURUAT",
        storeId: "teststore1",
        terminalId: "testterminal1",
        orderId: orderId,
        transactionId: orderId,
        status: payment.payment_status,
        responseCode: payment.payment_status === "SUCCESS" ? "00" : "null",
        timestamp: Date.now()
      }
    },
    kds_invoice_id: payment.payment_status === "SUCCESS" ? `INV-${Date.now()}` : null,
    kds_status: payment.payment_status === "SUCCESS" ? "POSTED" : "NOT_POSTED",
    kot_code: `ktr-${Math.floor(Math.random() * 100)}`
  };
};
