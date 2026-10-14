// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";
// 페이지마다 별도 헤더를 만들지 않고 공통 컴포넌트를 사용합니다.
import Header from "../../components/navigation/Header.jsx";

export function MyLearningLayout({ children }) {
  return (
    <>
      <Header />
      <div className="learning-layout">
        <MyPageSidebar />
        <main className="learning-main">{children}</main>
      </div>
    </>
  );
}

export function LearningPageHeader({ title, description }) {
  return (
    <>
      <nav className="learning-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="learning-page-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <MyPageTabs active="learning" />
    </>
  );
}
