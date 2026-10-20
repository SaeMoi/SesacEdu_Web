# 엔드포인트 점검 — 2026-10-13

기준: 첨부 API 명세 CSV/PDF 및 로그인·로그아웃 최신본 PDF. A 5314710, B의 8개 기능 브랜치 기준. 화면 URL과 JSON API URL은 별개이며 같은 문자열이어도 서버 역할이 다릅니다.

## 확정 수정
- A Header: 마이페이지 `/mypage/profile` → `/mypage`, 장바구니 `/cart` → `/mypage/cart`.
- B 내 학습 GET: `/mypage/courses` → `/mypage/lectures`.
- B 8개 API 모듈: 로그인 응답의 `Bearer ...` 전체 값에 Bearer를 중복하지 않도록 수정. 기존 순수 JWT 값도 호환.
- B 강사 신청: VITE_API_BASE_URL이 지정되면 GET/POST 기본 주소를 해당 호스트의 `/instructor/apply`로 사용. 기존 개별 URL 설정 우선권은 유지.
- 과거 미리보기 제안 문서의 `/api/courses/...`는 확정 명세가 아님을 정리. 강의 수강 API는 GET `/lectures/{Lid}/learn`.

## A 화면과 API 대응
| 화면 | API (메소드 포함) | 현재 연결 |
| --- | --- | --- |
| /login | POST /login | 화면 시연 |
| 로그아웃 | POST /logout | 미구현 |
| 재발급 | POST /login/replc | 미구현 |
| /signup | POST /signup | 화면 시연 |
| 이메일 인증 | POST /email-auth, POST /email-auth/verify | 화면 시연 |
| /courses | GET /lectures | 예시 데이터 |
| /courses/detail?id=... | GET /lectures/{Lid} | 예시 데이터 |
| /qna 학습 화면 | GET /lectures/{Lid}/learn | 영상 미연결 |
| 강의 자료 | GET /lectures/{Lid}/material | 미연결 |
| 과제 안내 | GET /lectures/{Lid}/assignment | 예시 데이터 |
| 과제 제출 | POST /lectures/{Lid}/assignments | 화면 내 제출만 |
| 과제 상세·수정·삭제 | GET/PUT/DELETE /lectures/{Lid}/assignments/{aid} | 미연결 |
| 강의 질문답변 | GET/POST /lectures/{Lid}/qna | 예시 데이터 |
| 질문 상세 | GET /lectures/{Lid}/qna/{qnaid} | 미연결 |
| 강의 리뷰 | GET/POST /lectures/{Lid}/reviews | 미연결 |
| /community 및 챗봇 | 첨부 명세에 없음 | 임의 API를 생성하지 않음 |

현재 web/network-start 등의 강의 ID는 예시 문자열입니다. 서버의 실제 Lid를 받아 링크·API에 전달해야 합니다. 화면 주소를 /lectures로 일괄 변경하지 않았습니다.

## B 경로 대조
| 기능 | 명세 API | 결과 |
| --- | --- | --- |
| 프로필 | GET /mypage | 경로·메소드 일치 |
| 본인 확인 | POST /mypage/verify-password | 일치 |
| 프로필 수정 | PUT /mypage/profile | 일치 |
| 사진 | POST /mypage/edit_prof | 일치 |
| 비밀번호 | PUT /mypage/password | 일치 |
| 내 학습 | GET /mypage/lectures | 수정 패치 작성 |
| 내 강의 리뷰 | POST /mypage/lectures/{lectureid}/review | 경로는 확정, 본문·응답 상세가 없어 등록 기능은 미연결 유지 |
| 내 Q&A | GET /mypage/qna | 기본 경로 일치. CSV는 sort만 표시; 코드의 status/page/size는 상세 명세 확인 필요 |
| 장바구니 | GET /mypage/cart, POST /mypage/cart/add, DELETE /mypage/cart/del | 일치 |
| 혜택·쿠폰 | GET /mypage/bnf, POST /mypage/cpn | 일치 |
| 결제 | GET/POST /mypage/buy | 일치 |
| 할인 적용 | GET /mypage/buy/cpn, GET /mypage/buy/pnt | 일치 |
| 결제 이력 | GET /mypage/buy/history, GET /mypage/buy/history/{orderId} | 일치 |
| 강사 신청 | GET/POST /instructor/apply | 기본 URL 설정 패치 작성 |

`/mypage/learning`은 React 화면 경로이므로 API `/mypage/lectures`와 달라도 정상입니다.

## 인증 명세 적용 기준과 미확정 사항
- 로그인 POST /login JSON은 {email, pw}. 성공 응답의 Authorization 헤더 전체를 읽어 이후 요청에 그대로 전달. result.member는 사용자 표시용.
- /login/replc는 만료된 Authorization 헤더로 POST. 성공 시 응답 헤더 교체 후 원래 요청은 한 번만 재시도. 동시 만료 요청의 재발급은 하나로 묶어야 함. 현재 코드에는 이 공통 로직이 없음.
- POST /logout은 요청 본문 없음. 204는 JSON 파싱하지 않음. 명세상 401도 프론트 토큰 삭제 처리.
- 로그인 PDF 앞부분의 본문 accessToken·Refresh 쿠키 설명과 뒤의 '본문에는 없음/JWT 단독'이 충돌. 로그아웃 PDF도 마지막 denylist·/auth/refresh 절이 앞의 Redis 미사용 설명과 충돌. 최신 명시 규칙인 Authorization 헤더·/login/replc를 기준으로 패치를 준비했으며, 최종 백엔드 응답 확인 필요.
- 토큰 메모리 보관과 JSP 전체 문서 이동을 함께 쓰면 이동/새로고침 시 토큰이 사라짐. 저장소 사용을 임의 추가하지 않음. 백엔드와 인증 유지 구조 결정 필요.
- B는 여러 API에서 성공 code와 result 필드를 엄격하게 검사함. CSV에는 이 응답 상세가 없으므로 경로를 고쳤다고 응답 호환까지 검증된 것은 아님.
- 결제 코드가 브라우저에서 POST /payment 호출. CSV는 'back→PG사'로 표기되어 있어 프론트 호출용인지 백엔드 내부용인지 확인 필요. 결제 흐름을 임의 변경하지 않음.
- API 서버 호스트가 제공되지 않음. 화면과 API가 /login, /mypage처럼 겹치므로 API 호스트 또는 프록시 접두사 분리가 필요. 명세에 없는 /api 접두사를 임의 추가하지 않음.
- 과제 첨부 선택은 프론트 요구사항. 서버 multipart 본문에서 파일 선택 허용 여부는 상세 명세로 확인 필요.

## B 수정 적용 방법
`docs/integration-patches/`의 패치는 각각 해당 기능 브랜치에만 적용합니다. A 브랜치에 모든 패치를 한꺼번에 적용하면 대상 파일이 없어 실패합니다. B의 원격 브랜치를 직접 수정하거나 강제 푸시하지 않았습니다.

예: B 내 학습 브랜치에서 해당 패치 파일의 실제 위치를 지정하여 `git apply --check <파일>` 검사 후 `git apply <파일>`로 적용합니다. 수정 대상 브랜치가 최신으로 바뀌었다면 먼저 차이를 재확인합니다. 통합 시에는 동일 변경을 통합 브랜치에 반영합니다.

패치 대상: user-profile, profile-edit, my-learning, my-qna, my-cart, my-benefits, my-payment, instructor-apply.
