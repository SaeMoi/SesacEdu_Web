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

## 강사 신청 페이지

프론트엔드 경로는 `/instructor/apply`입니다. 상태 조회와 신청 API의 URL 및
로그인 Access Token 공급 방식이 확정되면 다음 환경 설정과 인증 연결이 필요합니다.

- `VITE_INSTRUCTOR_APPLICATION_STATUS_URL`
- `VITE_INSTRUCTOR_APPLICATION_SUBMIT_URL`
- `InstructorApplyAuthContext`에 로그인 Access Token 공급

API URL은 제공된 명세에 없어 임의로 지정하지 않았으며, 연결 전에는 신청 상태를
`NONE`으로 처리하거나 신청 요청을 보내지 않습니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
