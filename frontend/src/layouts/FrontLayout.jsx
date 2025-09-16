import { Outlet, Routes, Route } from 'react-router-dom';
import FrontHeader from '../common/FrontHeader';
import FrontFooter from '../common/FrontFooter';
import Home from '../pages/Home';
import About from '../pages/About';

function FrontLayout() {
  return (
    <>
      <FrontHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <FrontFooter />
    </>
  );
}

export default FrontLayout;
