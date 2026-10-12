import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 메인은 Vite에서 수정하고, JSP 주소는 실행 중인 Tomcat으로 전달합니다.
// JSP까지 보려면 jsp/start-preview.sh 서버가 먼저 실행되어 있어야 합니다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "^/(login|signup|courses|qna|community|chatbot)(/|\\?|$)":
        "http://127.0.0.1:8088",
      "/ui/": "http://127.0.0.1:8088",
      "^/assets/(app\\.js|site\\.css)$": "http://127.0.0.1:8088",
    },
  },
});
