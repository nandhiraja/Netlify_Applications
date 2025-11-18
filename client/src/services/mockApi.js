import {
  mockCatalog,
  createMockOrder,
  getMockOrder,
  createMockQRPayment,
  getMockQRStatus,
  createMockEDCPayment,
  getMockEDCStatus
} from '../mockData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // GET /catalog
  getCatalog: async (channel) => {
    await delay(300);
    return {
      success: true,
      data: mockCatalog
    };
  },

  // POST /orders
  createOrder: async (orderData) => {
    await delay(400);
    const order = createMockOrder(orderData);
    return {
      success: true,
      data: order
    };
  },

  // POST /payments/qr/init
  initiateQRPayment: async (orderId, amountPaise) => {
    await delay(300);
    const payment = createMockQRPayment(orderId, amountPaise);
    return {
      success: true,
      data: payment
    };
  },

  // GET /payments/qr/status/{order_id}
  getQRPaymentStatus: async (orderId) => {
    await delay(200);
    const status = getMockQRStatus(orderId);
    return {
      success: true,
      data: status
    };
  },

  // POST /payments/edc/init
  initiateEDCPayment: async (orderId, amountPaise) => {
    await delay(500);
    const payment = createMockEDCPayment(orderId, amountPaise);
    return {
      success: true,
      data: payment
    };
  },

  // GET /payments/edc/status/{order_id}
  getEDCPaymentStatus: async (orderId) => {
    await delay(200);
    const status = getMockEDCStatus(orderId);
    return {
      success: true,
      data: status
    };
  }
};
