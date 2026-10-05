import { AuthContextProvider } from '@/context/AuthContext';

export default function AuthProvider({ children }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
