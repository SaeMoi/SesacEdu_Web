<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%String pageTitle="글 작성";%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="post-page">
<p class="eyebrow">SHARE YOUR STORY</p>
<div class="section-heading">
<h1>어떤 이야기를 나눠볼까요?</h1>
<span class="muted">커뮤니티 · 글쓰기</span>
</div>
<p class="write-description">작은 질문과 경험도 좋아요. 편하게 들려주세요.</p>
<form id="post-form">
<fieldset disabled data-enable>
<label for="post-category">카테고리</label>
<select id="post-category" required>
<option>스터디</option>
<option>수강평</option>
<option>팀 프로젝트</option>
<option>질문·답변</option>
</select>
<label class="sr-only" for="post-title">제목</label>
<input class="post-title-input" id="post-title" required maxlength="100" placeholder="제목을 입력해 주세요" value="웹 보안 기초를 함께 공부해요">
<div class="editor-toolbar" aria-label="본문 서식">
<span>본문</span>
<button type="button" data-format="bold" aria-label="굵게">B</button>
<button type="button" data-format="italic" aria-label="기울임">I</button>
<button type="button" data-format="list">목록</button>
<button type="button" data-format="link">링크</button>
</div>
<label class="sr-only" for="post-body">본문</label>
<textarea id="post-body" required maxlength="5000" rows="9" placeholder="함께 학습할 주제와 진행 방법을 적어주세요.&#10;&#10;예시: 인증과 접근 권한을 학습하고 내용을 함께 정리해요.">
</textarea>
<div class="form-actions">
<a class="btn secondary" href="${pageContext.request.contextPath}/community">취소</a>
<button class="btn primary" type="submit">등록하기　♢</button>
</div>
</fieldset>
</form>
<p class="screen-note">분류·제목·본문을 필수로 입력하는 설계안입니다. 실제 게시글을 전송하지 않는 화면 예시입니다.</p>
</main>
<%@ include file="../fragments/footer.jspf" %>