import Header from "../components/navigation/Header";
import "./HomePage.css";

// PPT 1번 화면의 문구와 분야 카드 순서를 그대로 사용합니다.
const categories = [
  ["웹 보안", "security"],
  ["네트워크", "network"],
  ["개발 기초", "development"],
  ["로그 분석", "logs"],
  ["클라우드", "cloud"],
];
export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <Header />
      <main id="main" className="design-home">
        <section className="home-intro">
          <p className="home-kicker">새싹에듀에서 시작하는 나의 다음 단계</p>
          <h1>
            오늘의 배움이,
            <br />
            내일의 실력이 되도록.
          </h1>
          <p className="home-subtitle">
            기초부터 실습까지, 나에게 필요한 IT 학습
          </p>
          <div className="home-categories" aria-label="학습 분야">
            {categories.map(([label, icon], index) => (
              <a
                key={icon}
                className={index === 0 ? "selected" : ""}
                href={`/courses?category=${encodeURIComponent(label)}`}
              >
                <span>{label}</span>
                <img src={`/design/${icon}.png`} alt="" />
              </a>
            ))}
          </div>
          <a className="btn primary home-all" href="/courses">
            모든 강의 보기 →
          </a>
        </section>
        <section className="home-about wrap">
          <div>
            <p className="eyebrow">ABOUT SAESSAK EDU</p>
            <h2>
              배운 것을 직접 해보는 곳,
              <br />
              <span>새싹에듀</span>
            </h2>
          </div>
          <div className="about-copy">
            <p>
              웹 보안부터 개발 기초까지.
              <br />
              강의로 이해하고, 실습으로 익히고,
              <br />
              커뮤니티에서 함께 배움을 이어가세요.
            </p>
            <p className="about-links">
              <a href="/courses">강의 학습</a>
              <span>/</span>
              <a href="/qna">질문·답변</a>
              <span>/</span>
              <a href="/community">커뮤니티</a>
            </p>
          </div>
        </section>
        <nav className="home-footer wrap" aria-label="화면 바로가기">
          <a href="/login">로그인</a>
          <a href="/signup">회원가입</a>
          <a href="/chatbot">학습 도우미</a>
        </nav>
      </main>
    </>
  );
}
