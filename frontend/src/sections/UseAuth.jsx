import { useAuth } from "../context/AuthContext";

const UseAuth = () => {
  const { user, loadingUser } = useAuth();
  return { user, loading: loadingUser };
};

export default UseAuth;
