import React, { use } from 'react';
import MenuHeader from './MenuHeader';
import MenuItemCard from './MenuItemCard';
import { menuItems } from '../Datas/metadatas';
import  { useState } from 'react';
import MenuItemModal from './MenuItemModal';
import './Styles/MenuSection.css';
import  Navigation  from './NavigationBar';
import { useEffect } from 'react';
import NotificationToast from './Notification';
const BASE_URL = import.meta.env.VITE_Base_url;

/**
 * The main component for the entire menu page.
 * It combines the header and the grid of menu item cards.
 */
const MenuSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [MenuData, setData] = useState([]);
      const [showNotification, setShowNotification] = useState(false);

     const [selectedCategory, setSelectedCategory] = useState(1);


  const [cart, setCart] = useState([]); // A simple state to store cart items

  // Function to open the modal with a specific item
  const openModalWithItem = (item) => {
    setSelectedMenuItem(item);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMenuItem(null);
  };

  // Function to handle adding an item to the cart
  const handleAddToCart = (itemWithCustomizations) => {
    // In a real app, you would add this to a global cart state or context
    console.log("Adding to cart:", itemWithCustomizations);
    setCart(prevCart => [...prevCart, itemWithCustomizations]);
        setShowNotification(true);

    // You might also want to show a toast notification here
    // alert(`${itemWithCustomizations.name} added to cart!`);
    console.log("Current Cart:", [...cart, itemWithCustomizations]);
  };



    useEffect(() => {
      console.log("Fetching menu items for category:", selectedCategory);
      fetch(`${BASE_URL}/menu/categories/${selectedCategory}/items`)
        .then(async (response) => {
      console.log("Status:", response.status);
      console.log("Response Type:", response.headers.get("content-type"));

      const text = await response.text(); // get raw text to inspect
      console.log("Raw Response:", text);

      try {
        const data = JSON.parse(text);
        setData(data);
        console.log("Menu section category Data received:", data);
      } catch (err) {
        console.error("Response was not JSON:", err);
      }
    })
    .catch((err) => {
      console.error("Some error in category fetching:", err);
    });
    }, [selectedCategory]);

    // console.log("Menu Data:", MenuData);



    // useEffect(() => {
    //   fetch(`${BASE_URL}/menu`)
    //     .then((response) => response.json())
    //     .then((data) => {setData(data.menuItems);console.log()})
    //     .catch((error) => console.error("Error fetching menu:", error));
    // }, []);

  
  const displayedItems = menuItems;

  return (
    <div>
    <div className="menu-section-container">
      {/* The Header component with navigation tabs */}
      <Navigation  />

      <MenuHeader  onSelectCategory={setSelectedCategory}/>

      {/* The Grid of Menu Items */}
      <main className="menu-main-content">
        <div className="menu-items-grid">
          {MenuData.map((item) => (
            <MenuItemCard key={item.id} item={item} onAddClick={openModalWithItem} />
          ))}
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
      <div> 
      {/* Optional Footer Section */}
      <footer className="menu-footer">
        <div className="footer-content">
          <p className="footer-text">Scroll to explore more delicious items</p>
          <div className="footer-decorative-line"></div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default MenuSection;
