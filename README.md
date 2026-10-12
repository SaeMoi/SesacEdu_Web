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

## 마이페이지 쿠폰 / 포인트 API

프론트엔드 `/mypage/bnf`에서 `VITE_API_BASE_URL` 기준
`GET /mypage/bnf`와 `POST /mypage/cpn`을 호출합니다.
현재 저장소에 로그인 Access Token 공급 및 `/login/replc` 갱신 기능이 없어 실제 요청은
기존 인증 상태를 `BenefitsAuthProvider`에 연결한 뒤 검증해야 합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
