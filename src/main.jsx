import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CartProvider } from './components/CartContext';
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MenuPage from './components/MenuPage';
import LandingPage from './components/Landingpage';
import CartPage from './components/CartPage';
import PaymentPage from './components/PaymentPage'; // Create this
import ConfigPage from './components/ConfigPage'; // Admin config page
import ReprintPage from './components/ReprintPage'; // Staff: reprint a bill
import PrintBillPage from './components/PrintBillPage';
import PrintFoodKOTPage from './components/PrintFoodKOTPage';
import PrintCoffeeKOTPage from './components/PrintCoffeeKOTPage';


import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getStoreIdForHeader } from './utils/kioskApi';
import IdlePrompt from './components/IdlePrompt';
import { IDLE_MS, PAYMENT_IDLE_MS } from './lib/idle';

/** Routes that do not require `kiosk_config` with a store id (see API.md X-Store-Id). */
function routeAllowsMissingStore(pathname) {
  if (pathname === '/' || pathname === '/config') return true;
  if (pathname.startsWith('/print/')) return true;
  return false;
}

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (routeAllowsMissingStore(location.pathname)) return;
    if (!getStoreIdForHeader()) {
      navigate('/config', { replace: true });
    }
  }, [location.pathname, navigate]);

  // "Still ordering?" replaces the old silent reset: after 20 s without a touch the guest gets a
  // 15 s countdown before the order is cleared. The welcome screen runs its own (see LandingPage).
  const path = location.pathname;
  const idleOff = path === '/' || path === '/config' || path.startsWith('/print/');

  return (
    <CartProvider>
      <div className="page-border-wrapper">
        <Outlet />
      </div>
      {!idleOff && (
        <IdlePrompt
          key={path}
          idleMs={path === '/payment' ? PAYMENT_IDLE_MS : IDLE_MS}
          onExpire={() => navigate('/')}
        />
      )}
    </CartProvider>
  );
};

// Then in your router
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/category", element: <MenuPage /> },
      { path: `/item/:id`, element: <MenuPage /> }, // old deep links land on the menu
      { path: "/cart", element: <CartPage /> },
      { path: "/payment", element: <PaymentPage /> },
      { path: "/config", element: <ConfigPage /> }, // Admin config route
      { path: "/reprint", element: <ReprintPage /> },
      { path: "/print/bill/:orderId", element: <PrintBillPage /> },
      { path: "/print/food-kot/:orderId", element: <PrintFoodKOTPage /> },
      { path: "/print/coffee-kot/:orderId", element: <PrintCoffeeKOTPage /> },
      { path: "*", element: <LandingPage /> }


    ]
  }
]);

// Render without CartProvider wrapper
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);