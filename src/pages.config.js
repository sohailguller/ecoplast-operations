/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import PlasticCollection from './pages/PlasticCollection';
import Production from './pages/Production';
import Customers from './pages/Customers';
import NewOrder from './pages/NewOrder';
import OrderDetail from './pages/OrderDetail';
import Staff from './pages/Staff';
import CustomerHome from './pages/CustomerHome';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import PlasticEarnings from './pages/PlasticEarnings';
import Learn from './pages/Learn';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import StaffDashboard from './pages/StaffDashboard';
import StaffTasks from './pages/StaffTasks';
import StaffProduction from './pages/StaffProduction';
import StaffCollection from './pages/StaffCollection';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Orders": Orders,
    "Products": Products,
    "Inventory": Inventory,
    "PlasticCollection": PlasticCollection,
    "Production": Production,
    "Customers": Customers,
    "NewOrder": NewOrder,
    "OrderDetail": OrderDetail,
    "Staff": Staff,
    "CustomerHome": CustomerHome,
    "Shop": Shop,
    "Checkout": Checkout,
    "MyOrders": MyOrders,
    "PlasticEarnings": PlasticEarnings,
    "Learn": Learn,
    "Settings": Settings,
    "Profile": Profile,
    "StaffDashboard": StaffDashboard,
    "StaffTasks": StaffTasks,
    "StaffProduction": StaffProduction,
    "StaffCollection": StaffCollection,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};