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

## 강사센터 정산

- 목록 URL: `/instructor/settlement`
- 상세 URL: `/instructor/settlement/:sid`
- API: `GET /instructor/settlement?page={page}`, `GET /instructor/settlement/{sid}?page={page}`
- 요청은 `VITE_API_BASE_URL`과 `Authorization: Bearer {accessToken}`을 사용합니다. 현재 브랜치에는 로그인 토큰 공급자가 연결되어 있지 않습니다.
- 정산 응답에 페이지 메타데이터가 없으면 실제 다음 페이지를 조회해 데이터 존재 여부를 확인하며, 페이지 수를 임의로 만들지 않습니다.

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
