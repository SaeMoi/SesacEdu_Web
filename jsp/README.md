# 새싹에듀 A 담당 화면

첨부 `새싹에듀_화면설계_최신본.pptx`의 배치·문구·색상·원본 로고와 아이콘을 반영했습니다.
**모든 페이지 헤더는 React**, 메인 본문은 React, 나머지 본문은 JSP입니다.

## 파일 구조

- `src/components/navigation/Header.jsx`: 모든 페이지가 사용하는 공통 React 헤더
- `src/entries/header.jsx`: JSP에서 헤더 영역만 마운트하는 함수
- `src/pages/HomePage.jsx`, `HomePage.css`: React 메인
- `public/design`: 공통 CSS와 PPT에서 추출한 로고/아이콘/강의 이미지
- `jsp/WEB-INF/views`: login, signup, courses, detail, qna, community, chatbot 및 community 하위 화면
- `jsp/WEB-INF/fragments`: head/header/footer, 예시 데이터, 강의 카드, 강의실 공통 include
- `jsp/assets`: JSP 본문 스타일과 폼/필터/탭/대화 UI 동작
- `jsp/WEB-INF/web.xml`: JSP URL 매핑. 루트는 React index.html

## 실행

프로젝트 루트에서 실행합니다. Java와 Tomcat 10.1, Node/npm, Python3가 필요합니다.

```sh
JAVA_HOME='/tmp/sesac-jsp-runtime/jdk-21.0.12.1+1-jre/Contents/Home' CATALINA_HOME='/tmp/sesac-jsp-runtime/apache-tomcat-10.1.60' bash jsp/start-preview.sh
```

위 경로는 이번 Mac의 임시 런타임입니다. 정리되면 설치한 Java/Tomcat 경로로 변경합니다.
실행하면 React 메인/헤더를 각각 빌드하고, 임시 Tomcat base에 JSP와 함께 배포합니다.
http://127.0.0.1:8088/ 에서 모든 화면을 볼 수 있습니다. Ctrl+C로 중지합니다.
JSP 수정 후에는 다시 실행합니다. `npm run dev`는 메인을 빠르게 수정하기 위한 선택 사항이며 JSP 링크는 실행 중인 8088 서버로 프록시합니다.

## 이동 경로

| 화면 | URL | 본문 |
|---|---|---|
| 메인 | `/` | React |
| 로그인 / 회원가입 | `/login`, `/signup` | JSP |
| 강의목록 / 상세 | `/courses`, `/courses/detail?id=web` | JSP |
| 질문답변 | `/qna` | JSP |
| 커뮤니티 | `/community` | JSP |
| 게시글 상세 / 작성 / 완료 | `/community/detail?id=study`, `/community/write`, `/community/done` | JSP |
| 챗봇 | `/chatbot` | JSP |

헤더 링크는 일반 `<a>`이므로 JSP로 이동할 때 서버에서 새 문서를 받습니다.
JSP의 `shared-header`에 같은 Header.jsx 번들을 마운트합니다. 공통 CSS는 `/design/common.css`입니다.

## 화면 동작과 연결 전 기능

검색/분류/정렬, 상세 탭, 구매 안내, 질문 작성 열기, 커뮤니티 이동, 챗봇 예시 대화가 구현되어 있습니다.
이메일 확인은 시연용이며 인증번호 `123456`을 사용합니다. 이메일을 바꾸면 시연 인증 상태가 초기화됩니다.
로그인, 계정 생성, 이메일 발송, 구매, 게시글 저장, 동영상 재생, AI 응답은 백엔드 연결 전입니다.
폼 입력과 대화는 서버나 브라우저 저장소에 저장하지 않습니다.
B의 마이페이지/장바구니/강사 화면은 이번 미리보기 범위에 포함하지 않았습니다.

## 협업

기존 GitHub main/dev와 B의 브랜치는 변경하지 않았습니다. 이 변경은 로컬 A 기능 브랜치에 있습니다.
B의 파일을 덮어쓰지 말고, 병합 때 기존 App 라우터의 `/`에 HomePage를 연결하세요.
B는 같은 Header.jsx를 import해서 사용하고, JSP 페이지로 이동할 때 일반 링크를 사용합니다.
상세한 백엔드 합의 항목은 `docs/react-jsp-integration.md`를 참고하세요.

## 과제 확인

`/assignments` 또는 강의 학습 화면의 과제 버튼으로 진입합니다. 설계안 23~25 기반입니다.
과제 안내 → PDF 선택(또는 드롭) → 메모 → 제출 미리보기 → 내 제출 파일 다운로드 → 피드백 예시를 확인할 수 있습니다.
파일/메모는 새로고침하면 초기화되며 서버로 전송하지 않습니다. PDF/10MB 제한은 합의 전 임시 UI 기준입니다.

과제 코드는 `assets/assignments.js`, `assets/assignments.css`, `WEB-INF/fragments/assignment.jspf`로 분리했습니다.
협업 브랜치는 `../docs/feature-branches.md`, API 연결 협의는 `../docs/assignment-backend.md`를 참고하세요.

## 공통 학습 도우미
모든 JSP와 React 메인에서 공통 React 챗봇을 사용합니다. `npm run build:chatbot`이 추가되었습니다. B 연결 방법은 `../docs/shared-chatbot.md`에 있습니다.
