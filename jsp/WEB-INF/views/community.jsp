<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="커뮤니티"; %>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="wrap community-page">
<div class="community-heading">
<div>
<p class="eyebrow">SAESSAK COMMUNITY</p>
<h1>함께 배우면, 더 멀리 가니까.</h1>
<p>작은 질문부터 새로운 도전까지, 나의 배움을 나눠요.</p>
</div>
<label class="search-box">
<input id="post-search" type="search" aria-label="이야기 검색" placeholder="이야기 검색">
<span aria-hidden="true">⌕</span>
</label>
</div>
<div class="community-columns">
<section>
<nav class="community-tabs" aria-label="이야기 분류">
<%-- 탭 값은 GET /forum?sort= 값입니다. 백엔드 분류를 프론트 탭에 맞춰 팀 프로젝트(PROJECT)로 정했습니다 (2026-10-16). --%>
<%for(String[] c:new String[][]{{"ALL","전체"},{"REVIEW","수강평"},{"STUDY","스터디"},{"PROJECT","팀 프로젝트"},{"QUESTION","질문·답변"}}){%>
<button type="button" data-post-category="<%=c[0]%>" aria-pressed="<%="ALL".equals(c[0])%>">
<%=c[1]%>
</button>
<%}%>
</nav>
<div class="community-callout">
<h2>혼자 고민하던 것, 여기서 이야기해요.</h2>
<p>경험을 나누고, 함께할 동료를 찾아보세요.</p>
</div>
<p class="field-status" id="post-status" role="status" aria-live="polite"></p>
<button class="btn secondary" type="button" id="retry-posts" hidden>다시 불러오기</button>
<div class="post-list" id="post-list" aria-busy="true"></div>
<p class="empty-state" id="post-empty" hidden>해당하는 이야기가 아직 없어요.</p>
<nav class="pagination" id="post-pagination" aria-label="게시글 페이지" hidden></nav>
</section>
<aside>
<div class="write-card">
<h2>오늘의 발견을<br>들려주세요.</h2>
<p>누군가에게는 당신의 경험이<br>좋은 시작이 될 수 있어요.</p>
<a class="btn primary full" href="${pageContext.request.contextPath}/community/write">글 작성하기　♢</a>
</div>
<div class="community-promise">
<h3>함께 지키는 약속</h3>
<p>서로의 질문을 존중해요.</p>
<p>경험과 지식을 나눠요.</p>
<p>개인정보는 남기지 않아요.</p>
</div>
<p class="screen-note">목록·글은 누구나 볼 수 있고, 글·댓글 작성은 로그인 후 이용할 수 있어요. 검색은 현재 페이지 안에서만 찾습니다.</p>
<nav class="small-links">
<a href="${pageContext.request.contextPath}/qna">강의 질문·답변</a>
<a href="${pageContext.request.contextPath}/chatbot">학습 도우미</a>
</nav>
</aside>
</div>
</main>
<%@ include file="../fragments/footer.jspf" %>