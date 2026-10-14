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

## 강사센터 강의 관리

- 강의 관리(목록·등록/수정·자료 업로드 화면 전환): `/instructor/lectures`

백엔드 API는 프론트엔드 React Router URL과 구분하여 `VITE_API_BASE_URL`을
기준으로 다음 경로를 호출합니다.

- `GET /instructor/lectures`
- `POST /instructor/lectures`
- `GET /instructor/lectures/{lid}`
- `PUT /instructor/lectures/{lid}`
- `PUT /instructor/lectures/{lid}/files`
- `DELETE /instructor/lectures/{lid}/files`

현재 checkout에는 인증 Access Token 공급 코드가 없으므로 통합 시
`InstructorCoursesAuthProvider`에 기존 로그인 토큰을 전달해야 합니다.
자료 업로드는 `PUT`을 사용합니다. 백엔드가 공유한 엔드포인트 목록 기준입니다.
삭제 경로는 별도 API 함수로 준비했지만, 삭제 대상 범위나 요청 본문이 명세되지 않아
UI에는 연결하지 않습니다. 화면 단계와 수정 모드는 React Router state로 전환하고,
백엔드 요청 경로는 위 API 주소와 별도로 유지합니다. 수업 목록 조회 계약도 확인이
필요합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
