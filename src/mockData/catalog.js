export const mockCatalog = {
  categories: [
    { 
      categoryId: "68e778dd0c42e107fdf5cf3f", 
      name: "BREAKFAST", 
      displayOrder: 1,
      imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf40", 
      name: "SOUTH INDIAN", 
      displayOrder: 2,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf41", 
      name: "BEVERAGES", 
      displayOrder: 3,
      imageUrl: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf42", 
      name: "MAIN COURSE", 
      displayOrder: 4,
      imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf43", 
      name: "RICE VARIETIES", 
      displayOrder: 5,
      imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf44", 
      name: "SNACKS", 
      displayOrder: 6,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400"
    },
    { 
      categoryId: "68e778dd0c42e107fdf5cf45", 
      name: "DESSERTS", 
      displayOrder: 7,
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400"
    }
  ],
  
  itemTags: [
    { itemTagId: "6868c0ab6065bace3cd952b7", name: "Vegetarian", color: "#00ff00" },
    { itemTagId: "6868c0ab6065bace3cd952b8", name: "Non-vegetarian", color: "#ff0000" },
    { itemTagId: "6868c0ab6065bace3cd952b9", name: "Spicy", color: "#ff4500" },
    { itemTagId: "6868c0ab6065bace3cd952ba", name: "Chef Special", color: "#ffd700" },
    { itemTagId: "6868c0ab6065bace3cd952bb", name: "Popular", color: "#ff69b4" }
  ],
  
  charges: [
    { 
      chargeId: "68f0e00a592b7cf3428c5f0e", 
      name: "PC", 
      chargeType: "Absolute", 
      chargeRate: 20 
    },
    { 
      chargeId: "68f0e00a592b7cf3428c5f0f", 
      name: "Service Charge", 
      chargeType: "Percentage", 
      chargeRate: 5 
    }
  ],
  
  items: [
    // BREAKFAST ITEMS
    {
      itemId: "6868ca5d4fda6eabd33ccba1",
      item_skuid: "1",
      itemName: "Idli Vada Combo",
      price: 90,
      categoryId: "68e778dd0c42e107fdf5cf3f",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952bb"],
      description: "2 Soft idlis + 1 Crispy vada with chutney and sambar",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba2",
      item_skuid: "2",
      itemName: "Set Dosa",
      price: 100,
      categoryId: "68e778dd0c42e107fdf5cf3f",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "3 Small soft dosas served with chutney and potato sagu",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba3",
      item_skuid: "3",
      itemName: "Pongal",
      price: 85,
      categoryId: "68e778dd0c42e107fdf5cf3f",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Traditional rice and lentil preparation with ghee",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba4",
      item_skuid: "4",
      itemName: "Upma",
      price: 75,
      categoryId: "68e778dd0c42e107fdf5cf3f",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Semolina preparation with vegetables and spices",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300"
    },

    // SOUTH INDIAN ITEMS
    {
      itemId: "6868ca5d4fda6eabd33ccba5",
      item_skuid: "5",
      itemName: "Davanagere Benne Sada Dose",
      price: 110,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952ba"],
      description: "Classic butter dosa from Davanagere style",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1694159449767-55a3f67ab129?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba6",
      item_skuid: "6",
      itemName: "Masala Dosa",
      price: 120,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952b9", "6868c0ab6065bace3cd952bb"],
      description: "Crispy dosa with spicy potato filling",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba7",
      item_skuid: "7",
      itemName: "Rava Masala Dosa",
      price: 130,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952b9"],
      description: "Crispy semolina dosa with potato masala",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba8",
      item_skuid: "8",
      itemName: "Mysore Masala Dosa",
      price: 135,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952b9", "6868c0ab6065bace3cd952ba"],
      description: "Spicy red chutney spread dosa with potato masala",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1694159449767-55a3f67ab129?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba9",
      item_skuid: "9",
      itemName: "Paneer Dosa",
      price: 150,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952ba"],
      description: "Dosa filled with spiced cottage cheese",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300"
    },

    // BEVERAGES
    {
      itemId: "6868ca5d4fda6eabd33ccbb1",
      item_skuid: "10",
      itemName: "Filter Coffee",
      price: 50,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952bb"],
      description: "Traditional South Indian filter coffee",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbb2",
      item_skuid: "11",
      itemName: "Masala Chai",
      price: 40,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Spiced Indian tea",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbb3",
      item_skuid: "12",
      itemName: "Fresh Lime Soda",
      price: 45,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Refreshing lime juice with soda",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbb4",
      item_skuid: "13",
      itemName: "Buttermilk",
      price: 35,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Traditional spiced buttermilk",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300"
    },

    // MAIN COURSE
    {
      itemId: "6868ca5d4fda6eabd33ccbc1",
      item_skuid: "14",
      itemName: "Veg Thali",
      price: 180,
      categoryId: "68e778dd0c42e107fdf5cf42",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952ba"],
      description: "Complete meal with rice, chapati, sambar, dal, vegetables",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbc2",
      item_skuid: "15",
      itemName: "Paneer Butter Masala",
      price: 200,
      categoryId: "68e778dd0c42e107fdf5cf42",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952bb"],
      description: "Cottage cheese in rich tomato gravy",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbc3",
      item_skuid: "16",
      itemName: "Sambar Rice",
      price: 120,
      categoryId: "68e778dd0c42e107fdf5cf42",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Rice served with authentic sambar",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300"
    },

    // RICE VARIETIES
    {
      itemId: "6868ca5d4fda6eabd33ccbd1",
      item_skuid: "17",
      itemName: "Curd Rice",
      price: 90,
      categoryId: "68e778dd0c42e107fdf5cf43",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Rice mixed with yogurt and tempered spices",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbd2",
      item_skuid: "18",
      itemName: "Lemon Rice",
      price: 95,
      categoryId: "68e778dd0c42e107fdf5cf43",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Tangy rice with lemon and peanuts",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbd3",
      item_skuid: "19",
      itemName: "Bisibele Bath",
      price: 110,
      categoryId: "68e778dd0c42e107fdf5cf43",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952b9", "6868c0ab6065bace3cd952ba"],
      description: "Karnataka special rice and lentil dish",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300"
    },

    // SNACKS
    {
      itemId: "6868ca5d4fda6eabd33ccbe1",
      item_skuid: "20",
      itemName: "Bonda",
      price: 40,
      categoryId: "68e778dd0c42e107fdf5cf44",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Deep fried potato balls",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbe2",
      item_skuid: "21",
      itemName: "Samosa",
      price: 35,
      categoryId: "68e778dd0c42e107fdf5cf44",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952bb"],
      description: "Crispy pastry with spiced potato filling",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbe3",
      item_skuid: "22",
      itemName: "Medu Vada",
      price: 45,
      categoryId: "68e778dd0c42e107fdf5cf44",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Crispy lentil donuts",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300"
    },

    // DESSERTS
    {
      itemId: "6868ca5d4fda6eabd33ccbf1",
      item_skuid: "23",
      itemName: "Kesari Bath",
      price: 60,
      categoryId: "68e778dd0c42e107fdf5cf45",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Sweet semolina dessert with saffron",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbf2",
      item_skuid: "24",
      itemName: "Gulab Jamun",
      price: 70,
      categoryId: "68e778dd0c42e107fdf5cf45",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952bb"],
      description: "Soft milk dumplings in sugar syrup",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1582985175070-8cb4115fb6ff?w=300"
    },
    {
      itemId: "6868ca5d4fda6eabd33ccbf3",
      item_skuid: "25",
      itemName: "Payasam",
      price: 65,
      categoryId: "68e778dd0c42e107fdf5cf45",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Traditional South Indian sweet pudding",
      isAvailable: true,
      imageURL: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300"
    }
  ],
  
  taxTypes: [
    { taxTypeId: "6868c05ede387c9d22a94396", name: "CGST", percentage: 2.5 },
    { taxTypeId: "6868c05ede387c9d22a94397", name: "SGST", percentage: 2.5 }
  ]
};
