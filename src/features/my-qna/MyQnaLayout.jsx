// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";

// 페이지마다 별도 헤더를 만들지 않고 공통 컴포넌트를 사용합니다.
import Header from "../../components/navigation/Header.jsx";
export function MyQnaLayout({ children }) {
  return (
    <>
      <Header />
      <div className="qna-layout">
        <MyPageSidebar />
        <main className="qna-main">{children}</main>
      </div>
    </>
  );
}

export function QnaPageHeader() {
  return (
    <>
      <nav className="qna-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="qna-heading">
        <h1>강의 Q&amp;A 목록</h1>
        <p>질문과 답변을 확인하고 학습을 이어가세요.</p>
      </header>
      <MyPageTabs active="qna" />
    </>
  );
}
