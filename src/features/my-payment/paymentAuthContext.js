import { createContext, useContext } from "react";

export const PaymentAuthContext = createContext(null);

export function usePaymentAuth() {
  const auth = useContext(PaymentAuthContext);
  if (!auth) {
    throw new Error("Payment pages require PaymentAuthProvider.");
  }
  return auth;
}
