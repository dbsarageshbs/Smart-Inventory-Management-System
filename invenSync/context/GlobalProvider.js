import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, checkSession } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check if we have a session
        const hasSession = await checkSession();
        
        if (hasSession) {
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setIsLogged(true);
          } else {
            setIsLogged(false);
            setUser(null);
          }
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLogged(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        setIsLogged,
        user,
        setUser,
        loading,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;