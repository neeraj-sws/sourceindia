const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ROOT_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000/';

// Default export
export default API_BASE_URL;

// Named export for ROOT_URL
export { ROOT_URL };