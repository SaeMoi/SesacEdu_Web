import { createContext, useContext } from "react";

export const BenefitsAuthContext = createContext(null);

export function useBenefitsAuth() {
  const auth = useContext(BenefitsAuthContext);
  if (!auth) {
    throw new Error(
      "Benefits pages must be rendered inside BenefitsAuthProvider.",
    );
  }
  return auth;
}
