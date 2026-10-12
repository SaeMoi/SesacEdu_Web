<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%@ include file="../fragments/data.jspf" %>
<% String[] selected=null; String id=request.getParameter("id"); if(id==null)id="web"; for(String[] item:courses){if(item[0].equals(id))selected=item;} if(selected==null){response.sendError(404);return;} String pageTitle=selected[1]; %>
<%@ include file="../fragments/head.jspf" %>
<main id="main" class="wrap detail-page">
<section class="detail-banner">
<div>
<p class="eyebrow"><%=selected[8]%> / <%=selected[9]%></p>
<h1>
<%=id.equals("web") ? "웹 보안, 처음부터<br>제대로 배워요." : selected[2]%>
</h1>
<p class="banner-copy"><%=selected[10]%></p>
<div class="banner-tags">
<span class="pill"><%=selected[9]%></span>
<span>4개 레슨</span>
<span>예시 강사</span>
</div>
</div>
<div class="hero-preview">
<img src="${pageContext.request.contextPath}/design/course-hero.png" alt="새싹과 노트북을 표현한 강의 이미지">
<button data-preview-video>강의 미리보기 <span>▷</span>
</button>
</div>
</section>
<nav class="detail-tabs" aria-label="강의 상세">
<button data-tab="intro" class="active" aria-pressed="true">강의 소개</button>
<button data-tab="teacher" aria-pressed="false">강사</button>
<button data-tab="reviews" aria-pressed="false">수강평</button>
<button data-tab="news" aria-pressed="false">새소식</button>
</nav>
<div class="detail-columns">
<div>
<section data-panel="intro">
<h2>이 강의에서 배우는 내용</h2>
<ul class="learning-list">
<li><%=selected[10]%></li>
<li><%=selected[1]%>의 주요 개념을 예시로 살펴봐요.</li>
<li>강의 자료와 과제로 배운 내용을 정리해요.</li>
</ul>
<div class="video-preview" id="video-preview" hidden>
<button class="play-button" data-video-note aria-label="미리보기 영상 재생">▷</button>
<strong><%=selected[1]%> · 강의 소개</strong>
<p class="video-status" role="status">
</p>
</div>
<nav class="small-links" aria-label="학습 화면 이동">
<%-- TODO(auth): 로그인 서버 연결 전 화면 확인을 위한 임시 진입 링크입니다.
     인증 연동 시 이 링크를 제거하고, 로그인 확인 후 정식 학습 경로를 제공합니다.
     /qna, /assignments, /chatbot 및 영상·자료 API의 접근 권한은 서버에서 검사해야 합니다. --%>
<a href="${pageContext.request.contextPath}/qna" data-preview-classroom-link>강의상세 →</a>
</nav>
</section>
<section data-panel="teacher" hidden>
<h2>어려운 개념을, 이해하기 쉽게.</h2>
<div class="teacher-profile">
<span class="avatar">H</span>
<div>
<strong>예시 강사</strong>
<p><%=selected[8]%></p>
</div>
</div>
<p class="body-copy"><%=selected[10]%><br>기초 개념부터 실습까지, 자신의 속도로 배울 수 있도록 안내해요.</p>
</section>
<section data-panel="reviews" hidden>
<h2>먼저 배운 사람들의 이야기</h2>
<div class="empty-state">
<span class="empty-icon">▣</span>
<h3>첫 번째 학습 경험을 들려주세요.</h3>
<p>아직 등록된 수강평이 없습니다.</p>
</div>
</section>
<section data-panel="news" hidden>
<h2>강의의 새로운 소식</h2>
<div class="empty-state">
<span class="empty-icon">▤</span>
<h3>새소식이 등록되면 알려드릴게요.</h3>
<p>아직 등록된 새소식이 없습니다.</p>
</div>
</section>
</div>
<aside class="purchase-card">
<span class="pill"><%=selected[9]%> 과정</span>
<h3>
<%=selected[1]%>
</h3>
<h2>
<%=selected[3]%>원</h2>
<p>예시 가격 · 일시불</p>
<button class="btn primary full" id="open-purchase">수강권 구매 <span>→</span>
</button>
<dl>
<div>
<dt>레슨 수</dt>
<dd>4개</dd>
</div>
<div>
<dt>난이도</dt>
<dd><%=selected[9]%></dd>
</div>
<div>
<dt>학습 분야</dt>
<dd><%=selected[8]%></dd>
</div>
</dl>
</aside>
</div>
<p class="screen-note">강의 정보·가격·게시글은 화면 예시입니다. 강의 상세는 비로그인 상태에서도 공개됩니다.</p>
</main>
<dialog class="purchase-dialog" id="purchase-dialog" aria-labelledby="purchase-title">
<button class="close-dialog" data-close-dialog aria-label="구매 안내 닫기">×</button>
<span class="pill">구매 계속하기</span>
<h2 id="purchase-title">로그인하고<br>배움을 시작해 보세요.</h2>
<p>선택한 강의는 그대로 유지돼요.<br>로그인 후 구매를 이어갈 수 있습니다.</p>
<a class="btn primary" href="${pageContext.request.contextPath}/login?course=<%=id%>">로그인 →</a>
<p class="purchase-signup">처음 오셨나요? <a href="${pageContext.request.contextPath}/signup">회원가입</a>
</p>
<button class="back-detail" data-close-dialog>강의 상세로 돌아가기</button>
</dialog>
<%@ include file="../fragments/footer.jspf" %>