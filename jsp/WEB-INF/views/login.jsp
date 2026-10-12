<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="로그인"; %>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="login-page auth-page">
<h1>로그인</h1>
<p class="auth-description">이메일로 간편하게 로그인하세요.</p>
<form id="login-form">
<fieldset disabled data-enable>
<label for="email">이메일</label>
<input id="email" name="email" type="email" autocomplete="username" placeholder="이메일을 입력해 주세요" required>
<label for="pw">비밀번호</label>
<input id="pw" name="pw" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요" required>
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
<p class="screen-note">구매 중 진입한 경우 로그인 후 선택한 강의의 구매 단계로 복귀합니다.</p>
<details class="demo-controls">
<summary>화면 상태 확인</summary>
<button id="show-login-error" type="button">로그인 오류 화면</button>
<p>실제 인증 서버 연결 전입니다. 입력값은 전송·저장하지 않습니다.</p>
</details>
</main>
<%@ include file="../fragments/footer.jspf" %>