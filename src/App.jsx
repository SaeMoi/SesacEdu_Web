import "./App.css";

const categories = [
  "웹 보안",
  "네트워크",
  "개발 기초",
  "로그 분석",
  "클라우드",
];

function App() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <span className="brand" aria-label="새싹에듀">
            새싹<span>에듀</span>
          </span>

          <nav className="main-nav" aria-label="주요 메뉴">
            <span className="nav-active">강의</span>
            <span>커뮤니티</span>
          </nav>

          <div className="header-actions">
            <span>로그인</span>
            <span className="button button-primary">시작하기</span>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="home-hero">
          <p className="eyebrow">LEARN AT YOUR OWN PACE</p>

          <h1>
            궁금했던 것을,
            <br />
            <span>할 수 있는 것으로.</span>
          </h1>

          <p className="hero-description">
            작은 호기심에서 시작하는 나만의 배움.
            <br />
            기초부터 실습까지 새싹에듀와 함께해요.
          </p>

          <ul className="category-list" aria-label="학습 분야">
            {categories.map((category) => (
              <li key={category} className="category-item">
                {category}
              </li>
            ))}
          </ul>

          <span className="button button-primary hero-action">
            모든 강의 보기 <span aria-hidden="true">→</span>
          </span>
        </section>

        <section className="intro-banner">
          <div>
            <p className="eyebrow">ABOUT SAESAK EDU</p>
            <h2>배움의 시작부터, 내 것으로 만드는 순간까지.</h2>
            <p>
              강의를 듣고, 직접 실습하고, 궁금한 점을 나누며 성장해요.
            </p>
          </div>

          <span className="intro-mark" aria-hidden="true">
            +
          </span>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">새싹에듀 · 오늘도 한 걸음</div>
      </footer>
    </>
  );
}

export default App;