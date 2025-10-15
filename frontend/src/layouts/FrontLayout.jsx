import { Outlet, Routes, Route } from 'react-router-dom';
import '../assets/css/style.css';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Companies from '../pages/Companies';
<<<<<<< HEAD
<<<<<<< HEAD
import Categories from '../pages/Categories';
import ProductsList from '../pages/ProductsList';
=======
=======

import Categories from '../pages/Categories';
import ProductsList from '../pages/ProductsList';

>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
import KnowledgeCenter from '../pages/KnowledgeCenter';
import ContactUs from '../pages/ContactUs';
import GetSupport from '../pages/GetSupport';
import Registration from '../pages/Registration';
<<<<<<< HEAD
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
=======

>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';

function FrontLayout() {
  return (
    <>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
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
<<<<<<< HEAD
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
=======
>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
            <Route path="/knowledge-center" element={<KnowledgeCenter />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/get-support" element={<GetSupport />} />
            <Route path="/registration" element={<Registration />} />
<<<<<<< HEAD
          </Routes>
        </main>
        <FrontFooter />
      </AlertProvider>
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
=======
        </Routes>
      </main>
      <FrontFooter />
    </AlertProvider>
>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
    </>
  );
}

export default FrontLayout;
