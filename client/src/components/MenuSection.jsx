import React, { useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import MenuHeader from './MenuHeader';
import MenuItemCard from './MenuItemCard';
import MenuItemModal from './MenuItemModal';
import Navigation from './NavigationBar';
import NotificationToast from './Notification';
import './Styles/MenuSection.css';

const MenuSection = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Extract data from location state
  const {
    category,
    items = [],
    itemTags = [],
    taxTypes = [],
    charges = [],
    discounts = [],
    orderType = 'dine-in'
  } = state || {};

  console.log("MenuSection received:", state);

  // Function to get tag names for an item
  const getItemTags = (itemTagIds = []) => {
    return itemTagIds.map(tagId => {
      const tag = itemTags.find(t => t.itemTagId === tagId);
      return tag ? tag.name : '';
    }).filter(Boolean);
  };

  // Function to get tax info for an item
  const getItemTaxes = (taxTypeIds = []) => {
    return taxTypeIds.map(taxId => {
      const tax = taxTypes.find(t => t.taxTypeId === taxId);
      return tax;
    }).filter(Boolean);
  };

  // Enrich items with tag and tax information
  const enrichedItems = items.map(item => ({
    ...item,
    tags: getItemTags(item.itemTagIds),
    taxes: getItemTaxes(item.taxTypeIds),
    // Calculate tax amount if needed
    taxAmount: item.taxTypeIds ? 
      item.taxTypeIds.reduce((sum, taxId) => {
        const tax = taxTypes.find(t => t.taxTypeId === taxId);
        return sum + (tax ? (item.price * tax.percentage / 100) : 0);
      }, 0) : 0
  }));

  const openModalWithItem = (item) => {
    setSelectedMenuItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMenuItem(null);
  };

  const handleAddToCart = (itemWithCustomizations) => {
    console.log("Adding to cart:", itemWithCustomizations);
    setShowNotification(true);
    // Add cart logic here using CartContext
  };

  if (!state) {
    return (
      <div className="menu-section-container">
        <p>No data available. Please go back and select a category.</p>
        <button onClick={() => navigate('/dinein')}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div>
      <div className="menu-section-container">
        <Navigation />

        {/* Category Header */}
        <div className="category-header">
          <h2>{category?.name || 'Menu Items'}</h2>
          <p className="order-type-badge">
            {orderType === 'dine-in' ? 'Dine In' : 'Take Away'}
          </p>
        </div>

        {/* The Grid of Menu Items */}
        <main className="menu-main-content">
          <div className="menu-items-grid">
            {enrichedItems.length > 0 ? (
              enrichedItems.map((item) => (
                <MenuItemCard 
                  key={item.itemId} 
                  item={item} 
                  onAddClick={openModalWithItem} 
                />
              ))
            ) : (
              <p>No items available in this category.</p>
            )}
          </div>
        </main>

        {isModalOpen && selectedMenuItem && (
          <MenuItemModal 
            item={selectedMenuItem} 
            onClose={closeModal} 
            onAddToCart={handleAddToCart}
          />
        )}

        <NotificationToast
          message="Successfully added to cart!"
          isVisible={showNotification}
          onClose={() => setShowNotification(false)}
        />
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

export default MenuSection;
