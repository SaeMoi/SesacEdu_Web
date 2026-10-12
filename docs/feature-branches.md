# 기능별 브랜치와 협업 규칙

기존 main/dev 및 B의 feat/user-profile은 수정하지 않습니다.
feature/shared-react-jsp-header는 기존 A 화면 전체를 보존한 공통 기준입니다.
각 기능 브랜치는 이 기준에서 출발합니다. 기존 화면을 각각 독립 커밋으로 분해한 것은 아닙니다.
새로운 수정부터 해당 기능 브랜치에만 커밋합니다.

| 담당 | 브랜치 | 주 작업 파일 |
|---|---|---|
| A·공통 | feature/shared-react-jsp-header | src/components/navigation, src/entries, public/design/common.css |
| A | feature/a-main | src/pages/HomePage.jsx, HomePage.css |
| A | feature/a-login | jsp/WEB-INF/views/login.jsp |
| A | feature/a-signup | jsp/WEB-INF/views/signup.jsp |
| A | feature/a-course-list | jsp/WEB-INF/views/courses.jsp, fragments/cards.jspf |
| A | feature/a-course-detail | jsp/WEB-INF/views/detail.jsp |
| A | feature/a-qna | jsp/WEB-INF/views/qna.jsp, fragments/classroom.jspf |
| A | feature/a-community | jsp/WEB-INF/views/community.jsp, post-*.jsp |
| A | feature/a-chatbot | jsp/WEB-INF/views/chatbot.jsp |
| A | feature/a-assignments | jsp/WEB-INF/views/assignments.jsp, fragments/assignment.jspf, assets/assignments.* |
| B·기존 | feat/user-profile | B의 기존 React 마이페이지 작업 유지 |

B의 장바구니/강사 페이지 브랜치는 B가 자신의 최신 React 작업을 기준으로 생성합니다.
A의 JSP 기준 브랜치로 B의 작업 브랜치를 교체하지 않습니다.

## 작업 시작

작업 중 변경을 먼저 커밋한 뒤:

```bash
git fetch origin
git switch --track origin/feature/a-login
```

이미 로컬 브랜치가 있으면 `git switch feature/a-login`만 실행합니다.
작업 후 `npm run lint`, `npm run build`, `npm run build:header`와 해당 JSP 화면을 확인하고,
해당 브랜치에 커밋하여 `git push -u origin feature/a-login`으로 올립니다.

## 병합 순서

1. 공통 기준 브랜치를 dev 대상으로 먼저 검토합니다. 기존 React App.jsx 라우팅과 B의 App.jsx 변경은 함께 조정해야 합니다.
2. 공통 기준이 dev에 반영된 뒤 각 기능 브랜치에서 dev 대상 PR을 만듭니다.
3. 현재 과제 기능만 새 기능 커밋이 있고, 나머지는 향후 작업을 위한 출발 브랜치입니다. 변경이 없는 브랜치의 PR은 만들지 않습니다.
4. dev에서 통합 확인한 뒤 main으로 반영합니다. main/dev 강제 푸시는 사용하지 않습니다.

공유 파일: App.jsx, vite.config.js, WEB-INF/web.xml, classroom.jspf, assets/app.js, assets/site.css.
이 파일은 여러 기능이 사용하는 만큼 변경 사항을 PR에 명시하고 서로 검토합니다.
새 과제 CSS/JS는 별도 파일로 분리했습니다. 다른 기능도 수정 범위가 커지면 같은 방식으로 분리합니다.
