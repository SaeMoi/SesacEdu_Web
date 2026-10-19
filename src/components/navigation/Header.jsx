
import { useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  logout,
  subscribeSession,
} from "../../auth/session.js";

/** 전체 페이지 공통 React 헤더. JSP에서는 mountHeader로 이 컴포넌트만 실행합니다. */
export default function Header({
  member: suppliedMember,
  authLoading = false,
  basePath = "",
}) {
  const sessionSnapshot = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null,
  );

  const session = sessionSnapshot
    ? JSON.parse(sessionSnapshot)
    : null;

  const member =
    suppliedMember === undefined
      ? session?.member ?? null
      : suppliedMember;

  const base =
    basePath.startsWith("/") && !basePath.startsWith("//")
      ? basePath.replace(/\/+$/, "")
      : "";

  const href = (path) => `${base}${path}`;
  const community = window.location.pathname.includes("/community");

  return (
    <header className="ui-header">
      <div className="ui-header-inner">
        <a className="ui-logo" href={href("/")} aria-label="새싹에듀 홈">
          <img src={href("/design/logo.png")} alt="새싹에듀" />
        </a>

        <nav className="ui-nav" aria-label="주요 메뉴">
          <a className={!community ? "active" : ""} href={href("/courses")}>
            강의
          </a>
          <a className={community ? "active" : ""} href={href("/community")}>
            커뮤니티
          </a>
        </nav>

        {/* JSP로 이동할 때 문서 전체를 요청하도록 일반 GET form과 a를 사용합니다. */}
        <form
          className="ui-search"
          action={href("/courses")}
          method="get"
          role="search"
        >
          <button aria-label="강의 검색" type="submit">
            ⌕
          </button>
          <input
            name="q"
            aria-label="강의 검색어"
            placeholder="어떤 배움을 찾고 있나요?"
          />
        </form>

        <div className="ui-actions">
          {authLoading ? (
            <span role="status">로그인 확인 중…</span>
          ) : member ? (
            <>
              <a href={href("/mypage")}>마이페이지</a>

              <a className="btn primary" href={href("/mypage/cart")}>
                장바구니
              </a>

              <button
                className="ui-logout"
                type="button"
                onClick={async () => {
                  await logout();
                  window.location.replace(href("/"));
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <a href={href("/login")}>로그인</a>

              <a className="btn primary" href={href("/signup")}>
                시작하기
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
