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

## 마이페이지 프로필 API

프로필 조회는 `GET /mypage`를 호출합니다. 프론트엔드와 백엔드의 origin이 다르면
`VITE_API_BASE_URL`에 백엔드 base URL을 설정하세요. 기존 인증/토큰 모듈이 아직
없어 현재는 Bearer 토큰 전달과 토큰 재발급 및 로그인 페이지 이동을 연결하지
않으며, 인증 모듈과 백엔드 명세가 준비되면 연동해야 합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
