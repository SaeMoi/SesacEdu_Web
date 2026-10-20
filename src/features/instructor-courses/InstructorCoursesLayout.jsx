import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import { InstructorCenterTabs } from "../instructor-center/InstructorCenterTabs.jsx";

export function InstructorCoursesLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="courses">
      {children}
    </SharedInstructorCenterLayout>
  );
}

export function InstructorCoursesHeading({ title, description }) {
  return (
    <>
      <header className="instructor-courses-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <InstructorCenterTabs className="instructor-courses-tabs" />
    </>
  );
}
