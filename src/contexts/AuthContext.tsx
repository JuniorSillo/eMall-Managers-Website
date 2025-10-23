
// "use client";

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// interface UserData {
//   id: number;
//   name: string;
//   surname: string;
//   email: string;
//   contacts: string;
//   gender: string;
//   type: string;
//   username: string;
// }

// interface AuthContextType {
//   token: string | null;
//   user: UserData | null;
//   login: (token: string, user: UserData) => void;
//   logout: () => void;
//   isAuthenticated: boolean;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [token, setToken] = useState<string | null>(null);
//   const [user, setUser] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');
//     if (storedToken && storedUser) {
//       setToken(storedToken);
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   const login = (newToken: string, userData: UserData) => {
//     setToken(newToken);
//     setUser(userData);
//     localStorage.setItem('token', newToken);
//     localStorage.setItem('user', JSON.stringify(userData));
//   };

//   const logout = () => {
//     setToken(null);
//     setUser(null);
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   };

//   return (
//     <AuthContext.Provider
//       value={{ token, user, login, logout, isAuthenticated: !!token, loading }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };



'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserData {
  id: number;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
  username: string;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.id || !parsedUser.email) {
          throw new Error('Invalid user data in localStorage');
        }
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('[AuthProvider] Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, userData: UserData) => {
    if (!userData.id || !userData.email) {
      console.error('[AuthProvider] Invalid user data:', userData);
      throw new Error('Invalid user data provided');
    }
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};