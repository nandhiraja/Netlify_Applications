// Store created orders in memory for demo
let mockOrders = [];
let orderCounter = 1;

export const createMockOrder = (orderData) => {
  const orderId = `ord-${Math.random().toString(36).substr(2, 9)}${Date.now()}`;
  const kotCode = `ktr-${orderCounter++}`;
  
  const newOrder = {
    order_id: orderId,
    total_amount_include_tax: orderData.total_amount_include_tax,
    total_amount_exclude_tax: orderData.total_amount_exclude_tax,
    kot_code: kotCode,
    items: orderData.items,
    channel: orderData.channel,
    created_at: new Date().toISOString()
  };
  
  mockOrders.push(newOrder);
  return newOrder;
};

export const getMockOrder = (orderId) => {
  return mockOrders.find(order => order.order_id === orderId);
};
