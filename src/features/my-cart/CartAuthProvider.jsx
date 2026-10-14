import { CartAuthContext } from "./cartAuthContext.js";

export function CartAuthProvider({ accessToken = null, children }) {
  return (
    <CartAuthContext.Provider value={{ accessToken }}>
      {children}
    </CartAuthContext.Provider>
  );
}
