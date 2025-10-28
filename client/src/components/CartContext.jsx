import React, { createContext, useReducer, useContext } from 'react';

const CartContext = createContext();

const initialState = {
  items: []
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingIndex = state.items.findIndex(
        cartItem =>
          cartItem.id === action.item.id &&
          JSON.stringify(cartItem.selectedCustomizations) === JSON.stringify(action.item.selectedCustomizations) &&
          JSON.stringify(cartItem.selectedAddons) === JSON.stringify(action.item.selectedAddons)
      );
      if (existingIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += action.item.quantity;
        return { ...state, items: updatedItems };
      } else {
        return { ...state, items: [...state.items, action.item] };
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item, idx) => idx !== action.index)
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item, idx) =>
          idx === action.index ? { ...item, quantity: action.quantity } : item
        )
      };
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item });
  const removeItem = (index) => dispatch({ type: 'REMOVE_ITEM', index });
  const updateQuantity = (index, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', index, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ cart: state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
