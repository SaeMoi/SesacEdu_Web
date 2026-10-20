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
<%-- 값은 POST /forum/posts의 category입니다. 수강평은 내 학습 화면에서 작성합니다. --%>
<option value="STUDY">스터디</option>
<option value="PROJECT">팀 프로젝트</option>
<option value="QUESTION">질문·답변</option>
</select>
<label class="sr-only" for="post-title">제목</label>
<input class="post-title-input" id="post-title" required maxlength="200" placeholder="제목을 입력해 주세요">
<div class="editor-toolbar" aria-label="본문 서식">
<span>본문</span>
<button type="button" data-format="bold" aria-label="굵게" aria-pressed="false"><b>B</b></button>
<button type="button" data-format="italic" aria-label="기울임" aria-pressed="false"><i>I</i></button>
<button type="button" data-format="list" aria-pressed="false">목록</button>
<button type="button" data-format="link">링크</button>
</div>
<%-- 버튼을 누르면 서식이 바로 보이는 편집 영역입니다. 등록 시 HTML을 보내고 서버가 허용 태그만 남깁니다. --%>
<span class="sr-only" id="post-body-label">본문</span>
<div class="post-editor" id="post-body" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="post-body-label"
 data-placeholder="함께 학습할 주제와 진행 방법을 적어주세요. 예시: 인증과 접근 권한을 학습하고 내용을 함께 정리해요."></div>
<p class="field-status" id="post-write-status" role="status" aria-live="polite"></p>
<div class="form-actions">
<a class="btn secondary" href="${pageContext.request.contextPath}/community">취소</a>
<button class="btn primary" type="submit">등록하기　♢</button>
</div>
</fieldset>
</form>
<p class="screen-note">로그인한 회원만 글을 등록할 수 있어요. 글자를 선택한 뒤 굵게·기울임·목록·링크 버튼을 누르면 바로 적용돼요.</p>
</main>
<%@ include file="../fragments/footer.jspf" %>