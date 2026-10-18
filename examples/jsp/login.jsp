<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>로그인 | 새싹에듀</title>
    <%-- 백엔드에서 dist-header 파일을 /ui 경로로 제공하도록 설정해야 합니다. --%>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/design/common.css">
</head>
<body>
    <%-- 인증 토큰이나 개인정보를 HTML 속성에 넣지 않습니다. --%>
    <div id="header-root" data-base-path="${pageContext.request.contextPath}"></div>
    <main>
        <h1>로그인</h1>
        <%-- 이 파일은 헤더 연결 예시입니다. 실제 로그인 폼/API는 별도 구현합니다. --%>
        <p>공통 헤더 연결 확인용 페이지입니다.</p>
    </main>
    <script type="module">
        // React 앱 전체가 아닌 독립적으로 빌드된 헤더 모듈만 가져옵니다.
        import { mountHeader } from "${pageContext.request.contextPath}/ui/header.js";
        mountHeader(document.getElementById("header-root"));
        // 인증 방식 합의 후 반환값을 보관하고 update({ member, authLoading: false })로 갱신합니다.
    </script>
</body>
</html>
