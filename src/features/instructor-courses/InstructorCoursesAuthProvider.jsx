import { InstructorCoursesAuthContext } from "./instructorCoursesAuthContext.js";

export function InstructorCoursesAuthProvider({
  accessToken = null,
  children,
}) {
  return (
    <InstructorCoursesAuthContext.Provider value={{ accessToken }}>
      {children}
    </InstructorCoursesAuthContext.Provider>
  );
}
