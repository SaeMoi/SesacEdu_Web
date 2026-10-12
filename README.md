# SesacEdu_Web

새싹에듀 프론트엔드 프로젝트입니다.

## 기술 구성

- React + JavaScript
- Vite
- React Router
- ESLint + Prettier

## 설치 및 실행

npm ci
npm run dev

## 코드 검사 및 빌드

npm run lint
npm run build

## 프로필 수정 API

프로필 확인 및 수정 화면은 `VITE_API_BASE_URL`을 설정하면 해당 서버에 요청합니다.
현재 저장소에는 로그인 Access Token 공급/저장 방식과 `/login/replc` 토큰 재발급 구현이
없습니다. 프로필 편집 session provider는 향후 인증 통합 시 Access Token을 전달받도록
구성되어 있으며, 토큰이 없으면 인증이 필요한 API 요청을 보내지 않습니다.
재인증 토큰은 페이지 세션의 React 메모리에만 보관하고 새로고침 시 폐기됩니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
