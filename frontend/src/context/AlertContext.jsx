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
    } else {
      toast.error(message);
    }
  };

  return (
    <AlertContext.Provider value={{ showNotification }}>
      {children}
    </AlertContext.Provider>
  );
};
