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

## 마이페이지 장바구니 API

장바구니 화면은 프론트엔드 `/mypage/cart` 경로에서 백엔드 `VITE_API_BASE_URL` 기준
`GET /mypage/cart`, `POST /mypage/cart/add`, `DELETE /mypage/cart/del`을 호출합니다.
저장소에 로그인 Access Token 공급 및 `/login/replc` 갱신 구현이 없으므로 실제 인증 연동 전에는
API 호출을 보내지 않습니다. 인증 통합 시 기존 Access Token을 `CartAuthProvider`에 전달해야 합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
