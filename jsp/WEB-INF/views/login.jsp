<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="로그인"; %>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="login-page auth-page">
<h1>로그인</h1>
<p class="auth-description">이메일로 간편하게 로그인하세요.</p>
<form novalidate id="login-form">
<fieldset disabled data-enable>
<label for="email">이메일</label>
<input id="email" name="email" type="email" autocomplete="username" placeholder="이메일을 입력해 주세요">
<label for="pw">비밀번호</label>
<input id="pw" name="pw" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요">
<p id="login-error" class="error" role="alert" hidden>이메일 또는 비밀번호를 확인해 주세요.</p>
<button class="btn primary full" type="submit">로그인</button>
</fieldset>
<p class="form-status" role="status">
</p>
</form>
<div class="login-signup">
<span>새싹에듀가 처음인가요?</span>
<a href="${pageContext.request.contextPath}/signup">회원가입</a>
</div>


</main>
<%@ include file="../fragments/footer.jspf" %>