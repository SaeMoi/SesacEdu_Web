<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% String pageTitle="강의 목록"; %>
<%@ include file="../fragments/head.jspf" %>
<%@ include file="../fragments/data.jspf" %>
<main id="main" class="wrap catalog" data-catalog>
<nav class="category-tabs" aria-label="강의 분야">
<% for(String c:new String[]{"전체","웹 보안","네트워크","개발 기초","로그 분석","클라우드"}){ %>
<button data-category="<%=c%>" aria-pressed="<%=c.equals("웹 보안")%>">
<%=c%>
</button>
<% } %>
</nav>
<div class="catalog-heading">
<div>
<p class="eyebrow">EXPLORE COURSES</p>
<h1 id="catalog-title">웹 보안 강의</h1>
<p>처음이라도 괜찮아요. 필요한 개념부터 하나씩 배워보세요.</p>
</div>
<label class="search-box">
<input id="course-search" type="search" placeholder="강의 검색" aria-label="강의 검색">
<span aria-hidden="true">⌕</span>
</label>
</div>
<div class="catalog-controls">
<p role="status">
<strong id="course-count">6</strong>개의 강의</p>
<div>
<select id="level-filter" aria-label="난이도">
<option value="all">난이도⌄</option value="입문">입문</option>
<option value="초급">초급</option>
</select>
<select id="sort-filter" aria-label="정렬">
<option value="default">최신순⌄</option>
<option value="low">낮은 가격순</option>
<option value="high">높은 가격순</option>
</select>
</div>
</div>
<div class="course-grid">
<%@ include file="../fragments/cards.jspf" %>
</div>
<section id="course-empty" class="empty-state" hidden>
<h2>아직 등록된 강의가 없어요.</h2>
<p>다른 분야를 선택하거나 검색어를 바꿔보세요.</p>
<button class="btn secondary" id="reset-courses">전체 강의 보기</button>
</section>
<p class="screen-note">강의 데이터는 예시입니다.</p>
</main>
<%@ include file="../fragments/footer.jspf" %>