import { PaymentAuthContext } from "./paymentAuthContext.js";

export function PaymentAuthProvider({ accessToken = null, children }) {
  return (
    <PaymentAuthContext.Provider value={{ accessToken }}>
      {children}
    </PaymentAuthContext.Provider>
  );
}
