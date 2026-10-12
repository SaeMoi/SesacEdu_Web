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

## 담당 범위

- A: 메인, 로그인, 회원가입, 강의 목록·상세, 학습 화면, 질문답변, 커뮤니티, 챗봇
- B: 마이페이지, 장바구니, 강사 관리

## 협업 방식

공통 초기 설정을 기준으로 기능별 브랜치에서 작업하고,
Pull Request를 통해 main에 병합합니다.
