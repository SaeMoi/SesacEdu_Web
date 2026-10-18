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

## 마이페이지 쿠폰 / 포인트 API

프론트엔드 `/mypage/bnf`에서 `VITE_API_BASE_URL` 기준
`GET /mypage/bnf`와 `POST /mypage/cpn`을 호출합니다.
현재 저장소에 로그인 Access Token 공급 및 `/login/replc` 갱신 기능이 없어 실제 요청은
기존 인증 상태를 `BenefitsAuthProvider`에 연결한 뒤 검증해야 합니다.

## 마이페이지 결제 화면

- 결제: `/mypage/buy` (장바구니 선택 강의 ID를 React Router state의 `courseIds`로 전달)
- 결제 완료: `/mypage/buy/complete`
- 결제 내역: `/mypage/buy/history`
- 결제 상세 / 영수증: `/mypage/buy/history/:orderId`
- API 서버 주소: `VITE_API_BASE_URL`

결제 API 클라이언트는 `/mypage/buy`, `/mypage/buy/cpn`, `/mypage/buy/pnt`,
`/mypage/buy/history`, `/mypage/buy/history/{orderId}`, `/payment`를 호출합니다.
현재 checkout에는 장바구니 페이지와 로그인 Access Token 공급 기능이 없으므로
실제 구매를 검증하려면 기존 장바구니에서 `navigateToPayment`를 연결하고,
`PaymentAuthProvider`에 로그인 토큰을 전달해야 합니다. 계좌이체 요청 본문 형식도
확정되지 않아 UI만 제공하며 실제 주문 제출은 비활성화되어 있습니다.

## 강사 신청 페이지

프론트엔드 경로는 `/instructor/apply`입니다. 상태 조회와 신청 API의 URL 및
로그인 Access Token 공급 방식이 확정되면 다음 환경 설정과 인증 연결이 필요합니다.

- `VITE_INSTRUCTOR_APPLICATION_STATUS_URL`
- `VITE_INSTRUCTOR_APPLICATION_SUBMIT_URL`
- `InstructorApplyAuthContext`에 로그인 Access Token 공급

API URL은 제공된 명세에 없어 임의로 지정하지 않았으며, 연결 전에는 신청 상태를
`NONE`으로 처리하거나 신청 요청을 보내지 않습니다.

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

## 강사센터 과제 피드백

- 목록 화면: `/instructor/assignments`
- 상세 화면: `/instructor/assignments/:assid`
- API 기본 경로: `/instructor/assignments`
- API 요청은 `VITE_API_BASE_URL`을 기본 URL로 사용하고 `Authorization: Bearer {accessToken}` 헤더를 보냅니다.
- 이 브랜치의 `src/main.jsx`에는 로그인/JWT 공급자나 `InstructorAssignmentsAuthProvider`가 연결되어 있지 않습니다. 따라서 현재는 토큰이 필요한 API 요청을 보낼 수 없으며, 토큰 저장 방식은 이 기능에서 추정하거나 별도 저장하지 않습니다.
- 목록 응답 예시에는 페이지 메타데이터가 없으므로 페이지네이션은 응답에 `totalPages`가 포함된 경우에만 표시합니다.
- 제공된 목록 URL(`/instructor/assignments`)과 본문 예시 URL(`/api/instructor/lectures/{lid}/assignments`)은 계약 확인이 필요합니다. 구현은 우선 지정된 목록 URL을 사용합니다.

## 강사센터 정산

- 목록 URL: `/instructor/settlement`
- 상세 URL: `/instructor/settlement/:sid`
- API: `GET /instructor/settlement?page={page}`, `GET /instructor/settlement/{sid}?page={page}`
- 요청은 `VITE_API_BASE_URL`과 `Authorization: Bearer {accessToken}`을 사용합니다. 현재 브랜치에는 로그인 토큰 공급자가 연결되어 있지 않습니다.
- 정산 응답에 페이지 메타데이터가 없으면 실제 다음 페이지를 조회해 데이터 존재 여부를 확인하며, 페이지 수를 임의로 만들지 않습니다.

## 강사센터 쿠폰 발행

- 목록/추가 화면 URL: `/instructor/coupon` (화면 전환은 URL을 바꾸지 않는 내부 상태 사용)
- 쿠폰 목록/발행 API: `GET /instructor/coupon?page={page}`, `POST /instructor/coupon`
- 강의 선택은 기존 강사 강의 목록 계약 `GET /instructor/lectures?status=&page=1`의 `content`를 사용합니다.
- 쿠폰 API는 `VITE_API_BASE_URL` 및 `Authorization: Bearer {accessToken}`을 사용합니다. 현재 브랜치에는 로그인 토큰 공급자가 연결되어 있지 않습니다.
- 쿠폰 페이지네이션 응답 메타데이터가 없으면 다음 페이지를 요청해 비어 있지 않은 페이지인지 확인하며, 임의의 총 페이지 수나 페이지 크기는 만들지 않습니다.
- 쿠폰 목록 경로(`/instructor/coupon`)와 요청 예시(`/instructors/coupon`)가 명세에서 다릅니다. 구현은 지정된 `/instructor/coupon`을 사용합니다.
- 목록 조회 실패 코드(400)와 발행 실패 코드(401)의 의미 및 페이지네이션 필드는 백엔드 확인이 필요합니다.

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업합니다.

기능별 변경을 통합 브랜치에서 함께 검증한 뒤,
Pull Request를 통해 dev에 병합합니다.

최종 검증을 마친 dev의 변경은 main에 반영합니다.