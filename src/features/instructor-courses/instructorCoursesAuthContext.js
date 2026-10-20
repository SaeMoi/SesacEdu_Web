import { createContext, useContext } from "react";

export const InstructorCoursesAuthContext = createContext({
  accessToken: null,
});

export function useInstructorCoursesAuth() {
  return useContext(InstructorCoursesAuthContext);
}
