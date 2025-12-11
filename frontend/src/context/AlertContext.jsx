import { createContext, useContext } from 'react';
import { toast } from 'react-toastify';

const AlertContext = createContext();

export const useAlert = () => {
  return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else {
      toast(message); // default
    }
  };

  return (
    <AlertContext.Provider value={{ showNotification }}>
      {children}
    </AlertContext.Provider>
  );
};
