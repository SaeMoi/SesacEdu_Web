import { createContext, useContext } from "react";

export const InstructorQnaAuthContext = createContext(null);

export function useInstructorQnaAuth() {
  return useContext(InstructorQnaAuthContext);
}
