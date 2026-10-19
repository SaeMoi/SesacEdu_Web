import { createContext, useContext } from "react";

export const InstructorProfileAuthContext = createContext({
  accessToken: null,
});

export function useInstructorProfileAuth() {
  return useContext(InstructorProfileAuthContext);
}
