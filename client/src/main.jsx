import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './components/CartContext';
import{ createBrowserRouter , RouterProvider}  from "react-router-dom"
import MenuSection from "./components/MenuSection"
import HomePage from './components/Home';


import { Outlet } from 'react-router-dom';

const Layout = () => (
  <CartProvider>
    <Outlet />
  </CartProvider>
);

// Then in your router
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage/> },
      { path: "/dinein", element: <MenuSection/> }
    ]
  }
]);

// Render without CartProvider wrapper
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>
);