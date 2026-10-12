import "./App.css";
import { Route, Routes } from "react-router";
import MyPage from "./pages/MyPage.jsx";
import SiteHeader from "./components/SiteHeader.jsx";

const categories = [
  "웹 보안",
  "네트워크",
  "개발 기초",
  "로그 분석",
  "클라우드",
];

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SiteHeader />
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
        }
      />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
}

export default App;