<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="커뮤니티"; %>
<%@ include file="../fragments/head.jspf" %>
<%@ include file="../fragments/posts.jspf" %>
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
<%for(String c:new String[]{"전체","수강평","스터디","팀 프로젝트","질문·답변"}){%>
<button data-post-category="<%=c%>" aria-pressed="<%=c.equals("전체")%>">
<%=c%>
</button>
<%}%>
</nav>
<div class="community-callout">
<h2>혼자 고민하던 것, 여기서 이야기해요.</h2>
<p>경험을 나누고, 함께할 동료를 찾아보세요.</p>
</div>
<div class="post-list">
<%for(String[] post:posts){%>
<a class="post-item" data-post data-category="<%=post[1]%>" href="${pageContext.request.contextPath}/community/detail?id=<%=post[0]%>">
<span class="pill <%=post[5]%>">
<%=post[1]%>
</span>
<h2>
<%=post[2]%>
</h2>
<p>
<%=post[3]%>
</p>
<div class="author">
<span class="avatar">
<%=post[4]%>
</span>
<span>학습자 <%=post[4]%> · 예시 게시글</span>
</div>
</a>
<%}%>
</div>
<p class="empty-state" id="post-empty" hidden>해당하는 이야기가 아직 없어요.</p>
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
<p class="screen-note">목록·글은 공개, 작성은 로그인 후 이용하는 설계안입니다.</p>
<nav class="small-links">
<a href="${pageContext.request.contextPath}/qna">강의 질문·답변</a>
<a href="${pageContext.request.contextPath}/chatbot">학습 도우미</a>
</nav>
</aside>
</div>
</main>
<%@ include file="../fragments/footer.jspf" %>