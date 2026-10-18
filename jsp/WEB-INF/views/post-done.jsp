<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%String pageTitle="작성 화면 확인";%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="post-done">
<span class="done-check">✓</span>
<h1>이야기를 나눠주셔서 고마워요.</h1>
<p>게시글이 등록되었어요.</p>
<div>
<% String doneId=request.getParameter("id"); if(doneId!=null && doneId.matches("[1-9][0-9]{0,18}")){ %>
<a class="btn primary" href="${pageContext.request.contextPath}/community/detail?id=<%=doneId%>">내 글 보기 →</a>
<a class="btn secondary" href="${pageContext.request.contextPath}/community">커뮤니티로 이동</a>
<% } else { %>
<a class="btn primary" href="${pageContext.request.contextPath}/community">커뮤니티로 이동 →</a>
<% } %>
<a class="btn secondary" href="${pageContext.request.contextPath}/community/write">다른 이야기 작성</a>
</div>
</main>
<%@ include file="../fragments/footer.jspf" %>