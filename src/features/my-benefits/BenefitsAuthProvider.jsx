import { BenefitsAuthContext } from "./benefitsAuthContext.js";

export function BenefitsAuthProvider({ accessToken = null, children }) {
  return (
    <BenefitsAuthContext.Provider value={{ accessToken }}>
      {children}
    </BenefitsAuthContext.Provider>
  );
}
