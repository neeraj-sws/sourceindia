import { Outlet, Routes, Route, useLocation } from 'react-router-dom';
import '../assets/css/style.css';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import UserHeader from '../common/UserHeader';
import UserSidebar from '../common/UserSidebar';
import UserFooter from '../common/UserFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Companies from '../pages/Companies';
import CompaniesFilter from '../pages/CompaniesFilter';
import Categories from '../pages/Categories';
import ProductsList from '../pages/ProductsList';
import KnowledgeCenter from '../pages/KnowledgeCenter';
import ContactUs from '../pages/ContactUs';
import GetSupport from '../pages/GetSupport';
import Registration from '../pages/Registration';
import Profile from '../pages/Profile';
import ProfileEdit from '../pages/ProfileEdit';
import CompanyEdit from '../pages/CompanyEdit';
import Dashboard from '../pages/Dashboard';
import Isinterested from '../pages/Isinterested';
import MyProducts from '../pages/MyProducts';
import AddProduct from '../pages/AddProduct';
import LeadsList from '../pages/LeadsList';
import CreateTicket from '../pages/CreateTicket';
import TrackTicket from '../pages/TrackTicket';
import ProductDetail from '../pages/ProductsDetail';
import CompanyDetail from '../pages/CompanyDetail';
import Enquiry from '../pages/Enquiry';
import TicketView from '../pages/TicketView';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider } from '../context/AuthContext';

import PrivateRoute from '../routes/PrivateRoute';
import PublicRoute from '../routes/PublicRoute';

function FrontLayout() {
  const location = useLocation();
  const userLayoutPaths = ['/dashboard', '/profile', '/profile-edit', '/company-edit', '/my-product',
    '/add_product', '/edit_product', '/seller_enquiry', '/my_enquiry', '/is-interested'];
  const isUserLayout = userLayoutPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <AuthProvider>
        <AlertProvider>
          <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
          {isUserLayout ? <><UserHeader /><UserSidebar /></> : <FrontHeader />}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/registration" element={<PublicRoute><Registration /></PublicRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:slug" element={<CompanyDetail />} />
              <Route path="/company-list" element={<CompaniesFilter isSeller="1" />} />
              <Route path="/buyer-list" element={<CompaniesFilter isSeller="0" />} />
              <Route path="/trading-list" element={<CompaniesFilter isTrading="1" />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<ProductsList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/knowledge-center" element={<KnowledgeCenter />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/get-support" element={<GetSupport />} />
              <Route path="/get-support/createticket" element={<CreateTicket />} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/profile-edit" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
              <Route path="/company-edit" element={<PrivateRoute><CompanyEdit /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/is-interested" element={<PrivateRoute><Isinterested /></PrivateRoute>} />
              <Route path="/my-product" element={<PrivateRoute><MyProducts /></PrivateRoute>} />
              <Route path="/add_product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
              <Route path="/edit_product/:productId" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
              <Route path="/seller_enquiry" element={<PrivateRoute><LeadsList /></PrivateRoute>} />
              <Route path="/my_enquiry" element={<PrivateRoute><LeadsList /></PrivateRoute>} />
              <Route path="/get-support/trackticket" element={<TrackTicket />} />
              <Route path="/open-enquiry" element={<Enquiry />} />
              <Route path="/ticket/view/:number" element={<TicketView />} />
            </Routes>
          </main>
          {isUserLayout ? <UserFooter /> : <FrontFooter />}
        </AlertProvider>
      </AuthProvider>
    </>
  );
}

export default FrontLayout;
