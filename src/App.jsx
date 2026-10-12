import HomePage from "./pages/HomePage";
// A의 메인은 React로 렌더링하고 나머지 화면은 링크를 통해 Tomcat JSP로 이동합니다.
// B의 라우터/마이페이지 코드는 이 브랜치에서 수정하거나 덮어쓰지 않습니다.
export default function App() {
  return <HomePage />;
}
