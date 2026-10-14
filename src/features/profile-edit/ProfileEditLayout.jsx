// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";
// 메인·JSP와 동일한 공통 React 헤더입니다.
import SiteHeader from "../../components/navigation/Header.jsx";
export function ProfileEditLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <div className="profile-edit-layout">
        <MyPageSidebar />
        <div className="profile-edit-main">{children}</div>
      </div>
    </>
  );
}

export function ProfilePageHeader({ title, description }) {
  return (
    <>
      <nav className="profile-edit-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <Link to="/mypage">마이페이지</Link>
      </nav>
      <header className="profile-edit-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <MyPageTabs active="profile" />
    </>
  );
}
