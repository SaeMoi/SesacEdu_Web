import { createContext, useContext } from "react";

export const InstructorCouponsAuthContext = createContext({
  accessToken: null,
});

export function useInstructorCouponsAuth() {
  return useContext(InstructorCouponsAuthContext);
}
