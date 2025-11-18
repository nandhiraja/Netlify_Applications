import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Styles/MenuPage.css';
import { IoMdArrowRoundBack } from "react-icons/io";
import { mockApi } from '../services/mockApi'; // Import mock API

// Remove this line - no longer needed
// const BASE_URL = import.meta.env.VITE_Base_url;

const MenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderType = location.state?.orderType || 'dine-in';
  
  const [allMenuData, setAllMenuData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleCardClick = (category) => {
    const categoryItems = allMenuData.items.filter(
      item => item.categoryId === category.categoryId
    );
    
    navigate(`/item/${category.categoryId}`, { 
      state: { 
        category,
        items: categoryItems,
        itemTags: allMenuData.itemTags,
        taxTypes: allMenuData.taxTypes,
        charges: allMenuData.charges,
        discounts: allMenuData.discounts,
        orderType 
      } 
    });
  };

  const handleBackClick = () => {
    navigate('/');
  };

  useEffect(() => {
    console.log("Fetching category data from mock API...");
    
    // Replace fetch with mock API call
    mockApi.getCatalog('Palas Kiosk')
      .then((response) => {
        console.log("Mock data received:", response.data);
        
        // Store all data
        setAllMenuData(response.data);
        setCategories(response.data.categories);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching category data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="menu-container"><p>Loading menu...</p></div>;
  }

  return (
    <div className="menu-container">
      {/* Header Section */}
      <div className="menu-header">
        <button className="back-button" onClick={handleBackClick}>
          <IoMdArrowRoundBack/>
        </button>
        <h1 className="menu-title">Menu</h1>
        <div className="order-type-badge">
          {orderType === 'dine-in' ? 'Dine In' : 'Take Away'}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {categories.map((category) => (
          <div 
            key={category.categoryId} 
            className="menu-card"
            onClick={() => handleCardClick(category)}
          >
            <div className="card-image-wrapper">
              <img 
                src={category.imageUrl || './placeholder.jpg'}
                alt={category.name}
                className="card-image"
                onError={(e) => {
                  e.target.src = '/home/nandhiraja/Nandhiraja C/Naveen Nk project/restaurant-kiosk-frontend/client/public/Images/spaghetti-carbonara.png';
                }}
              />
              <div className="card-overlay"></div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{category.name}</h3>
            </div>
            <div className="card-shine"></div>
          </div>
        ))}
      </div>

      <footer className="menu-footer">
        <div className="footer-content">
          <p className="footer-text">Scroll to explore more delicious items</p>
          <div className="footer-decorative-line"></div>
        </div>
      </footer>
    </div>
  );
};

export default MenuPage;
