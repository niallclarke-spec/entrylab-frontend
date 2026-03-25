"use client";

import { createContext, useContext, useState, useEffect } from "react";

type AuthContextType = {
  token: string | null;
  setToken: (t: string | null) => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ token: null, setToken: () => {}, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) setToken(stored);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
