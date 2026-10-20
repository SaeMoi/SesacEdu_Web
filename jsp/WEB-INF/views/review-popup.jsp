<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%-- 커뮤니티 수강평을 눌렀을 때 뜨는 작은 창: 그 강의의 수강평만 보여 줍니다 (/courses/reviews?id=강의번호&user=작성자). --%>
<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>수강평 · 새싹에듀</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/design/common.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/site.css?v=feedback-20261018">
</head>
<body class="review-popup-body">
<main id="review-popup" class="review-popup">
<p class="eyebrow">COURSE REVIEWS</p>
<h1 id="review-popup-title">수강평</h1>
<p id="review-popup-summary" class="muted"></p>
<p id="review-popup-status" role="status">수강평을 불러오는 중입니다.</p>
<ul id="review-popup-list" class="review-popup-list"></ul>
<nav id="review-popup-pages" class="review-popup-pages" aria-label="수강평 페이지" hidden>
<button type="button" class="btn secondary" id="review-popup-prev">이전</button>
<span id="review-popup-page"></span>
<button type="button" class="btn secondary" id="review-popup-next">다음</button>
</nav>
<div class="review-popup-actions">
<a class="btn secondary" id="review-popup-course" href="${pageContext.request.contextPath}/courses" target="_blank" rel="noopener">강의 상세 보기</a>
<button type="button" class="btn primary" id="review-popup-close">닫기</button>
</div>
</main>
<script type="module" src="${pageContext.request.contextPath}/assets/app.js?v=feedback-20261018"></script>
</body>
</html>
