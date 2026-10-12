import { createContext, useContext } from "react";

export const CartAuthContext = createContext(null);

export function useCartAuth() {
  const auth = useContext(CartAuthContext);
  if (!auth) {
    throw new Error("Cart pages must be rendered inside CartAuthProvider.");
  }
  return auth;
}
