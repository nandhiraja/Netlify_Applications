import React from 'react';
import PropTypes from 'prop-types';
import './Styles/MenuItemCard.css';

const MenuItemCard = ({ item, onAddClick }) => {
  // Destructure with proper API field names
  const { 
    itemName, 
    price, 
    tags = [], 
    taxes = [], 
    taxAmount = 0,
    imageURL,
    itemNature,
    skuCode 
  } = item;

  // Calculate total price including taxes
  const totalPrice = price + taxAmount;

  // Determine if item is vegetarian/non-vegetarian from tags
  const isVeg = tags.some(tag => tag.toLowerCase().includes('vegetarian') || tag.toLowerCase() === 've');
  const isNonVeg = tags.some(tag => tag.toLowerCase().includes('non-vegetarian'));

  return (
    <div className="menu-item-card">
      {/* Item Image - placeholder or from external source */}
      <div className="item-image-container">
        <img
          className="item-image"
          src={item.imageURL || './placeholder.jpg' } // You can use skuCode or itemId for image mapping

          alt={itemName}
          loading="lazy"
          onError={(e) => {
             e.target.onerror = null;
            e.target.src = './placeholder.jpg'; // Fallback image
          }}
        />
        <div className="image-overlay"></div>
        
        {/* Veg/Non-Veg indicator */}
        {(isVeg || isNonVeg) && (
          <div className={`food-type-badge ${isVeg ? 'veg' : 'non-veg'}`}>
            <span className="food-indicator"></span>
          </div>
        )}
      </div>
      
      {/* Item Details and Action */}
      <div className="item-content">
        <div className="item-details">
          {/* Item Name */}
          <h3 className="item-name">{itemName}</h3>
          
          {/* Display Tags
          {tags.length > 0 && (
            <div className="item-tags">
              {tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag-badge">{tag}</span>
              ))}
            </div>
          )} */}

          {/* Item Nature (Service/Goods)                                               on thing is command
          {itemNature && (
            <p className="item-nature">{itemNature}</p>
          )} */}
        </div>
        
        {/* Price and Add Button */}
        <div className="item-footer">
          {/* Price Section */}
          <div className="price-container">
            <span className="item-price">
              <span className="currency-symbol">₹</span>
              {price.toFixed(2)}
            </span>
            
            {/* Tax Information */}
            {taxAmount > 0 && (
              <span className="tax-info">
                + ₹{taxAmount.toFixed(2)} tax
              </span>
            )}
            
            {/* Total Price */}
            {taxAmount > 0 && (
              <span className="total-price">
                Total: ₹{totalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Add Button */}
          <button className="add-btn" onClick={() => onAddClick(item)}>
            <span className="add-btn-text">Add</span>
            <span className="add-btn-icon">+</span>
          </button>
        </div>
        
        {/* Tax Breakdown (optional, can be shown on hover) */}
        {taxes.length > 0 && (
          <div className="tax-breakdown">
            {taxes.map((tax, index) => (
              <span key={index} className="tax-detail">
                {tax.name} ({tax.percentage}%)
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

MenuItemCard.propTypes = {
  item: PropTypes.shape({
    itemId: PropTypes.string.isRequired,
    itemName: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    itemNature: PropTypes.string,
    categoryId: PropTypes.string.isRequired,
    skuCode: PropTypes.string,
    status: PropTypes.string,
    measuringUnit: PropTypes.string,
    itemTagIds: PropTypes.arrayOf(PropTypes.string),
    taxTypeIds: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string), // Enriched data
    taxes: PropTypes.arrayOf(PropTypes.shape({
      taxTypeId: PropTypes.string,
      name: PropTypes.string,
      percentage: PropTypes.number
    })),
    taxAmount: PropTypes.number, // Calculated tax amount
  }).isRequired,
  onAddClick: PropTypes.func.isRequired,
};

export default MenuItemCard;
