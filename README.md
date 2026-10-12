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

## 내 학습 API

내 학습 목록은 상세 명세의 `GET /mypage/courses`를 사용합니다. 리뷰 등록은 제공 자료의
API 경로와 요청/응답 스키마가 서로 일치하지 않아 실제 요청을 보내지 않으며, 화면에서
명세 확인이 필요하다고 안내합니다. Access Token 공급 및 `/login/replc` 연동은 현재
저장소에 구현되어 있지 않습니다. 백엔드 주소는 `VITE_API_BASE_URL`로 설정할 수 있으며,
인증 연결 시 `MyLearningAuthProvider`에 기존 Access Token을 전달해야 합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
