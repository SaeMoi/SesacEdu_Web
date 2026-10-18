import { createContext, useContext } from "react";

export const InstructorApplyAuthContext = createContext({
  accessToken: null,
});

export function useInstructorApplyAuth() {
  return useContext(InstructorApplyAuthContext);
}
