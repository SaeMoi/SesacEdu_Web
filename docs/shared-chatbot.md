# 공통 React 학습 도우미

React 메인과 모든 JSP 본문에서 같은 Chatbot 컴포넌트를 사용합니다.
B의 React 화면에는 아래처럼 한 번만 추가하면 됩니다. B 브랜치 자체는 수정하지 않았습니다.

## B가 가져갈 파일

작업을 먼저 커밋한 뒤 최신 원격을 받아, 아래 새 파일만 가져옵니다.
동일 경로에서 이미 작업했다면 덮어쓰지 말고 diff를 먼저 확인합니다.

```bash
git fetch origin
git restore --source=origin/feat/chatbot -- src/components/chatbot src/api/chatbot.js
```

B의 기존 App.jsx/Router/공통 레이아웃을 유지하고 다음 import와 컴포넌트만 추가합니다.

```jsx
import Chatbot from './components/chatbot/Chatbot';

// 기존 Router와 Routes를 그대로 두고, 최상위 레이아웃에 한 번만 추가하세요.
// <기존페이지들 />
// <Chatbot />
```

강의 문맥이 필요한 경우 `<Chatbot courseId={courseId} />`로 전달할 수 있습니다.
일반 페이지에서는 `<Chatbot />`이면 충분합니다. CSS Modules가 자동으로 적용되어 별도 전역 CSS 복사는 필요 없습니다.
라우트마다 컴포넌트를 추가하면 중복되므로 앱 공통 레이아웃에서 한 번만 렌더링합니다.
React 내에서는 위 컴포넌트 방식을 사용하고 JSP용 chatbot.js를 동시에 로드하지 않습니다.

## JSP

footer.jspf에서 shared-chatbot 영역과 /ui/chatbot.js를 로드하며,
head.jspf에서 /ui/chatbot.css를 로드합니다. build:chatbot으로 별도 번들을 생성합니다.
start-preview.sh는 메인, 헤더, 챗봇을 빌드한 뒤 Tomcat 미리보기에 복사합니다.

## 현재 동작과 연동 경계

- 열기/접기, 닫기, Escape 닫기, 질문 입력, 데모 답변, 대화 지우기.
- 같은 origin/같은 브라우저 탭에서는 페이지를 이동해도 최근 40개 메시지를 sessionStorage로 유지합니다.
- 5173과 8088은 origin이 달라 대화가 공유되지 않습니다. 서비스 통합 시 동일 origin으로 제공합니다.
- 계정별 서버 대화 이력이나 실제 AI 응답은 아직 연결하지 않았습니다.
- src/api/chatbot.js의 sendChatMessage만 자체 백엔드 API 호출로 교체합니다. AI 비밀키는 프론트에 넣지 않습니다.
- 로그인 연결 시 데모 저장소를 사용자별 서버 대화로 바꾸고, 로그아웃/계정 전환 시 이전 대화를 비웁니다.
- 챗봇 노출은 강의 영상 접근 허용과 별개입니다. 사용자별 정보/강의 자료 접근은 서버가 검사합니다.

## main과의 차이 (확인 기준)

원격 main: 83f16a53747035296eda4be855b290c6d725d212. 현재 main/dev 자체는 수정하지 않았습니다.
현재 기능 브랜치에는 다음 변경이 있습니다.

| 구분 | 초기 main 대비 변경 | B 통합 방법 |
|---|---|---|
| App.jsx | 단일 화면을 HomePage 컴포넌트로 분리하고 공통 챗봇 배치 | B 라우터를 보존해 수동 통합 |
| 공통 헤더 | navigation/Header와 JSP 마운트 진입점 추가 | 중복 헤더 없이 공통 레이아웃에서 통합 |
| 화면/자산 | HomePage, 디자인 파일, JSP 로그인·강의·게시판·과제 등 추가 | B 페이지 폴더 전체를 덮어쓰지 않음 |
| Vite 설정 | JSP 경로를 Tomcat8088로 전달하는 개발용 프록시 추가 | B 개발 설정과 합의 후 반영 |
| 빌드 | 헤더·챗봇 별도 빌드 명령, 산출물 gitignore 추가 | JSP를 실행할 환경에서 사용 |
| 공통 챗봇 | CSS Modules 기반 독립 컴포넌트/API 파일 추가 | 위 2개 경로만 가져와 B 레이아웃에 배치 |

B의 원격 feat/user-profile은 main 대비 App.jsx와 MyPageProfile/ComingSoon 파일을 변경했습니다.
B 로컬의 미게시 작업은 확인할 수 없으므로 이 비교는 GitHub에 올라온 코드 기준입니다.
