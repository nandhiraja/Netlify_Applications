import './Styles/MenuHeader.css';
import { ShoppingCart, Home, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import CartPage from './CartPage'; // or import your CartPage if it is styled as a modal
import HomePage from './Home';
import {Link, useNavigate } from "react-router-dom"
const Navigation = ()=>{
  const navigate = useNavigate();
  const [showHome, setShowHome] = useState(false);  
  const [showCart, setShowCart] = useState(false);    // <-- Add this state

const handleHomeClick = () => {
    setShowHome(true);
  };
const handleCartClick = () => {
    setShowCart(true);
  };

  const handleCartClose = () => {
    setShowCart(false);
  };

  const handleBack = () => {
    navigate('/'); // Go back to previous page
  };


 return (
    <>
    <header className="menu-header">
     <div className="header-top">
        <div className="header-title-section">
          <h1 className="menu-title">Menu</h1>
          <p className="menu-subtitle">
            <span className="subtitle-accent">~</span> Take Away
          </p>
        </div>
        {/* Utility Buttons */}
        <div className="header-actions">
          <button className="action-btn home-btn" onClick ={handleBack}>
            <Home size={18} />
          </button>
          <button className="action-btn cart-btn" onClick={handleCartClick}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    
    </header>

    {/* Cart Modal/Page */}
      {showCart && (
        <CartPage onClose={handleCartClose} />
      )}
      
    </>
 )
}

export default Navigation;