"use strict";
import { createContext, useContext } from "react";

// Context + hook live in their own (non-component) module so that AuthContext.jsx
// can export only the AuthProvider component, satisfying react-refresh.
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
