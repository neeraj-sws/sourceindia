import { Outlet, Routes, Route } from 'react-router-dom';
import '../assets/css/style.css';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Companies from '../pages/Companies';
import Categories from '../pages/Categories';
import ProductsList from '../pages/ProductsList';
import KnowledgeCenter from '../pages/KnowledgeCenter';
import ContactUs from '../pages/ContactUs';
import GetSupport from '../pages/GetSupport';
import Registration from '../pages/Registration';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';

import PrivateRoute from '../routes/PrivateRoute';
import PublicRoute from '../routes/PublicRoute';

function FrontLayout() {
  return (
    <>
    <AlertProvider>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
      <FrontHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/knowledge-center" element={<KnowledgeCenter />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/get-support" element={<GetSupport />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/registration" element={<PublicRoute><Registration /></PublicRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        </Routes>
      </main>
      <FrontFooter />
    </AlertProvider>

    </>
  );
}

export default FrontLayout;
