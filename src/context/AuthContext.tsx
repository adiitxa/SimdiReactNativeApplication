import React, { createContext, useState, useEffect } from "react";
import { saveLoginSession, isSessionValid, logout } from "../utils/storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const valid = await isSessionValid();
    setLoggedIn(valid);
  };

  const login = async (username, password) => {
    if (username === "admin123" && password === "admin123") {
      await saveLoginSession();
      setLoggedIn(true);
      return { success: true };
    }
    return { success: false, message: "Invalid credentials" };
  };

  const logoutUser = async () => {
    await logout();
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, login, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
