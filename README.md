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

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 강사센터 과제 피드백

- 목록 화면: `/instructor/assignments`
- 상세 화면: `/instructor/assignments/:assid`
- API 기본 경로: `/instructor/assignments`
- API 요청은 `VITE_API_BASE_URL`을 기본 URL로 사용하고 `Authorization: Bearer {accessToken}` 헤더를 보냅니다.
- 이 브랜치의 `src/main.jsx`에는 로그인/JWT 공급자나 `InstructorAssignmentsAuthProvider`가 연결되어 있지 않습니다. 따라서 현재는 토큰이 필요한 API 요청을 보낼 수 없으며, 토큰 저장 방식은 이 기능에서 추정하거나 별도 저장하지 않습니다.
- 목록 응답 예시에는 페이지 메타데이터가 없으므로 페이지네이션은 응답에 `totalPages`가 포함된 경우에만 표시합니다.
- 제공된 목록 URL(`/instructor/assignments`)과 본문 예시 URL(`/api/instructor/lectures/{lid}/assignments`)은 계약 확인이 필요합니다. 구현은 우선 지정된 목록 URL을 사용합니다.

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
