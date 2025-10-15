import { Outlet, Routes, Route } from 'react-router-dom';
import '../assets/css/style.css';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Companies from '../pages/Companies';
<<<<<<< HEAD
import Categories from '../pages/Categories';
import ProductsList from '../pages/ProductsList';
=======
import KnowledgeCenter from '../pages/KnowledgeCenter';
import ContactUs from '../pages/ContactUs';
import GetSupport from '../pages/GetSupport';
import Registration from '../pages/Registration';
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';

function FrontLayout() {
  return (
    <>
<<<<<<< HEAD
    <AlertProvider>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
      <FrontHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<ProductsList />} />
        </Routes>
      </main>
      <FrontFooter />
    </AlertProvider>
=======
      <AlertProvider>
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
        <FrontHeader />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/knowledge-center" element={<KnowledgeCenter />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/get-support" element={<GetSupport />} />
            <Route path="/registration" element={<Registration />} />
          </Routes>
        </main>
        <FrontFooter />
      </AlertProvider>
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
    </>
  );
}

export default FrontLayout;
