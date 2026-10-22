// 공통 헤더·사이드바와 내 Q&A 화면의 목록 스타일(myQna.css)을 같이 씁니다.
import { Link } from "react-router";
import Header from "../../components/navigation/Header.jsx";
import { MyPageSidebar } from "../../components/navigation/MyPageNavigation.jsx";
import "../my-qna/myQna.css";
import "./cstQna.css";

export function CstQnaLayout({ title = "1:1 문의", description, children }) {
  return (
    <>
      <Header />
      <div className="qna-layout">
        <MyPageSidebar />
        <main className="qna-main">
          <nav className="qna-breadcrumb" aria-label="현재 위치">
            <Link to="/">사용자공간</Link>
            <span aria-hidden="true">/</span>
            <span>마이페이지</span>
            <span aria-hidden="true">/</span>
            <span>고객센터</span>
          </nav>
          <header className="qna-heading">
            <h1>{title}</h1>
            <p>{description ?? "서비스 이용 중 궁금한 점을 남기면 관리자가 답변해 드려요."}</p>
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
