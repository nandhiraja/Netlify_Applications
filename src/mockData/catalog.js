export const mockCatalog = {
  categories: [
    { categoryId: "68e778dd0c42e107fdf5cf3f", name: "BEVERAGE", displayOrder: 1 },
    { categoryId: "68e778dd0c42e107fdf5cf40", name: "BREAKFAST", displayOrder: 2 },
    { categoryId: "68e778dd0c42e107fdf5cf41", name: "SOUTH INDIAN", displayOrder: 3 },
    { categoryId: "68e778dd0c42e107fdf5cf42", name: "MAIN COURSE", displayOrder: 4 }
  ],
  
  itemTags: [
    { itemTagId: "6868c0ab6065bace3cd952b7", name: "Vegetarian", color: "#00ff00" },
    { itemTagId: "6868c0ab6065bace3cd952b8", name: "Non-vegetarian", color: "#ff0000" },
    { itemTagId: "6868c0ab6065bace3cd952b9", name: "Spicy", color: "#ff4500" }
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
    {
      itemId: "6868ca5d4fda6eabd33ccba2",
      item_skuid: "7",
      itemName: "Davanagere Benne Sada Dose",
      price: 110,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Classic butter dosa from Davanagere",
      isAvailable: true
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba3",
      item_skuid: "27",
      itemName: "Filter Coffee",
      price: 50,
      categoryId: "68e778dd0c42e107fdf5cf3f",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "Traditional South Indian filter coffee",
      isAvailable: true
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba4",
      item_skuid: "15",
      itemName: "Masala Dosa",
      price: 120,
      categoryId: "68e778dd0c42e107fdf5cf41",
      tags: ["6868c0ab6065bace3cd952b7", "6868c0ab6065bace3cd952b9"],
      description: "Crispy dosa with spicy potato filling",
      isAvailable: true
    },
    {
      itemId: "6868ca5d4fda6eabd33ccba5",
      item_skuid: "22",
      itemName: "Idli Vada Combo",
      price: 90,
      categoryId: "68e778dd0c42e107fdf5cf40",
      tags: ["6868c0ab6065bace3cd952b7"],
      description: "2 Idlis + 1 Vada with chutney and sambar",
      isAvailable: true
    }
  ],
  
  taxTypes: [
    { taxTypeId: "6868c05ede387c9d22a94396", name: "CGST", percentage: 2.5 },
    { taxTypeId: "6868c05ede387c9d22a94397", name: "SGST", percentage: 2.5 }
  ]
};
