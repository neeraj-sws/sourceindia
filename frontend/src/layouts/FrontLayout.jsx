import { Outlet, Routes, Route } from 'react-router-dom';
import '../assets/css/style.css';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';

function FrontLayout() {
  return (
    <>
    <AlertProvider>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
      <FrontHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <FrontFooter />
    </AlertProvider>
    </>
  );
}

export default FrontLayout;
