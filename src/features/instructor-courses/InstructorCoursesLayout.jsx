import { Link } from "react-router";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";

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
      <nav className="instructor-courses-tabs" aria-label="강사센터 분류">
        <span>운영 현황</span>
        <Link
          aria-current="page"
          className="is-active"
          to="/instructor/lectures"
        >
          강의
        </Link>
        <span>학습 관리</span>
        <span>정산</span>
      </nav>
    </>
  );
}
