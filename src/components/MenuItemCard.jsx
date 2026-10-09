import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Styles/MenuItemCard.css';

const MenuItemCard = ({ item, onAddClick }) => {
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

  // State to manage image source with fallback logic
  const [imgSrc, setImgSrc] = useState(imageURL || '/placeholder.jpg');
  const [imageError, setImageError] = useState(false);

  // Calculate total price including taxes
  const totalPrice = price + taxAmount;

  // Items with variants are priced per variant, so show the lowest variant price
  // and send the user to the modal to pick one instead of adding directly
  const activeVariations = (item.itemallowvariation && Array.isArray(item.variation))
    ? item.variation.filter(v => v.active === undefined || String(v.active) === '1')
    : [];
  const hasVariants = activeVariations.length > 0;
  const variantPrices = activeVariations.map(v => parseFloat(v.price) || 0);
  const minVariantPrice = hasVariants ? Math.min(...variantPrices) : 0;
  const hasPriceRange = hasVariants && variantPrices.some(p => p !== minVariantPrice);
  const displayPrice = hasVariants ? minVariantPrice : price;
  // Variant-priced items whose variants are missing from the menu have no valid price
  const isUnavailable = !hasVariants && !(price > 0);

  // Handle image load error
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImgSrc('/placeholder.jpg');
    }
  };

  // Determine if item is vegetarian/non-vegetarian from tags
  const isVeg = tags.some(tag => 
    tag.toLowerCase().includes('vegetarian') || tag.toLowerCase() === 'veg'
  );
  const isNonVeg = tags.some(tag => 
    tag.toLowerCase().includes('non-vegetarian') || tag.toLowerCase() === 'non-veg'
  );

  return (
    <div className="menu-item-card">
      {/* Item Image - placeholder or from external source */}
      <div className="item-image-container">
        <img
          className="item-image"
          src={imgSrc}
          alt={itemName}
          loading="lazy"
          onError={handleImageError}
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
        {/* <div className="item-details"> */}
          <h3 className="item-name">{itemName}</h3>
        {/* </div> */}
        
        <div className="item-footer">
          <div className="price-container">
            <span className="item-price">
              {hasPriceRange && <span className="price-from">From </span>}
              <span className="currency-symbol">₹</span>
              {displayPrice.toFixed(2)}
            </span>
            
            
          </div>
          
          <button 
            className={`add-btn ${hasVariants ? 'variant-btn' : ''}`}
            onClick={() => onAddClick(item)}
            disabled={isUnavailable}
            aria-label={hasVariants ? `See variants of ${itemName}` : `Add ${itemName} to cart`}
          >{hasVariants ? 'See Variants' : isUnavailable ? 'Unavailable' : 'Add'}
            {/* <span className="add-btn-text"></span> */}
          </button>
        </div>
        
        {/* {taxes.length > 0 && (
          <div className="tax-breakdown">
            {taxes.map((tax, index) => (
              <span key={index} className="tax-detail">
                {tax.name} ({tax.percentage}%)
              </span>
            ))}
          </div>
        )} */}
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
    imageURL: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    taxes: PropTypes.arrayOf(PropTypes.shape({
      taxTypeId: PropTypes.string,
      name: PropTypes.string,
      percentage: PropTypes.number
    })),
    taxAmount: PropTypes.number,
  }).isRequired,
  onAddClick: PropTypes.func.isRequired,
};

export default MenuItemCard;
