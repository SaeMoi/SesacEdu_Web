<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="회원가입"; %>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="signup-page auth-page">
<h1>새싹에듀 회원가입</h1>
<p class="auth-description">새로운 배움을 시작할 준비, 함께해요.</p>
<form id="signup-form">
<fieldset disabled data-enable>
<label for="email">이메일</label>
<div class="input-action">
<input id="email" name="email" type="email" autocomplete="email" placeholder="이메일을 입력해 주세요" required>
<button class="btn primary" id="check-email" type="button">이메일 확인</button>
</div>
<p id="email-status" class="field-status" role="status">
</p>
<div id="verification" hidden>
<label for="code">인증번호</label>
<div class="input-action">
<input id="code" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="이메일로 받은 인증번호 입력">
<button class="btn dark" id="verify-code" type="button">인증하기</button>
</div>
<p id="code-status" class="field-status" role="status">
</p>
<p class="resend">인증 메일을 받지 못하셨나요? <button type="button" id="resend-code">다시 보내기</button>
</p>
</div>
<label for="pw">비밀번호</label>
<input id="pw" name="pw" type="password" autocomplete="new-password" placeholder="비밀번호를 입력해 주세요" required>
<label for="pwcheck">비밀번호 확인</label>
<input id="pwcheck" name="pwcheck" type="password" autocomplete="new-password" placeholder="비밀번호를 다시 입력해 주세요" required>
<p id="password-error" class="error" hidden>비밀번호가 일치하지 않습니다.</p>
<label for="name">이름</label>
<input id="name" name="name" autocomplete="name" placeholder="이름을 입력해 주세요" required>
<label for="nickname">닉네임</label>
<input id="nickname" name="nickname" placeholder="닉네임을 입력해 주세요" required>
<label for="birthday">생년월일</label>
<input id="birthday" name="b_date" placeholder="YYYY.MM.DD" inputmode="numeric" pattern="[0-9]{4}\.[0-9]{2}\.[0-9]{2}" required>
<label for="phone">휴대전화</label>
<input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="010-0000-0000" required>
<label for="address">주소</label>
<input id="address" name="address" autocomplete="street-address" placeholder="주소를 입력해 주세요" required>
<button class="btn primary full" id="signup-submit" type="submit" disabled>회원가입</button>
</fieldset>
<p class="signup-help">이메일 인증과 모든 항목 입력 후 가입할 수 있어요.</p>
<p class="form-status" role="status">
</p>
</form>
<div class="signup-login">이미 계정이 있으신가요? <a href="${pageContext.request.contextPath}/login">로그인</a>
</div>
<details class="demo-controls">
<summary>화면 상태 확인</summary>
<p>메일은 발송하지 않습니다. 미리보기 인증번호는 123456입니다.</p>
<button type="button" id="duplicate-email">이메일 중복 상태</button>
</details>
</main>
<%@ include file="../fragments/footer.jspf" %>