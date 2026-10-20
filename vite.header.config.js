import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// JSP로 전달할 헤더만 빌드합니다. 기존 React 앱의 dist와 분리합니다.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  // 라이브러리 빌드에서도 React가 운영용 코드를 사용하도록 지정합니다.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist-header",
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("./src/entries/header.jsx", import.meta.url)),
      formats: ["es"],
      fileName: () => "header.js",
      cssFileName: "header",
    },
  },
});
