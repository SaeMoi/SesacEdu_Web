import { createContext, createElement, useContext } from "react";

export const InstructorAssignmentsAuthContext = createContext(null);

export function InstructorAssignmentsAuthProvider({ accessToken, children }) {
  return createElement(
    InstructorAssignmentsAuthContext.Provider,
    { value: { accessToken } },
    children,
  );
}

export function useInstructorAssignmentsAuth() {
  return useContext(InstructorAssignmentsAuthContext);
}
