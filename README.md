# SesacEdu_Web

새싹에듀 프론트엔드 프로젝트입니다.

## 기술 구성

- React + JavaScript
- JSP + Tomcat
- Vite
- React Router
- ESLint + Prettier

## 화면 구성

- React: 메인 페이지, B 담당 페이지
- JSP: 로그인, 회원가입, 강의 목록·상세, 학습 화면, 커뮤니티
- 공통 React 컴포넌트: 헤더, 학습 도우미
- B 페이지의 공통 헤더 적용은 통합 과정에서 진행합니다.

## 설치 및 실행

```bash
npm ci
npm run dev
```

Vite는 React 개발 화면을 제공합니다.
JSP 화면까지 확인하려면 별도 터미널에서 Tomcat 미리보기를 실행해야 합니다.

```bash
bash jsp/start-preview.sh
```

Tomcat 실행에 필요한 JAVA_HOME과 CATALINA_HOME은 각 개발 환경에 맞게 설정합니다.

## 코드 검사 및 빌드

```bash
npm run lint
npm run build
npm run build:header
npm run build:chatbot
```

## 마이페이지 프로필 API

프로필 조회는 `GET /mypage`를 호출합니다.

`VITE_API_BASE_URL`에는 백엔드 API의 base URL을 설정합니다.
화면 주소와 API 주소가 겹칠 수 있으므로 서버 주소와 프록시 설정을 구분해야 합니다.

현재 공통 로그인 인증은 연결되지 않았습니다.
프로필 조회에 사용할 토큰 전달, 토큰 재발급, 로그인 페이지 이동은
인증 모듈과 함께 연동해야 합니다.

## 프로필 수정 API

프로필 수정 관련 화면은 다음 주소를 사용합니다.

- 본인 확인: `/mypage/verify-password`
- 프로필 수정: `/mypage/profile`

프로필 수정 Provider는 인증 통합 시 Access Token을 전달받도록 구성되어 있습니다.
토큰이 없으면 인증이 필요한 API 요청을 보내지 않습니다.

현재 로그인 Access Token 공급과 `/login/replc` 토큰 재발급은 연결되지 않았습니다.
재인증 토큰은 React 메모리에 보관하며 새로고침 시 폐기됩니다.

## 구현 및 연동 상태

- A 화면은 예시 데이터와 화면 시연 중심으로 구현되어 있습니다.
- B 기능은 기능별 브랜치에서 통합 중입니다.
- 실제 로그인, 데이터 저장, 강의 영상, AI 서버 연결은 별도 연동이 필요합니다.
- 과제는 내용 작성 또는 PDF 첨부 중 하나가 있으면 제출 화면을 확인할 수 있습니다.
- 현재 과제 제출 내역은 서버에 저장되지 않으며 새로고침하면 초기화됩니다.

## 내 학습 API

내 학습 목록은 상세 명세의 `GET /mypage/courses`를 사용합니다. 리뷰 등록은 제공 자료의
API 경로와 요청/응답 스키마가 서로 일치하지 않아 실제 요청을 보내지 않으며, 화면에서
명세 확인이 필요하다고 안내합니다. Access Token 공급 및 `/login/replc` 연동은 현재
저장소에 구현되어 있지 않습니다. 백엔드 주소는 `VITE_API_BASE_URL`로 설정할 수 있으며,
인증 연결 시 `MyLearningAuthProvider`에 기존 Access Token을 전달해야 합니다.

## 마이페이지 Q&A 목록

프론트엔드 `/mypage/qna` 화면은 백엔드 `GET /mypage/qna`를 호출합니다.
두 경로가 같으므로 `VITE_API_BASE_URL`에 백엔드 origin을 설정해야 합니다.
현재 프로젝트에는 로그인 Access Token 공급 또는 `/login/replc` 토큰 갱신 구현이
없으므로, Q&A 인증 provider에는 추후 기존 인증 상태를 연결해야 합니다.

## 마이페이지 장바구니 API

장바구니 화면은 프론트엔드 `/mypage/cart` 경로에서 백엔드 `VITE_API_BASE_URL` 기준
`GET /mypage/cart`, `POST /mypage/cart/add`, `DELETE /mypage/cart/del`을 호출합니다.
저장소에 로그인 Access Token 공급 및 `/login/replc` 갱신 구현이 없으므로 실제 인증 연동 전에는
API 호출을 보내지 않습니다. 인증 통합 시 기존 Access Token을 `CartAuthProvider`에 전달해야 합니다.

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업합니다.

기능별 변경을 통합 브랜치에서 함께 검증한 뒤,
Pull Request를 통해 dev에 병합합니다.

최종 검증을 마친 dev의 변경은 main에 반영합니다.