<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%-- 글 내용은 assets/app.js가 GET /forum/{id}로 불러와 채웁니다. --%>
<%String pageTitle="커뮤니티 글";%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="post-page" data-post-detail data-context-path="${pageContext.request.contextPath}">
<a class="breadcrumb" href="${pageContext.request.contextPath}/community">›　커뮤니티</a>
<p class="field-status" id="detail-post-status" role="status" aria-live="polite">게시글을 불러오는 중입니다.</p>
<div id="post-content" hidden>
<header class="post-heading">
<span class="pill" id="post-category"></span>
<h1 id="post-title"></h1>
<div class="author">
<span class="avatar" id="post-avatar"></span>
<span id="post-meta"></span>
</div>
</header>
<article class="post-body" id="post-body-view"></article>
<section class="comments">
<h2>댓글 <span id="comment-count"></span></h2>
<div id="comment-list"></div>
<button class="btn secondary" type="button" id="comment-more" hidden>댓글 더 보기</button>
<form novalidate id="comment-form" hidden>
<label class="sr-only" for="comment-input">댓글</label>
<textarea id="comment-input" rows="3" placeholder="댓글을 입력해 주세요."></textarea>
<p class="field-status" id="comment-status" role="status" aria-live="polite"></p>
<div class="form-actions"><button class="btn primary" type="submit">댓글 등록</button></div>
</form>
<p id="comment-login" hidden>댓글을 작성하려면 <a href="${pageContext.request.contextPath}/login">로그인</a>해 주세요.</p>
</section>
</div>
<div class="form-actions">
<a class="btn secondary" href="${pageContext.request.contextPath}/community">목록으로</a>
<button class="btn secondary" type="button" id="delete-post" hidden>글 삭제</button>
<a class="btn primary" href="${pageContext.request.contextPath}/community/write">새 글 작성　♢</a>
</div>
</main>
<%@ include file="../fragments/footer.jspf" %>