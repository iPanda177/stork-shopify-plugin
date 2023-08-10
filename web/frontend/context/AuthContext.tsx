import { createContext, useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';

type AuthContext = {
  shop: string;
  accessToken: string;
  authorized: boolean;
};

type Props = {
  children: JSX.Element;
};

const initialContext = null as unknown as AuthContext;

const AuthContext = createContext(initialContext);

const AuthContextProvider: React.FC<Props> = ({ children }) => {
  const [auth, setAuth] = useState(initialContext);
  const [isLoading, setIsLoading] = useState(true);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    if (isLoading) {
      fetch('/api/shop')
        .then(res => res.json())
        .then(data => {
          setAuth(data);
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          console.log(err);
          setIsLoading(false);
        });
    }
  }, [auth]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthContextProvider };
