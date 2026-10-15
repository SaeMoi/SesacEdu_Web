import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 메인은 Vite에서 수정하고, JSP 주소는 실행 중인 Tomcat으로 전달합니다.
// JSP까지 보려면 jsp/start-preview.sh 서버가 먼저 실행되어 있어야 합니다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /backend/* 요청을 백엔드(8080)로 전달합니다. 예: /backend/login → :8080/login
      // 로그인·재발급·로그아웃·마이페이지·결제 API가 모두 같은 서버입니다.
      // 같은 출처 요청이므로 브라우저 Origin 헤더를 지워 백엔드 CORS 검사를 거치지 않게 합니다.
      "/backend": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
        },
      },
      "^/(login|signup|courses|community|chatbot|assignments)(/|\\?|$)":
        "http://127.0.0.1:8088",

// 강의 학습 화면 요청은 JSP 서버로 전달합니다.
      "^/lectures/[1-9][0-9]*/learn(\\?|$)":
        "http://127.0.0.1:8088",
      "/ui/": "http://127.0.0.1:8088",
      // 파일명 뒤에 버전 정보(?v=...)가 있어도 Tomcat으로 전달합니다.
      "^/assets/(app\\.js|preview\\.js|site\\.css|assignments\\.(js|css))(\\?|$)": "http://127.0.0.1:8088",
    },
  },
});
