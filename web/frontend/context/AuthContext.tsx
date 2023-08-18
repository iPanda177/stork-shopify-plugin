import { createContext, useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';

type AuthData = {
  shop: string;
  accessToken: string;
  authorized: boolean;
};

type AuthContextData = {
  auth: AuthData | null;
  updateContext: (data: AuthData) => void;
};

type Props = {
  children: JSX.Element;
};

const AuthContext = createContext<AuthContextData | null>(null);

const AuthContextProvider: React.FC<Props> = ({ children }) => {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetch = useAuthenticatedFetch();

  const updateContext = (data: AuthData) => setAuth(data);

  useEffect(() => {
    if (isLoading) {
      const getShopData = async () => {
        console.log('fetching shop data');
        const res = await fetch('/api/shop');

        if (res.ok) {
          const data = await res.json();
          setAuth(data);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      };

      getShopData();
    }
  }, [auth, isLoading]);

  return (
    <AuthContext.Provider value={{ auth, updateContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
