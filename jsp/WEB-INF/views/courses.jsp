<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="강의 목록"; %>
<%@ include file="../fragments/head.jspf" %>

<main id="main" class="wrap catalog" data-catalog>
<nav class="category-tabs" aria-label="강의 분야">
<% for(String c:new String[]{"전체","웹 보안","네트워크","개발 기초","로그 분석","클라우드"}){ %>
<button data-category="<%=c%>" aria-pressed="<%=c.equals("전체")%>">
<%=c%>
</button>
<% } %>
</nav>
<div class="catalog-heading">
<div>
<p class="eyebrow">EXPLORE COURSES</p>
<h1 id="catalog-title">전체 강의</h1>
<p>처음이라도 괜찮아요. 필요한 개념부터 하나씩 배워보세요.</p>
</div>
<label class="search-box">
<input id="course-search" type="search" placeholder="강의 검색" aria-label="강의 검색">
<span aria-hidden="true">⌕</span>
</label>
</div>
<div class="catalog-controls">
<p role="status">
<strong id="course-count">0</strong>개의 강의</p>
<div>
<select id="level-filter" aria-label="난이도">
<option value="all">모든 난이도</option>
<option value="입문">입문</option>
<option value="초급">초급</option>
<option value="중급">중급</option>
</select>
<select id="sort-filter" aria-label="정렬">
<option value="default">기본순</option>
<option value="low">낮은 가격순</option>
<option value="high">높은 가격순</option>
</select>
</div>
</div>
<!-- api에서 받은 강의 데이터를 JavaScript로 이 영역에 표시합니다.-->
<div id="course-grid" class="course-grid" aria-busy="true">
</div>
<nav id="course-pagination" class="course-pagination" aria-label="강의 목록 페이지"></nav>
<p id="course-page-status" class="screen-note" role="status"></p>
<section id="course-empty" class="empty-state" hidden>
<h2>아직 등록된 강의가 없어요.</h2>
<p>다른 분야를 선택하거나 검색어를 바꿔보세요.</p>
<button class="btn secondary" id="reset-courses">전체 강의 보기</button>
</section>
<!-- 로딩 상태와 api 요청 실패 메시지를 표시합니다.-->
 <p id="course-api-status" class="screen-note" role="status">
    강의 목록을 불러오는 중입니다.
 </p>
 <button id="retry-courses" class="btn secondary" type="button" hidden>
    다시 불러오기
 </button>
</main>
<%@ include file="../fragments/footer.jspf" %>