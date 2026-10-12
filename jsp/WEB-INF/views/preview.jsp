<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%@ include file="../fragments/data.jspf" %>
<% // ID는 예시 데이터에서 조회하고, 존재하지 않는 강의는 404로 처리합니다.
String[] previewCourse=null;String previewId=request.getParameter("id");
for(String[] item:courses){if(item[0].equals(previewId))previewCourse=item;}
if(previewCourse==null){response.sendError(404);return;}
String pageTitle=previewCourse[1]+" · 30초 미리보기";
%>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="wrap classroom" data-course-preview>
<p class="eyebrow">MY CLASSROOM · PREVIEW</p>
<h1><%=previewCourse[1]%></h1>
<p class="screen-note">처음 30초 미리보기 · 이후 영상과 학습 기능은 잠겨 있습니다.</p>
<div class="classroom-grid"><div>
<div class="lesson-video preview-player">
<%-- TODO(media): 서버가 제공하는 30초 전용 영상만 video에 연결합니다.
     전체 원본 URL을 넣고 JS로 정지시키는 방법은 접근 통제가 아닙니다. --%>
<video id="preview-video" controls playsinline preload="metadata" aria-label="30초 강의 미리보기" hidden></video>
<div id="preview-demo" class="video-center">
<span class="pill">영상 연결 전 · 화면 시연</span>
<h2><%=previewCourse[1]%></h2>
<p>실제 영상 대신 30초 재생·잠금 흐름을 확인할 수 있어요.</p>
<button type="button" class="btn primary" id="preview-demo-toggle">30초 흐름 시연 시작</button>
</div>
<div id="preview-lock" class="preview-lock" hidden>
<span class="preview-lock-icon" aria-hidden="true">🔒</span>
<h2 id="preview-lock-title" tabindex="-1">이어서 학습하려면 수강권이 필요해요.</h2>
<p>미리보기는 처음 30초까지 제공됩니다.</p>
<div class="preview-lock-actions">
<a class="btn primary" href="${pageContext.request.contextPath}/courses/detail?id=<%=previewCourse[0]%>">수강권 확인</a>
<a class="btn secondary" href="${pageContext.request.contextPath}/login?course=<%=previewCourse[0]%>">로그인</a>
<button type="button" class="btn secondary" id="preview-replay">미리보기 다시 보기</button>
</div>
</div>
<div class="video-controls"><div class="progress"><span id="preview-progress" style="width:0%"></span></div><div><span id="preview-time">00:00 / 00:30</span><span>30초 이후 🔒</span></div></div>
</div>
<p id="preview-status" class="form-status" role="status">실제 영상은 아직 연결되지 않았습니다.</p>
<nav class="lesson-actions" aria-label="잠긴 학습 메뉴">
<button type="button" class="btn secondary" data-preview-locked>🔒 과제</button>
<button type="button" class="btn secondary" data-preview-locked>🔒 강의자료</button>
<button type="button" class="btn secondary" data-preview-locked>🔒 질문·답변</button>
</nav>
<section class="lesson-intro"><h2>차근차근, 첫걸음부터.</h2><p><%=previewCourse[10]%></p></section>
</div><aside class="lesson-outline">
<h2>강의 목차</h2><p>미리보기 이후의 내용은 수강권 확인 후 열립니다.</p>
<button type="button" class="chapter active" id="preview-first"><strong>00:00</strong><span>강의 소개 · 30초 미리보기</span></button>
<% for(String chapter:new String[]{"핵심 개념 이해하기","예시와 실습","정리와 과제 안내"}){ %>
<button type="button" class="chapter" data-preview-locked><strong>🔒</strong><span><%=chapter%></span></button>
<% } %>
<div class="outline-footer"><span>미리보기 30초</span><span>이후 잠금</span></div>
</aside></div>
</main>
<script type="module" src="${pageContext.request.contextPath}/assets/preview.js?v=1"></script>
<%@ include file="../fragments/footer.jspf" %>
