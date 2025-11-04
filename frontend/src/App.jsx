import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import FrontLayout from './layouts/FrontLayout';
import AdminLayout from './layouts/AdminLayout';
import axios from 'axios';
import API_BASE_URL from './config';

function App() {
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings/site`);
        const faviconUrl = response.data.favicon_file;
        const faviconEl = document.getElementById('dynamic-favicon');
        if (faviconEl) {
          faviconEl.href = faviconUrl;
        }
      } catch (error) {
        console.error('Failed to fetch site settings', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<FrontLayout />} />
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;