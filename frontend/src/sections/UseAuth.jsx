import { useAuth } from "../context/AuthContext";

const UseAuth = () => {
  const { user, loadingUser, refetchUser } = useAuth();
  return { user, loading: loadingUser, refetchUser };
};

export default UseAuth;
