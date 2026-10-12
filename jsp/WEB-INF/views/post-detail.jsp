<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%@ include file="../fragments/posts.jspf" %>
<% String[] post=null;for(String[] row:posts){if(row[0].equals(request.getParameter("id")))post=row;}if(post==null){response.sendError(404);return;}String pageTitle=post[2];%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="post-page">
<a class="breadcrumb" href="${pageContext.request.contextPath}/community">›　커뮤니티</a>
<header class="post-heading">
<span class="pill <%=post[5]%>">
<%=post[1]%>
</span>
<h1>
<%=post[2]%>
</h1>
<div class="author">
<span class="avatar">
<%=post[4]%>
</span>
<span>학습자 <%=post[4]%> · 예시 게시글</span>
</div>
</header>
<article class="post-body">
<p>
<%=post[3]%>
</p>
<p>각자 강의를 학습한 뒤 궁금한 점을 나누려고 합니다.<br>관심 있는 학습 주제와 공부 방법을 함께 이야기해요.</p>
</article>
<section class="comments">
<h2>댓글</h2>
<p>아직 등록된 댓글이 없습니다.</p>
</section>
<div class="form-actions">
<a class="btn secondary" href="${pageContext.request.contextPath}/community">목록으로</a>
<a class="btn primary" href="${pageContext.request.contextPath}/community/write">새 글 작성　♢</a>
</div>
<p class="screen-note">댓글 작성·수정·삭제 정책은 별도 확정합니다.</p>
</main>
<%@ include file="../fragments/footer.jspf" %>