import React from 'react';
import { Plus, Minus, Trash } from 'lucide-react';
import './Styles/CartPage.css';
import { useCart } from './CartContext';

function CartPage({onClose}) {
  const { cart, removeItem, updateQuantity } = useCart();

  // Calculate totals WITHOUT adding extra tax
  // finalPrice already includes tax from the modal
  const total = cart.items.reduce((acc, item) => {
    return acc + (item.finalPrice || 0);
  }, 0);

  // Calculate breakdown for display
  // Extract base amount and tax from items
  const breakdown = cart.items.reduce((acc, item) => {
    const basePrice = item.price || 0;
    const taxAmount = (item.taxAmount || 0) * item.quantity;
    const baseTotal = basePrice * item.quantity;
    
    return {
      subtotal: acc.subtotal + baseTotal,
      tax: acc.tax + taxAmount
    };
  }, { subtotal: 0, tax: 0 });

  return (
    <div className="cart-root">
      <header className="cart-header">
        <span className="back-arrow" onClick={onClose} style={{cursor: "pointer"}}>
          {'←'}
        </span>
        <h1>Your Cart</h1>
      </header>
      
      <main className="cart-content">
        <div className="cart-items-container">
          {cart.items.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.items.map((item, idx) => (
              <div className="cart-item-card" key={idx}>
                <img 
                  src={`/images/${item.skuCode}.jpg`} 
                  alt={item.itemName} 
                  className="cart-item-img"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.jpg';
                  }}
                />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.itemName}</div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="cart-item-tags">
                      {item.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="tag-small">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="cart-qty-price">
                  <div className="qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(idx, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="qty">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <span className="item-each-price">
                    ₹{(item.pricePerUnit || item.finalPrice / item.quantity).toFixed(2)} each
                  </span>
                  
                  <span className="item-total-price">
                    ₹{item.finalPrice.toFixed(2)}
                  </span>
                  
                  <button className="delete-btn" onClick={() => removeItem(idx)}>
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="cart-summary-card">
          <div className="summary-row">
            <span>Base Amount:</span>
            <span>₹{breakdown.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Total Tax (CGST + SGST):</span>
            <span>₹{breakdown.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button className="payment-btn">
            Proceed to Payment - ₹{total.toFixed(2)}
          </button>
        </div>
      </main>
    </div>
  );
}

export default CartPage;
