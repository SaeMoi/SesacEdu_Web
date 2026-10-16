<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>

<%-- 강의 제목은 상세 API 조회 후 JavaScript에서 갱신합니다. --%>
<% String pageTitle = "강의 상세"; %>
<%@ include file="../fragments/head.jspf" %>

<main id="main" class="wrap detail-page" data-lecture-detail>

  <!-- API 요청의 로딩 상태와 오류 메시지를 표시합니다. -->
  <p id="detail-status" class="screen-note" role="status">
    강의 정보를 불러오는 중입니다.
  </p>

  <button
    id="retry-detail"
    class="btn secondary"
    type="button"
    hidden
  >
    다시 불러오기
  </button>

  <!-- 강의 정보를 받은 후 JavaScript가 hidden을 해제합니다. -->
  <div id="detail-content" hidden>

    <section class="detail-banner">
      <div>
        <!-- category와 level을 표시합니다. -->
        <p id="detail-category-level" class="eyebrow"></p>

        <!-- name: 강의 이름 / summary: 강의 요약 -->
        <h1 id="detail-name"></h1>
        <p id="detail-summary" class="banner-copy"></p>

        <div class="banner-tags">
          <span id="detail-level" class="pill"></span>
          <span id="detail-instructor-name"></span>
        </div>
      </div>

      <div class="hero-preview">
        <!-- 현재 상세 응답에는 이미지가 없어 공통 장식 이미지를 사용합니다. -->
        <img
          id="detail-picture"
          data-fallback="${pageContext.request.contextPath}/design/course-hero.png"
          src="${pageContext.request.contextPath}/design/course-hero.png"
          alt=""
        >
        <button type="button" data-preview-video aria-controls="video-preview">
          <span>강의 미리보기</span><span aria-hidden="true">▷</span>
        </button>
      </div>
    </section>

    <!-- 기존 app.js의 탭 전환 기능이 사용하는 속성을 유지합니다. -->
    <nav class="detail-tabs" aria-label="강의 상세">
      <button
        type="button"
        data-tab="intro"
        class="active"
        aria-pressed="true"
      >
        강의 소개
      </button>

      <button type="button" data-tab="teacher" aria-pressed="false">
        강사
      </button>

      <button type="button" data-tab="reviews" aria-pressed="false">
        수강평
      </button>

      <button type="button" data-tab="news" aria-pressed="false">
        새소식
      </button>
    </nav>

    <div class="detail-columns">
      <div>

        <section data-panel="intro">
          <h2>이 강의에서 배우는 내용</h2>

          <!-- intro 배열을 JavaScript가 li 요소로 만들어 추가합니다. -->
          <ul id="detail-intro" class="learning-list"></ul>

          <div id="video-preview" class="video-preview" hidden>
            <video id="detail-preview-video" controls playsinline preload="none"
              aria-label="강의 미리보기" hidden></video>
            <div id="preview-placeholder">
              <button id="play-detail-preview" type="button" class="play-button"
                aria-label="미리보기 영상 재생">▷</button>
              <h3 id="preview-title">강의 소개</h3>
              <p id="preview-message" role="status"></p>
            </div>
          </div>
        </section>

        <section data-panel="teacher" hidden>
          <h2 id="teacher-heading">강사 소개</h2>

          <div class="teacher-profile">
            <span id="teacher-avatar" class="avatar"></span>

            <div>
              <!-- instructor.iname / instructor.field -->
              <strong id="teacher-name"></strong>
              <p id="teacher-field"></p>
            </div>
          </div>

          <!-- 값이 없는 소개 문구는 JavaScript에서 숨긴 상태를 유지합니다. -->


          <!-- instructor.bio / instructor.career -->
          <p id="teacher-bio" class="body-copy"></p>
          <p id="teacher-career" class="body-copy"></p>
          <section class="teacher-other-section">
            <h2>강사의 다른 강의</h2>
            <p id="teacher-other-description" class="body-copy"></p>
            <div id="teacher-other-courses" class="course-grid"></div>
            <p id="teacher-other-empty" class="screen-note" hidden>등록된 다른 강의가 없습니다.</p>
          </section>
        </section>

        <section data-panel="reviews" hidden>
          <h2>먼저 배운 사람들의 이야기</h2>

          <!-- 상세 응답의 rating과 reviewCount를 표시합니다. -->
          <p id="detail-review-summary" class="body-copy"></p>

          <p class="screen-note">
            수강평 내용은 별도 조회 기능을 연결한 후 표시됩니다.
          </p>
        </section>

        <section data-panel="news" hidden>
          <h2>강의의 새로운 소식</h2>

          <!-- 새소식 API 연결 전의 빈 화면입니다. 조회 결과와 오류는 추후 분리합니다. -->
          <div class="course-news-empty">
            <h3>새 소식이 등록되면 알려드릴게요.</h3>
            <p>아직 등록된 새소식이 없습니다.</p>
          </div>
        </section>

      </div>

      <aside class="purchase-card">
        <span id="purchase-level" class="pill"></span>
        <h3 id="purchase-name"></h3>
        <h2 id="purchase-price"></h2>

        <!-- 조회한 사용자 상태에 맞춰 JavaScript가 표시 여부를 결정합니다. -->
        <button
          type="button"
          class="btn primary full"
          id="open-purchase"
          hidden
        >
          수강권 구매 <span aria-hidden="true">→</span>
        </button>

        <p id="purchase-status" class="screen-note"></p>

        <dl>
          <div>
            <dt>난이도</dt>
            <dd id="purchase-difficulty"></dd>
          </div>

          <div>
            <dt>학습 분야</dt>
            <dd id="purchase-category"></dd>
          </div>
        </dl>
      </aside>
    </div>

  </div>
</main>

<!-- 기존 구매 안내 모달의 열기·닫기 기능을 유지합니다. -->
<dialog
  class="purchase-dialog"
  id="purchase-dialog"
  aria-labelledby="purchase-title"
>
  <button
    type="button"
    class="close-dialog"
    data-close-dialog
    aria-label="구매 안내 닫기"
  >
    ×
  </button>

  <span class="pill">구매 안내</span>
  <h2 id="purchase-title">로그인 후 이용해 주세요.</h2>
  <p>로그인·결제 연결은 현재 준비 중입니다.</p>

  <!-- JavaScript에서 검증한 강의 ID를 로그인 링크에 추가합니다. -->
  <a
    id="detail-login-link"
    class="btn primary"
    href="${pageContext.request.contextPath}/login"
  >
    로그인 →
  </a>

  <p class="purchase-signup">
    처음 오셨나요?
    <a href="${pageContext.request.contextPath}/signup">회원가입</a>
  </p>

  <button type="button" class="back-detail" data-close-dialog>
    강의 상세로 돌아가기
  </button>
</dialog>

<%@ include file="../fragments/footer.jspf" %>