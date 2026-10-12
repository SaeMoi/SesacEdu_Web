<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%String pageTitle="작성 화면 확인";%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="post-done">
<span class="done-check">✓</span>
<h1>이야기를 나눠주셔서 고마워요.</h1>
<p>등록 완료 화면 미리보기입니다. 실제 게시글은 저장하지 않았어요.</p>
<div>
<a class="btn primary" href="${pageContext.request.contextPath}/community">커뮤니티로 이동 →</a>
<a class="btn secondary" href="${pageContext.request.contextPath}/community/write">다른 이야기 작성</a>
</div>
</main>
<%@ include file="../fragments/footer.jspf" %>