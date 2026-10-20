import { createContext, useContext } from "react";

export const InstructorSettlementAuthContext = createContext({
  accessToken: null,
});

export function useInstructorSettlementAuth() {
  return useContext(InstructorSettlementAuthContext);
}
