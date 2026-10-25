import {
  API_BASE_URL,
  authFetch,
  getSession,
  getStoredSession,
  mountHeader,
  saveSession,
} from "../ui/header.js";

// JSP 본문을 유지한 채 공통 헤더만 React로 연결합니다.
const header = document.getElementById("shared-header");
if (header) mountHeader(header);
// 설계안에 사용한 방패·문서·책 아이콘. 서버 문자열을 HTML로 넣지 않습니다.
function courseLineIcon(index) {
  const paths = [
    "M24 3 43 11v12c0 11-19 21-19 21S5 34 5 23V11Z M14 23l7 7 13-15",
    "M11 3h17l11 11v30H11Z M28 3v12h11 M16 24h16 M16 33h16",
    "M24 9c-6-6-12-4-20-4v33c8 0 14-2 20 5 6-7 12-5 20-5V5c-8 0-14-2-20 4Z M24 9v34",
  ];
  const icon = document.createElement("span");
  icon.className = "line-icon";
  icon.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.2");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[index % paths.length]);
  svg.append(path);
  icon.append(svg);
  return icon;
}
const byId = (id) => document.getElementById(id);
const all = (selector) => [...document.querySelectorAll(selector)];
const on = (id, event, callback) => byId(id)?.addEventListener(event, callback);
// 회원가입: 이메일 발송 → 인증 확인 → 계정 생성
if (byId("signup-form")) {
  const form = byId("signup-form");
  const status = form.querySelector(".form-status");
  const email = byId("email");
  let verificationToken = "";
  let busy = false;

  const emailValue = () => email.value.trim().toLowerCase();

  const message = (element, text, error = false) => {
    element.textContent = text;
    element.classList.toggle("error", error);
  };

  const update = () => {
    byId("pwcheck").setCustomValidity("");
    byId("password-error").hidden = true;

    byId("signup-submit").disabled = busy;

    for (const id of ["check-email", "resend-code", "verify-code"]) {
      byId(id).disabled = busy;
    }
    email.readOnly = busy;
  };

  const resetVerification = () => {
    verificationToken = "";
  };

  const post = async (url, payload, expectedCode) => {
    let response;
    try {
      response = await fetch(`/backend${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.code !== expectedCode) {
      const errors = data?.result?.errors;
      const details = Array.isArray(errors)
        ? errors.map((item) => item.reason).filter(Boolean).join(" ")
        : "";
      const retryAfter = Number(data?.result?.retryAfter);
      const retryMessage = retryAfter > 0
        ? ` ${retryAfter}초 후 다시 시도해 주세요.`
        : "";

      const error = new Error(
        (details || data?.message || `요청에 실패했습니다. (${response.status})`) +
        retryMessage,
      );
      error.code = data?.code;
      throw error;
    }
    return data.result;
  };

  const requestCode = async () => {
    email.value = emailValue();
    if (busy) return;

    busy = true;
    resetVerification();
    byId("verification").hidden = true;
    byId("code").value = "";
    message(status, "");
    message(byId("code-status"), "");
    message(byId("email-status"), "인증번호를 발송하고 있습니다.");
    update();

    try {
      await post("/email-auth", { email: emailValue() }, "EMAIL_SENT");
      byId("verification").hidden = false;
      message(
        byId("email-status"),
        "인증번호를 발송했습니다. 이메일을 확인해 주세요.",
      );
      message(byId("code-status"), "인증번호는 5분 동안 유효합니다.");
      byId("code").focus();
    } catch (error) {
      message(byId("email-status"), error.message, true);
    } finally {
      busy = false;
      update();
    }
  };

  on("check-email", "click", requestCode);
  on("resend-code", "click", requestCode);

  on("verify-code", "click", async () => {
    if (busy) return;
    const code = byId("code").value.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      message(byId("code-status"), "인증번호 6자리를 입력해 주세요.", true);
      return;
    }

    busy = true;
    resetVerification();
    message(byId("code-status"), "인증번호를 확인하고 있습니다.");
    update();

    try {
      const result = await post(
        "/email-auth/verify",
        { email: emailValue(), code },
        "EMAIL_VERIFIED",
      );
      if (!result?.verificationToken) {
        throw new Error("인증 응답을 확인할 수 없습니다. 다시 인증해 주세요.");
      }
      verificationToken = result.verificationToken;
      message(byId("code-status"), "이메일 인증이 완료되었습니다.");
    } catch (error) {
      message(byId("code-status"), error.message, true);
    } finally {
      busy = false;
      update();
    }
  });

  on("email", "input", () => {
    resetVerification();
    byId("verification").hidden = true;
    byId("code").value = "";
    message(byId("email-status"), "");
    message(byId("code-status"), "");
    message(status, "");
    update();
  });

  form.addEventListener("input", update);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    update();


    const payload = {
      email: emailValue(),
      verificationToken,
      pw: byId("pw").value,
      pwcheck: byId("pwcheck").value,
      name: byId("name").value.trim(),
      nickname: byId("nickname").value.trim(),
      phone: byId("phone").value.trim().replace(/[-\s]/g, ""),
      b_date: byId("birthday").value.trim().replace(/\./g, "-"),
      address: byId("address").value.trim(),
    };

    busy = true;
    update();
    message(status, "회원가입을 처리하고 있습니다.");

    try {
      await post("/signup", payload, "SIGNUP_SUCCESS");
      resetVerification();
      byId("pw").value = "";
      byId("pwcheck").value = "";
      message(status, "회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
      window.location.assign(
        document.querySelector(".signup-login a").href,
      );
    } catch (error) {
      if (error.code === "INVALID_VERIFICATION") {
        resetVerification();
        message(
          byId("code-status"),
          "인증이 만료되었습니다. 인증번호를 다시 요청해 주세요.",
          true,
        );
      }
      message(status, error.message, true);
    } finally {
      busy = false;
      update();
    }
  });

  update();
}

// 카테고리·검색·정렬은 JSP에서 출력한 예시 카드에 적용합니다.
// 현재는 예시 데이터를 브라우저에서 필터링한 뒤 페이지당 6개씩 표시합니다.
// API 연결 시 검색/정렬/페이지 조건을 서버에 보내고 전체 결과 수를 받습니다.

// 강의 목록: 검색·필터·정렬·페이지 조건을 백엔드에 전달합니다.
if (byId("course-search")) {
  const grid = byId("course-grid");
  const search = byId("course-search");
  const level = byId("level-filter");
  const sort = byId("sort-filter");
  const pagination = byId("course-pagination");
  const status = byId("course-api-status");
  const retry = byId("retry-courses");
  const chips = all(".category-tabs [data-category]");

  const initial = new URLSearchParams(location.search);
  const initialCategory = initial.get("category");

  let category = chips.some(
    (button) => button.dataset.category === initialCategory,
  ) ? initialCategory : "전체";

  let page = 1;
  let activeRequest = null;
  const pageSize = 6;

  search.value = initial.get("q") || "";

  // 화면의 정렬 선택값을 백엔드에서 받는 값으로 변환합니다.
  const sortValues = {
    default: "lid_desc",
    low: "price_asc",
    high: "price_desc",
  };

  // 서버의 문자열을 HTML로 해석하지 않고 글자로 표시합니다.
  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const makeCard = (lecture, index) => {
    // 클릭한 강의의 숫자 ID를 상세 페이지에 전달합니다.
    const card = makeElement("a", "course-card");
    card.dataset.courseId = String(lecture.lid);
    card.href = `/courses/detail?id=${encodeURIComponent(lecture.lid)}`;

    const colors = ["sage", "navy", "lavender"];
    const art = makeElement(
      "div",
      `course-art ${colors[index % colors.length]}`,
    );

    // 이미지가 없거나 로딩에 실패하면 제목 배경을 사용합니다.
    art.append(makeElement(
      "strong",
      "",
      lecture.headline || lecture.name,
    ));

    art.append(courseLineIcon(index));

    if (lecture.picture) {
      try {
        const imageUrl = new URL(lecture.picture, location.origin);

        if (["http:", "https:"].includes(imageUrl.protocol)) {
          const image = document.createElement("img");
          image.src = imageUrl.href;
          image.alt = "";
          image.loading = "lazy";
          image.style.cssText =
            "width:100%;height:100%;object-fit:cover;";

          image.addEventListener("load", () => {
            art.style.padding = "0";
            art.replaceChildren(image);
          }, { once: true });
        }
      } catch {
        // 올바르지 않은 이미지 주소면 제목 배경을 유지합니다.
      }
    }

    const price = makeElement("div", "course-price");
    price.append(makeElement(
      "strong",
      "",
      `${Number(lecture.price).toLocaleString("ko-KR")}원`,
    ));

    const arrow = makeElement("span", "", "→");
    arrow.setAttribute("aria-hidden", "true");
    price.append(arrow);

    card.append(
      art,
      makeElement("span", "pill", lecture.level ? `${lecture.level} 과정` : "난이도 미정"),
      makeElement("h3", "", lecture.name),
      makeElement(
        "p",
        "",
        lecture.instructor || "강사 미정",
      ),
      price,
    );

    return card;
  };

  const renderPagination = (pageInfo) => {
    pagination.replaceChildren();
    pagination.hidden = pageInfo.totalPages <= 1;

    const addButton = (label, target, disabled, current = false) => {
      const button = makeElement("button", "", label);
      button.type = "button";
      button.disabled = disabled;
      button.setAttribute(
        "aria-label",
        current ? `${target}페이지, 현재 페이지` : `${label} 페이지`,
      );

      if (current) button.setAttribute("aria-current", "page");

      button.addEventListener("click", () => {
        page = target;
        loadCourses(true);
      });

      pagination.append(button);
    };

    if (pageInfo.totalPages > 1) {
      addButton("이전", page - 1, page === 1);

      // 현재 페이지 주변의 번호를 최대 5개까지 표시합니다.
      const start = Math.max(
        1,
        Math.min(page - 2, pageInfo.totalPages - 4),
      );
      const end = Math.min(pageInfo.totalPages, start + 4);

      for (let number = start; number <= end; number += 1) {
        addButton(String(number), number, false, number === page);
      }

      addButton("다음", page + 1, page === pageInfo.totalPages);
    }
  };

  async function loadCourses(restoreFocus = false) {
    // 검색 조건이 바뀌면 이전 요청을 취소합니다.
    // 늦게 도착한 이전 결과가 최신 화면을 덮는 것을 막습니다.
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;

    const query = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sort: sortValues[sort.value] || "lid_desc",
    });

    const keyword = search.value.trim();
    if (keyword) query.set("keyword", keyword);
    if (category !== "전체") query.set("category", category);
    if (level.value !== "all") query.set("level", level.value);

    chips.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      );
    });

    byId("catalog-title").textContent = `${category} 강의`;
    grid.setAttribute("aria-busy", "true");
    grid.replaceChildren();
    pagination.replaceChildren();
    pagination.hidden = true;
    byId("course-empty").hidden = true;
    byId("course-count").textContent = "…";
    byId("course-page-status").textContent = "";
    status.textContent = "강의 목록을 불러오는 중입니다.";
    retry.hidden = true;

      try {
      const response = await fetch(
        `/backend/lectures?${query.toString()}`,
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      );



      if (!response.ok) {
        throw new Error(`서버 응답 오류: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.lectures) || !data.page) {
        throw new Error("강의 목록 응답 형식이 올바르지 않습니다.");
      }

      if (controller.signal.aborted) return;

      // 전체 개수와 페이지 정보는 서버가 계산한 값을 사용합니다.
      page = data.page.current;
      byId("course-count").textContent = String(data.page.total);

      grid.replaceChildren(...data.lectures.map(makeCard));
      byId("course-empty").hidden = data.lectures.length !== 0;
      renderPagination(data.page);

      byId("course-page-status").textContent =
        data.lectures.length > 0
          ? `${page} / ${data.page.totalPages} 페이지 · 총 ${data.page.total}개`
          : "검색 결과가 없습니다.";

      status.textContent = "";

      if (restoreFocus) {
        pagination.querySelector('[aria-current="page"]')
          ?.focus({ preventScroll: true });
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      // 조회 실패를 '강의 0개'로 표시하지 않습니다.
      byId("course-count").textContent = "—";
      status.textContent =
        `강의 목록을 불러오지 못했습니다. ${error.message}`;
      retry.hidden = false;
    } finally {
      if (activeRequest === controller) {
        grid.setAttribute("aria-busy", "false");
      }
    }
  }

  // 검색 조건이 바뀌면 첫 페이지부터 다시 조회합니다.
  const resetPage = () => {
    page = 1;
    loadCourses();
  };

  chips.forEach((button) => {
    button.addEventListener("click", () => {
      category = button.dataset.category;
      resetPage();
    });
  });

  search.addEventListener("input", resetPage);
  level.addEventListener("change", resetPage);
  sort.addEventListener("change", resetPage);
  retry.addEventListener("click", () => loadCourses());

  on("reset-courses", "click", () => {
    category = "전체";
    search.value = "";
    level.value = "all";
    sort.value = "default";
    resetPage();
  });

  loadCourses();
}
// 상세 페이지에서만 실행합니다.
if (document.querySelector("[data-lecture-detail]")) {
  const content = byId("detail-content");
  const status = byId("detail-status");
  const retry = byId("retry-detail");
  const purchase = byId("open-purchase");

  // /courses/detail?id=1 에서 강의 ID를 읽습니다.
  const lectureId = new URLSearchParams(location.search).get("id");

  const setText = (id, value) => {
    // 서버의 문자열을 HTML이 아닌 일반 텍스트로 표시합니다.
    byId(id).textContent = value ?? "";
  };

  async function loadDetail() {
    content.hidden = true;
    purchase.hidden = true;
    retry.hidden = true;
    retry.disabled = true;
    status.textContent = "강의 정보를 불러오는 중입니다.";

    // 잘못된 ID로는 서버에 요청하지 않습니다.
    if (!lectureId || !/^[1-9]\d*$/.test(lectureId)) {
      status.textContent =
        "강의 주소가 올바르지 않습니다. 강의 목록에서 다시 선택해 주세요.";
      return;
    }

      try {
      const session = getStoredSession();
      const headers = { Accept: "application/json" };

      if (session?.authorization) {
        headers.Authorization = session?.authorization;
      }

      const response = await authFetch(
        `/backend/lectures/${encodeURIComponent(lectureId)}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (response.status === 404) {
        status.textContent = "존재하지 않거나 공개되지 않은 강의입니다.";
        return;
      }

      if (!response.ok) {
        throw new Error(`서버 응답 오류: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (
        !data ||
        String(data.lectureId) !== lectureId ||
        typeof data.name !== "string" ||
        !["guest", "member", "enrolled"].includes(data.viewerState) ||
        (
          data.viewerState !== "enrolled" &&
          typeof data.price !== "number"
        )
      ) {
        throw new Error("강의 상세 응답 형식이 올바르지 않습니다.");
      }


      // 상세 API에서 받은 강사 정보입니다. 없으면 빈 객체를 사용합니다.
      const teacher = data.instructor || {};

      // 수강 중인 사용자에게 기존 리뷰 작성 화면을 연결합니다.
      const reviewPanel = document.querySelector('[data-panel="reviews"]');
      if (reviewPanel) {
        let writeReviewLink = document.getElementById("course-review-write");
        if (!writeReviewLink) {
          writeReviewLink = document.createElement("a");
          writeReviewLink.id = "course-review-write";
          writeReviewLink.className = "btn secondary";
          writeReviewLink.textContent = "수강평 작성";
        }

        let reviewHeading = reviewPanel.querySelector(".course-review-heading");
        if (!reviewHeading) {
          const title = reviewPanel.querySelector("h2");
          reviewHeading = document.createElement("div");
          reviewHeading.className = "course-review-heading";
          title.before(reviewHeading);
          reviewHeading.append(title);
        }
        reviewHeading.append(writeReviewLink);

        writeReviewLink.href =
          `/mypage/learning/${encodeURIComponent(lectureId)}/review`;
        writeReviewLink.hidden = data.viewerState !== "enrolled";
      }

      // 상단 배너
      document.title = `${data.name} · 새싹에듀`;
      setText(
        "detail-category-level",
        [data.category, data.level].filter(Boolean).join(" / "),
      );
      setText("detail-name", data.headline?.trim() || data.name);
      const cover = byId("detail-picture");
      const defaultCover = cover.dataset.fallback;
      cover.onerror = () => {
        cover.onerror = null;
        cover.src = defaultCover;
      };
      cover.src = defaultCover;
      if (data.picture) {
        try {
          const url = new URL(data.picture, location.origin);
          if (["http:", "https:"].includes(url.protocol)) cover.src = url.href;
        } catch { /* 이미지 주소가 없으면 설계안의 기본 이미지를 유지합니다. */ }
      }
      byId("preview-title").textContent = `${data.name} · 강의 소개`;
      const preview = byId("detail-preview-video");
      preview.pause();
      preview.removeAttribute("src");
      preview.load();
      preview.hidden = true;
      byId("preview-placeholder").hidden = false;
      byId("preview-message").textContent = "";
      byId("play-detail-preview").disabled = !data.preview;
      byId("play-detail-preview").hidden = !data.preview;
      preview.dataset.available = String(Boolean(data.preview));
      if (!data.preview) {
        byId("preview-message").textContent = "등록된 미리보기 영상이 없습니다.";
      }
      setText("detail-summary", data.summary || data.headline || "");
      setText("detail-level", data.level);
      setText("detail-instructor-name", teacher.iname || "강사 정보 없음");

      // 강의 소개: 응답 배열을 목록으로 표시합니다.
      const intro = byId("detail-intro");
      intro.replaceChildren();

      const descriptions = Array.isArray(data.intro)
        ? data.intro.filter(
            (item) => typeof item === "string" && item.trim(),
          )
        : [];

      if (descriptions.length === 0) {
        descriptions.push(data.summary || "등록된 강의 소개가 없습니다.");
      }

      descriptions.forEach((description) => {
        const item = document.createElement("li");
        item.textContent = description;
        intro.append(item);
      });

      // 강사 소개
      const teacherName = teacher.iname || "강사 정보 없음";
      setText("teacher-name", teacherName);
      setText("teacher-avatar", teacher.iname ? teacher.iname.slice(0, 1) : "?");
      setText("teacher-field", teacher.field);
      setText("teacher-bio", teacher.bio || "등록된 강사 소개가 없습니다.");
      setText("teacher-career", teacher.career);

      setText("teacher-heading", teacher.catchphrase || "강사 소개");
      const others = byId("teacher-other-courses");
      others.replaceChildren();
      const otherLectures = Array.isArray(data.otherLectures) ? data.otherLectures : [];
      byId("teacher-other-empty").hidden = otherLectures.length > 0;
      byId("teacher-other-description").textContent = `${teacherName}의 다른 강의도 만나보세요.`;
      for (const [index, other] of otherLectures.entries()) {
        if (!Number.isSafeInteger(other.lid) || other.lid <= 0) continue;
        const card = document.createElement("a");
        card.className = "course-card";
        card.href = `/courses/detail?id=${other.lid}`;
        const art = document.createElement("div");
        art.className = `course-art ${["navy", "lavender", "sage"][index % 3]}`;
        const artTitle = document.createElement("strong");
        artTitle.textContent = other.name;
        art.append(artTitle, courseLineIcon(index + 1));
        const title = document.createElement("h3");
        title.textContent = other.name;
        const instructor = document.createElement("p");
        instructor.textContent = teacherName;
        const price = document.createElement("div");
        price.className = "course-price";
        const amount = document.createElement("strong");
        amount.textContent = typeof other.price === "number"
          ? `${other.price.toLocaleString("ko-KR")}원` : "가격 확인";
        const arrow = document.createElement("span");
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");
        price.append(amount, arrow);
        card.append(art, title, instructor, price);
        others.append(card);
      }

      // 평점이 null이면 '0점'으로 오해하지 않도록 구분합니다.
      const reviewCount = data.reviewCount ?? 0;
      const ratingText = data.rating == null
        ? "평점 없음"
        : `평점 ${data.rating}`;

      setText(
        "detail-review-summary",
        `${ratingText} · 수강평 ${reviewCount}개`,
      );

      // 구매 카드
      setText("purchase-level", data.level ? `${data.level} 과정` : "");
      setText("purchase-name", data.name);
      setText(
        "purchase-price",
        data.viewerState === "enrolled"
          ? "구매 완료"
          : `${data.price.toLocaleString("ko-KR")}원`,
      );
      setText("purchase-difficulty", data.level);
      setText("purchase-category", data.category);

      // 로그인 링크에 강의 ID를 전달합니다.
      // 실제 로그인 후 복귀 처리는 로그인 연동 단계에서 구현합니다.
      const loginLink = byId("detail-login-link");
      const loginUrl = new URL(loginLink.href);
      loginUrl.searchParams.set("course", lectureId);
      loginLink.href = loginUrl.href;

      // 현재는 인증 토큰을 보내지 않으므로 공개 상세 조회입니다.
      // 구매 버튼은 안내 모달만 열며 실제 결제는 실행하지 않습니다.
      purchase.hidden = false;

    const addToCart = byId("add-to-cart");
    if (addToCart) addToCart.hidden = data.viewerState === "enrolled";

    if (data.viewerState === "enrolled") {
      purchase.textContent = "학습하기 →";
      setText(
        "purchase-status",
        "구매한 강의입니다. 학습을 시작하거나 이어서 진행하세요.",
      );
    } else {
      purchase.textContent = "수강권 구매 →";
      setText(
        "purchase-status",
        data.viewerState === "guest"
          ? "로그인 후 구매할 수 있습니다."
          : "결제 화면에서 할인과 결제 금액을 확인하세요.",
      );
    }

      status.textContent = "";
      content.hidden = false;
    } catch (error) {
      status.textContent =
        `강의 정보를 불러오지 못했습니다. ${error.message}`;
      retry.hidden = false;
    } finally {
      retry.disabled = false;
    }
  }

  retry.addEventListener("click", loadDetail);
  loadDetail();
}
const switchTab = (name) => {
  all("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === name);
    b.setAttribute("aria-pressed", String(b.dataset.tab === name));
  });
  all("[data-panel]").forEach((p) => {
    p.hidden = p.dataset.panel !== name;
  });
};
all("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => switchTab(b.dataset.tab)),
);
all("[data-preview-video]").forEach((b) =>
  b.addEventListener("click", () => {
    switchTab("intro");
    byId("video-preview").hidden = false;
    byId("video-preview").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }),
);
on("play-detail-preview", "click", async () => {
  const video = byId("detail-preview-video");
  const lectureId = new URLSearchParams(location.search).get("id");
  if (video.dataset.available !== "true" || !/^[1-9]\d*$/.test(lectureId || "")) return;
  byId("preview-message").textContent = "";
  if (!video.getAttribute("src")) video.src = `/backend/lectures/${lectureId}/preview`;
  video.hidden = false;
  byId("preview-placeholder").hidden = true;
  try {
    await video.play();
  } catch {
    byId("preview-placeholder").hidden = false;
    video.hidden = true;
    byId("preview-message").textContent = "미리보기 영상을 재생하지 못했습니다. 다시 시도해 주세요.";
  }
});
on("detail-preview-video", "error", () => {
  byId("detail-preview-video").hidden = true;
  byId("preview-placeholder").hidden = false;
  byId("preview-message").textContent = "미리보기 영상을 불러오지 못했습니다.";
});
all("[data-video-note]").forEach((b) =>
  b.addEventListener("click", () => {
    b.parentElement.querySelector(".video-status").textContent =
      "영상 파일 연결 전입니다. 실제 재생은 지원하지 않습니다.";
  }),
);
on("open-purchase", "click", async () => {
  const button = byId("open-purchase");
  const status = byId("purchase-status");
  const lectureId = new URLSearchParams(location.search).get("id");
  const basePath = header?.dataset.basePath || "";

  if (button.disabled) return;

  if (
    !lectureId ||
    !/^[1-9]\d*$/.test(lectureId) ||
    !Number.isSafeInteger(Number(lectureId))
  ) {
    status.textContent = "강의 주소가 올바르지 않습니다.";
    return;
  }

  const goLogin = () => {
    location.assign(
      `${basePath}/login?course=${encodeURIComponent(lectureId)}`,
    );
  };

  const goLearn = () => {
    location.assign(
      `${basePath}/lectures/${encodeURIComponent(lectureId)}/learn`,
    );
  };

  // 요청할 때마다 최신 토큰을 읽습니다.
  async function request(path, options = {}) {
    const session = getStoredSession();
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (session?.authorization) {
      headers.set("Authorization", session?.authorization);
    }

    return authFetch(`/backend${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  }



  button.disabled = true;
  status.textContent = "수강 상태를 확인하고 있습니다.";

  try {
    // 클릭 시점의 실제 수강 권한을 서버에서 다시 확인합니다.
    const detailResponse = await request(`/lectures/${lectureId}`);

    if (detailResponse.status === 401) {
      goLogin();
      return;
    }

    if (!detailResponse.ok) {
      throw new Error("강의의 수강 상태를 확인하지 못했습니다.");
    }

    const detail = await detailResponse.json();

    if (detail.viewerState === "guest") {
      goLogin();
      return;
    }

    if (detail.viewerState === "enrolled") {
      goLearn();
      return;
    }

    if (detail.viewerState !== "member") {
      throw new Error("수강 상태 응답이 올바르지 않습니다.");
    }

    // 바로 구매: 장바구니에 담지 않고 이 강의만 결제 화면으로 넘깁니다 (direct=true).
    location.assign(
      `${basePath}/mypage/buy?courseIds=${encodeURIComponent(lectureId)}&direct=true`,
    );
  } catch (error) {
    status.textContent = error.message || "이동 중 오류가 발생했습니다.";
  } finally {
    button.disabled = false;
  }
});
// 장바구니 담기: POST /mypage/cart/add. 결제 화면으로 이동하지 않고 담기만 합니다.
on("add-to-cart", "click", async () => {
  const button = byId("add-to-cart");
  const status = byId("purchase-status");
  const lectureId = new URLSearchParams(location.search).get("id");
  const basePath = header?.dataset.basePath || "";
  if (button.disabled) return;
  if (!/^[1-9]\d*$/.test(lectureId || "")) {
    status.textContent = "강의 주소가 올바르지 않습니다.";
    return;
  }
  const session = getStoredSession();

  button.disabled = true;
  status.textContent = "장바구니에 담는 중입니다.";
  try {
    const response = await authFetch("/backend/mypage/cart/add", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: session?.authorization,
      },
      body: JSON.stringify({ courseId: Number(lectureId) }),
      cache: "no-store",
    });
    if (response.status === 401) {
      location.assign(`${basePath}/login?course=${encodeURIComponent(lectureId)}`);
      return;
    }
    const data = await response.json().catch(() => null);
    const messages = {
      ALREADY_IN_CART: "이미 장바구니에 담긴 강의입니다.",
      ALREADY_ENROLLED: "이미 수강 중인 강의입니다.",
      CART_FULL: "장바구니가 가득 찼습니다. 일부 강의를 삭제한 뒤 담아 주세요.",
    };
    if (!response.ok && !messages[data?.code]) {
      throw new Error(data?.message || "장바구니에 담지 못했습니다.");
    }
    status.replaceChildren(
      document.createTextNode(
        response.ok ? "장바구니에 담았습니다. " : `${messages[data.code]} `,
      ),
    );
    if (data?.code !== "ALREADY_ENROLLED") {
      const link = document.createElement("a");
      link.href = `${basePath}/mypage/cart`;
      link.textContent = "장바구니 보기";
      status.append(link);
    }
  } catch (error) {
    status.textContent =
      error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message;
  } finally {
    button.disabled = false;
  }
});
all("[data-close-dialog]").forEach((b) =>
  b.addEventListener("click", () => byId("purchase-dialog").close()),
);
// 같은 메뉴를 다시 누르면 접고, 다른 메뉴를 누르면 이전 패널을 접습니다.
// DOM을 유지하므로 첨부 파일과 작성 중인 메모가 사라지지 않습니다.
all("[data-lesson-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = byId(button.dataset.lessonPanel);
    const open = target.hidden;
    all("[data-lesson-content]").forEach((panel) => {
      panel.hidden = panel !== target || !open;
    });
    all("[data-lesson-panel]").forEach((menu) => {
      const active = menu === button && open;
      menu.setAttribute("aria-expanded", String(active));
      menu.classList.toggle("sage", active);
      menu.classList.toggle("secondary", !active);
    });
    // 어떤 메뉴든 모두 접히면 기본 안내를 다시 표시합니다.
    const intro = byId("lesson-default");
    const hasOpenPanel = all("[data-lesson-content]").some(panel => !panel.hidden);
    if (intro) intro.hidden = hasOpenPanel;
  });
});
on("write-question", "click", () => {
  const form = byId("question-form");
  form.hidden = !form.hidden;
  byId("write-question").setAttribute("aria-expanded", String(!form.hidden));
  if (!form.hidden) byId("question-title").focus();
});
on("cancel-question", "click", () => {
  byId("question-form").hidden = true;
  byId("write-question").setAttribute("aria-expanded", "false");
});
all("[data-unavailable]").forEach((b) =>
  b.addEventListener("click", () => {
    byId("lesson-status").textContent = b.dataset.unavailable;
  }),
);
all("[data-chapter]").forEach((b) =>
  b.addEventListener("click", () => {
    all("[data-chapter]").forEach((n) => n.classList.toggle("active", n === b));
    document.querySelector(".video-center>p").textContent =
      b.dataset.chapterTitle;
    document.querySelector(".video-status").textContent =
      b.dataset.chapter + " 위치 선택 미리보기 · 영상 미연결";
  }),
);
// 챗봇 동작은 공통 React 컴포넌트가 담당합니다.
// ---------------------------------------------------------------------------
// 커뮤니티(/forum) 백엔드 연동
// 목록 GET /forum, 상세 GET /forum/{pid}, 글 작성 POST /forum/posts,
// 댓글 작성 POST /forum/{pid}/comment, 글 삭제 DELETE /forum/{pid},
// 댓글 삭제 DELETE /forum/{pid}/comment?commentId=
// 쓰기 요청은 로그인 토큰(sessionStorage)을 붙여 authFetch로 보냅니다(만료 시 재발급 후 1회 재시도).
// ---------------------------------------------------------------------------
const forumBase = header?.dataset.basePath || "";
const forumEl = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
// 분류별 배지 색상입니다(기존 예시 화면과 같은 클래스).
const forumPill = { STUDY: "", QUESTION: "blue", PROJECT: "purple", REVIEW: "" };
const forumDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
};
const forumInitial = (nickname) => (nickname || "?").trim().charAt(0) || "?";
const forumAuthHeaders = () => {
  const session = getStoredSession();
  return session ? { Authorization: session?.authorization } : {};
};
// 실패 응답을 화면 문구로 바꿉니다. 400이면 result.errors[].reason을 모아 보여줍니다.
async function forumError(response, fallback) {
  const data = await response.json().catch(() => null);
  const errors = data?.result?.errors;
  if (response.status === 400 && Array.isArray(errors) && errors.length) {
    return errors.map((e) => e.reason).join(" ");
  }
  const messages = {
    401: "로그인이 필요합니다. 다시 로그인해 주세요.",
    403:
      data?.code === "ACCOUNT_RESTRICTED"
        ? "이용이 제한된 계정입니다."
        : data?.message || "권한이 없습니다.",
    404: data?.message || "게시글을 찾을 수 없습니다.",
  };
  return messages[response.status] || data?.message || fallback;
}

// 목록 화면 (/community)
if (byId("post-list")) {
  const list = byId("post-list");
  const status = byId("post-status");
  const retry = byId("retry-posts");
  const pagination = byId("post-pagination");
  const search = byId("post-search");
  const chips = all("[data-post-category]");
  // 한 페이지 게시글 수(15개)는 백엔드 GET /forum이 정합니다. 프론트는 page 번호만 보냅니다.
  const pageBlock = 10; // 아래 페이지 번호를 한 번에 10개(1~10, 11~20 ...)까지 보여줍니다.
  let sort = "ALL";
  let page = 0;
  let active = null;

  const makeItem = (post) => {
    const review = post.type === "REVIEW";
    const link = forumEl("a", "post-item");
    link.dataset.post = "";
    link.href = review
      ? `${forumBase}/courses/reviews?id=${encodeURIComponent(post.lectureId)}` +
        `&user=${encodeURIComponent(post.reviewRef?.userId ?? "")}`
      : `${forumBase}/community/detail?id=${encodeURIComponent(post.postId)}`;
    if (review) {
      // 수강평은 강의 상세로 이동하지 않고, 그 강의의 수강평만 보여 주는 작은 창을 엽니다.
      link.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        const popup = window.open(
          link.href,
          "course-reviews",
          "width=520,height=720,resizable=yes,scrollbars=yes",
        );
        if (popup) popup.focus();
        else location.assign(link.href); // 팝업이 막힌 경우 같은 창에서 엽니다.
      });
    }
    const code = post.category?.code || "";
    const meta = [
      post.authorNickname || "알 수 없음",
      forumDate(post.createdAt),
      review && post.star ? `★ ${post.star}` : "",
    ].filter(Boolean);
    const author = forumEl("div", "author");
    author.append(
      forumEl("span", "avatar", forumInitial(post.authorNickname)),
      forumEl("span", "", meta.join(" · ")),
    );
    link.append(
      forumEl("span", `pill ${forumPill[code] || ""}`.trim(), post.category?.name || code),
      forumEl("h2", "", post.title),
      forumEl("p", "", post.excerpt),
      author,
    );
    return link;
  };

  // 서버에는 검색 기능이 없어 현재 페이지 안에서만 걸러 보여줍니다.
  const applySearch = () => {
    const keyword = search.value.trim();
    let count = 0;
    all("#post-list [data-post]").forEach((item) => {
      item.hidden = keyword !== "" && !item.textContent.includes(keyword);
      if (!item.hidden) count += 1;
    });
    byId("post-empty").hidden = count !== 0;
  };

  const renderPagination = (info) => {
    pagination.replaceChildren();
    // 1페이지뿐이어도 시안처럼 번호 줄을 보여줍니다. 글이 없을 때만 숨깁니다.
    pagination.hidden = info.totalPages < 1;
    if (info.totalPages < 1) return;
    const add = (label, target, disabled, current = false) => {
      const button = forumEl("button", "", label);
      button.type = "button";
      if (label === "이전" || label === "다음") {
        // 화살표 아이콘 버튼 (화면 읽기 프로그램에는 이전·다음 페이지로 읽힘)
        button.className = "page-arrow";
        button.setAttribute("aria-label", `${label} 페이지`);
        button.innerHTML = label === "이전"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
      } else {
        button.setAttribute("aria-label", `${label} 페이지`);
      }
      button.disabled = disabled;
      if (current) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        page = target;
        load();
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagination.append(button);
    };
    add("이전", page - 1, page === 0);
    const start = Math.floor(page / pageBlock) * pageBlock;
    const end = Math.min(info.totalPages - 1, start + pageBlock - 1);
    for (let n = start; n <= end; n += 1) add(String(n + 1), n, false, n === page);
    add("다음", page + 1, !info.hasNext);
  };

  async function load() {
    active?.abort();
    const controller = new AbortController();
    active = controller;
    chips.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.postCategory === sort)),
    );
    list.setAttribute("aria-busy", "true");
    list.replaceChildren();
    pagination.hidden = true;
    byId("post-empty").hidden = true;
    retry.hidden = true;
    status.textContent = "게시글을 불러오는 중입니다.";
    try {
      const query = new URLSearchParams({ sort, page: String(page) });
      const response = await fetch(`${API_BASE_URL}/forum?${query}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await forumError(response, `HTTP ${response.status}`));
      const data = await response.json();
      const result = data?.result;
      if (!Array.isArray(result?.posts) || !result.page) {
        throw new Error("목록 응답 형식이 올바르지 않습니다.");
      }
      if (controller.signal.aborted) return;
      list.replaceChildren(...result.posts.map(makeItem));
      status.textContent = "";
      byId("post-empty").hidden = result.posts.length !== 0;
      renderPagination(result.page);
      applySearch();
    } catch (error) {
      if (controller.signal.aborted) return;
      status.textContent =
        error instanceof TypeError
          ? "게시글 서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요."
          : `게시글을 불러오지 못했습니다. ${error.message}`;
      retry.hidden = false;
    } finally {
      if (active === controller) list.setAttribute("aria-busy", "false");
    }
  }

  chips.forEach((b) =>
    b.addEventListener("click", () => {
      sort = b.dataset.postCategory;
      page = 0;
      load();
    }),
  );
  search.addEventListener("input", applySearch);
  retry.addEventListener("click", load);
  load();
}

// 상세 화면 (/community/detail?id=)
if (document.querySelector("[data-post-detail]")) {
  const postId = new URLSearchParams(location.search).get("id");
  const status = byId("detail-post-status");
  const commentList = byId("comment-list");
  const more = byId("comment-more");
  const form = byId("comment-form");
  const commentStatus = byId("comment-status");
  const pageSize = 20;
  let nextPage = 0;
  let totalComments = 0;

  const setCount = () => {
    byId("comment-count").textContent = `(${totalComments})`;
    if (totalComments === 0 && !commentList.querySelector("[data-comment]")) {
      const empty = forumEl("p", "", "아직 등록된 댓글이 없습니다.");
      empty.dataset.commentEmpty = "";
      commentList.replaceChildren(empty);
    }
  };

  const makeComment = (comment) => {
    const item = forumEl("div", "comment-item");
    item.dataset.comment = String(comment.commentId);
    const author = forumEl("div", "author");
    author.append(
      forumEl("span", "avatar", forumInitial(comment.authorNickname)),
      forumEl("span", "", [comment.authorNickname || "알 수 없음", forumDate(comment.createdAt)].filter(Boolean).join(" · ")),
    );
    // 댓글은 일반 텍스트로만 표시합니다(줄바꿈 유지).
    const body = forumEl("p", "", comment.content);
    body.style.whiteSpace = "pre-wrap";
    item.append(author, body);
    if (comment.isMine) {
      const remove = forumEl("button", "btn secondary", "삭제");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        remove.disabled = true;
        try {
          const query = new URLSearchParams({ commentId: String(comment.commentId) });
          const response = await authFetch(
            `${API_BASE_URL}/forum/${encodeURIComponent(postId)}/comment?${query}`,
            { method: "DELETE", headers: forumAuthHeaders() },
          );
          if (!response.ok) throw new Error(await forumError(response, "댓글을 삭제하지 못했습니다."));
          item.remove();
          totalComments = Math.max(0, totalComments - 1);
          setCount();
        } catch (error) {
          alert(error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message);
          remove.disabled = false;
        }
      });
      item.append(remove);
    }
    return item;
  };

  async function loadPage(first) {
    const query = new URLSearchParams({ page: String(nextPage), size: String(pageSize) });
    // 로그인 상태면 토큰을 보내 내 글·댓글(isMine)에 삭제 버튼을 표시합니다. 없어도 조회는 됩니다.
    const response = await fetch(
      `${API_BASE_URL}/forum/${encodeURIComponent(postId)}?${query}`,
      { headers: { Accept: "application/json", ...(getSession() ? forumAuthHeaders() : {}) } },
    );
    if (!response.ok) throw new Error(await forumError(response, `HTTP ${response.status}`));
    const result = (await response.json())?.result;
    if (!result?.post || !Array.isArray(result.comments) || !result.page) {
      throw new Error("게시글 응답 형식이 올바르지 않습니다.");
    }
    if (first) {
      const post = result.post;
      const code = post.category?.code || "";
      document.title = `${post.title} · 새싹에듀`;
      byId("post-category").className = `pill ${forumPill[code] || ""}`.trim();
      byId("post-category").textContent = post.category?.name || code;
      byId("post-title").textContent = post.title;
      byId("post-avatar").textContent = forumInitial(post.authorNickname);
      byId("post-meta").textContent = [
        post.authorNickname || "알 수 없음",
        forumDate(post.createdAt),
        post.updatedAt ? "수정됨" : "",
      ].filter(Boolean).join(" · ");
      // 본문은 서버가 허용 서식만 남긴(sanitize) HTML입니다.
      byId("post-body-view").innerHTML = post.content;
      commentList.replaceChildren();
      const deleteButton = byId("delete-post");
      deleteButton.hidden = !post.isMine;
      deleteButton.onclick = async () => {
        if (!confirm("글을 삭제할까요? 댓글도 함께 삭제됩니다.")) return;
        deleteButton.disabled = true;
        try {
          const res = await authFetch(`${API_BASE_URL}/forum/${encodeURIComponent(postId)}`, {
            method: "DELETE",
            headers: forumAuthHeaders(),
          });
          if (!res.ok) throw new Error(await forumError(res, "글을 삭제하지 못했습니다."));
          location.replace(`${forumBase}/community`);
        } catch (error) {
          alert(error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message);
          deleteButton.disabled = false;
        }
      };
    }
    commentList.querySelector("[data-comment-empty]")?.remove();
    commentList.append(...result.comments.map(makeComment));
    totalComments = result.page.totalElements;
    nextPage = result.page.number + 1;
    more.hidden = !result.page.hasNext;
    setCount();
  }

  (async () => {
    if (!postId || !/^[1-9]\d*$/.test(postId)) {
      status.textContent = "게시글 주소가 올바르지 않습니다. 목록에서 다시 선택해 주세요.";
      return;
    }
    try {
      await loadPage(true);
      status.textContent = "";
      status.hidden = true;
      byId("post-content").hidden = false;
      const loggedIn = true;
      form.hidden = !loggedIn;
      byId("comment-login").hidden = loggedIn;
    } catch (error) {
      status.textContent =
        error instanceof TypeError
          ? "게시글 서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요."
          : error.message;
    }
  })();

  more.addEventListener("click", async () => {
    more.disabled = true;
    try {
      await loadPage(false);
    } catch (error) {
      alert(error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message);
    } finally {
      more.disabled = false;
    }
  });

  let sending = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    sending = true;
    const input = byId("comment-input");
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    commentStatus.textContent = "댓글을 등록하는 중입니다.";
    try {
      const response = await authFetch(
        `${API_BASE_URL}/forum/${encodeURIComponent(postId)}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...forumAuthHeaders() },
          body: JSON.stringify({ content: input.value }),
        },
      );
      if (response.status !== 201) {
        throw new Error(await forumError(response, "댓글을 등록하지 못했습니다."));
      }
      const created = (await response.json())?.result;
      // 마지막 페이지까지 불러온 경우에만 새 댓글을 목록 끝에 붙입니다.
      if (more.hidden && created) {
        commentList.querySelector("[data-comment-empty]")?.remove();
        commentList.append(makeComment(created));
      }
      totalComments += 1;
      setCount();
      input.value = "";
      commentStatus.textContent = "댓글이 등록되었습니다.";
    } catch (error) {
      commentStatus.textContent =
        error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message;
    } finally {
      sending = false;
      button.disabled = false;
    }
  });
}

// 글 작성 화면 (/community/write)
const forumEscape = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

if (byId("post-form")) {
  const form = byId("post-form");
  const status = byId("post-write-status");

  let sending = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    const bodyText = byId("post-body").textContent.trim();
    if (!bodyText) {
      status.textContent = "본문을 입력해 주세요.";
      byId("post-body").focus();
      return;
    }
    if (bodyText.length > 10000) {
      status.textContent = "본문은 10,000자 이하로 입력해 주세요.";
      return;
    }
    sending = true;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    status.textContent = "글을 등록하는 중입니다.";
    try {
      const response = await authFetch(`${API_BASE_URL}/forum/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forumAuthHeaders() },
        body: JSON.stringify({
          category: byId("post-category").value,
          title: byId("post-title").value.trim(),
          content: editorHtml(),
        }),
      });
      if (response.status !== 201) {
        throw new Error(await forumError(response, "글을 등록하지 못했습니다."));
      }
      const created = (await response.json())?.result;
      location.assign(`${forumBase}/community/done?id=${encodeURIComponent(created?.postId ?? "")}`);
    } catch (error) {
      status.textContent =
        error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message;
      sending = false;
      button.disabled = false;
    }
  });
}
// 글 작성 본문: 버튼을 누르면 선택한 글자에 서식이 바로 보이도록 편집 영역(contenteditable)을 씁니다.
// 등록할 때는 편집 영역의 HTML을 보내고, 서버(jsoup)가 허용 태그만 남깁니다.
function editorHtml() {
  const editor = byId("post-body");
  // 빈 줄만 남은 경우를 정리합니다.
  return editor.innerHTML.replace(/(<p><br><\/p>)+$/i, "").trim();
}
if (byId("post-body")?.isContentEditable) {
  const editor = byId("post-body");
  // 줄바꿈을 <div> 대신 <p>로 만들어 서버 허용 태그와 맞춥니다.
  try {
    document.execCommand("defaultParagraphSeparator", false, "p");
  } catch {
    // 지원하지 않는 브라우저는 기본 동작을 씁니다.
  }
  const commands = {
    bold: "bold",
    italic: "italic",
    list: "insertUnorderedList",
  };
  const syncToolbar = () => {
    all("[data-format]").forEach((button) => {
      const command = commands[button.dataset.format];
      if (!command) return;
      let active = false;
      try {
        active = document.queryCommandState(command);
      } catch {
        active = false;
      }
      button.setAttribute("aria-pressed", String(active));
    });
  };
  all("[data-format]").forEach((button) => {
    // 버튼을 눌러도 편집 영역의 선택이 풀리지 않게 합니다.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      editor.focus();
      const format = button.dataset.format;
      if (format === "link") {
        const url = window.prompt("연결할 주소를 입력해 주세요.", "https://");
        if (!url || !/^https?:\/\/\S+$/i.test(url.trim())) return;
        const selection = window.getSelection();
        if (selection && selection.isCollapsed) {
          document.execCommand("insertHTML", false,
            `<a href="${forumEscape(url.trim())}">${forumEscape(url.trim())}</a>`);
        } else {
          document.execCommand("createLink", false, url.trim());
        }
      } else {
        document.execCommand(commands[format]);
      }
      syncToolbar();
    });
  });
  // 다른 곳에서 복사한 서식은 버리고 글자만 붙여 넣습니다.
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
  });
  editor.addEventListener("keyup", syncToolbar);
  editor.addEventListener("mouseup", syncToolbar);
}
// 전송 차단 이벤트가 등록된 후에만 폼을 활성화합니다.
all("fieldset[data-enable]").forEach((f) => {
  f.disabled = false;
});



// 로그인 화면에서만 실제 로그인 요청을 처리합니다.
const loginForm = document.getElementById("login-form");

if (loginForm) {
  let submitting = false;

  loginForm.addEventListener("submit", async (event) => {
    // 기본 폼 제출로 페이지가 새로고침되는 것을 막습니다.
    event.preventDefault();

    if (submitting) return;

    const emailInput = loginForm.querySelector('[name="email"]');
    const passwordInput = loginForm.querySelector('[name="pw"]');
    const submitButton = loginForm.querySelector('[type="submit"]');
    const status = loginForm.querySelector(".form-status");
    const errorBox = document.getElementById("login-error");

    submitting = true;
    submitButton.disabled = true;
    errorBox.hidden = true;
    passwordInput.classList.remove("invalid");
    status.textContent = "로그인 확인 중입니다.";

    try {
      // 프론트 /backend/login → Vite → Java 서버 :8081/login
      const response = await fetch("/backend/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          pw: passwordInput.value,
        }),
      });

      // 서버 오류 등으로 JSON이 아닌 응답이 올 수도 있습니다.
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const messages = {
          400: "이메일과 비밀번호 입력값을 확인해 주세요.",
          401: "이메일 또는 비밀번호를 확인해 주세요.",
          403: "이용이 제한된 계정입니다.",
          429: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
        };

        throw new Error(
          messages[response.status] ||
            "로그인 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }

      // 회원 정보는 본문, 인증 토큰은 응답 헤더에 있습니다.
      const member = data?.result?.member;
      const authorization = response.headers.get("Authorization");

      if (
        data?.code !== "LOGIN_SUCCESS" ||
        !member ||
        !authorization?.startsWith("Bearer ")
      ) {
        throw new Error("로그인 응답에 필요한 정보가 없습니다.");
      }

      // 이번 단계에서는 성공 여부만 표시합니다.
      // 토큰 보관·공통 인증 상태·화면 이동은 다음 단계에서 연결합니다.
      // 받은 JWT와 회원 정보를 보관합니다.
      saveSession(authorization, member);

      // 비밀번호는 저장하지 않고 입력란에서도 지웁니다.
      passwordInput.value = "";
      const courseId = new URLSearchParams(location.search).get("course");
      const basePath = header?.dataset.basePath || "";

      if (courseId && /^[1-9]\d*$/.test(courseId)) {
        status.textContent = "로그인되었습니다. 선택한 강의로 이동합니다.";
        window.location.replace(
          `${basePath}/courses/detail?id=${encodeURIComponent(courseId)}`,
        );
      } else if (member.role === "INSTRUCTOR") {
        // 강사는 강사센터로 이동
        status.textContent = "로그인되었습니다. 강사센터로 이동합니다.";
        window.location.replace(`${basePath}/instructor/lectures`);
      } else {
        status.textContent = "로그인되었습니다. 메인으로 이동합니다.";
        window.location.replace(`${basePath}/`);
      }

      // 로그인 화면을 메인 화면으로 대체합니다.

    } catch (error) {
      status.textContent = "";
      errorBox.textContent =
        error instanceof TypeError
          ? "로그인 서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요."
          : error.message;
      errorBox.hidden = false;
    } finally {
      // 성공·실패와 관계없이 버튼을 다시 사용할 수 있게 합니다.
      submitting = false;
      submitButton.disabled = false;
    }
  });
}

// 강의 학습 주소에서만 실행합니다.
const learningPathMatch = window.location.pathname.match(
  /\/lectures\/([1-9][0-9]*)\/learn$/,
);

const classroom = document.querySelector(".classroom");

if (learningPathMatch && classroom) {
    // 실제 영상이 준비될 때까지 예시 재생 UI를 숨깁니다.
  const videoArea = classroom.querySelector(".lesson-video");

  if (videoArea) {
    videoArea.querySelector(".play-button")?.remove();
    videoArea.querySelector(".video-controls")?.remove();

    const videoDescription = videoArea.querySelector(".video-center > p");
    if (videoDescription) {
      videoDescription.textContent = "등록된 강의 영상이 없습니다.";
    }

    const videoStatus = videoArea.querySelector(".video-status");
    if (videoStatus) videoStatus.textContent = "";
  }

  const defaultNote = classroom.querySelector(
    "#lesson-default .screen-note",
  );
  if (defaultNote) {
    defaultNote.textContent = "영상이 등록되면 학습할 수 있습니다.";
  }
  const lectureId = learningPathMatch[1];
  const status = document.getElementById("lesson-status");
  const title = classroom.querySelector("h1");
  const videoTitle = classroom.querySelector(".video-center h2");

  // AUTHENTICATED_LESSON_VIDEO
  async function prepareLessonVideo(data) {
    if (!videoArea) return;

    const center = videoArea.querySelector(".video-center");
    const description = center?.querySelector("p");
    if (!center || !description) return;

    const oldStatus = center.querySelector(".video-status");
    if (oldStatus) oldStatus.textContent = "";

    const player = document.createElement("video");
    player.controls = true;
    player.playsInline = true;
    player.preload = "metadata";
    player.hidden = true;
    player.setAttribute("aria-label", `${data.name} 강의 영상`);
    videoArea.prepend(player);

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "btn primary lesson-load-video";
    loadButton.textContent = "영상 불러오기";
    loadButton.hidden = true;
    center.append(loadButton);

    let objectUrl = null;
    let busy = false;
    const controller = new AbortController();
    const endpoint = `/backend/lectures/${lectureId}/learn/video`;

    function showMessage(text) {
      description.textContent = text;
    }

    async function requestVideo(extraHeaders = {}) {
      const session = getStoredSession();


      return authFetch(endpoint, {
        headers: {
          Authorization: session?.authorization,
          ...extraHeaders,
        },
        signal: controller.signal,
        cache: "no-store",
      });
    }

    async function checkResponse(response) {
      if (response.ok) return;

      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error("인증할 수 없습니다. 다시 로그인해 주세요.");
      }
      if (response.status === 403) {
        throw new Error("이 영상을 재생할 수강 권한이 없습니다.");
      }
      if (
        response.status === 404 &&
        body?.code === "VIDEO_NOT_FOUND"
      ) {
        throw new Error("등록된 강의 영상이 없습니다.");
      }

      throw new Error(
        body?.message || `영상 요청 실패: HTTP ${response.status}`,
      );
    }


    // LESSON_POSITION_SAVE
    const positionMessage = document.createElement("p");
    positionMessage.className = "screen-note";
    positionMessage.setAttribute("role", "status");
    videoArea.after(positionMessage);

    const playbackMemberId = getStoredSession()?.member?.memberId;
    let trackingPosition = false;
    let savingPosition = false;
    let pendingPosition = null;
    let lastSavedPosition = Number.isFinite(data.position)
      ? data.position
      : null;
    let lastPositionRequestAt = 0;
    let positionSaveStopped = false;

    function capturePosition() {
      if (
        !trackingPosition ||
        player.error ||
        player.readyState < 1 ||
        !Number.isFinite(player.currentTime) ||
        !Number.isFinite(player.duration) ||
        player.duration <= 0
      ) return null;

      return Math.max(
        0,
        Math.floor(Math.min(player.currentTime, player.duration)),
      );
    }

    let positionSavePromise = null;

    function flushPosition() {
      if (positionSavePromise) return positionSavePromise;

      positionSavePromise = runPositionSave().finally(() => {
        positionSavePromise = null;
      });

      return positionSavePromise;
    }

    async function runPositionSave() {
      if (savingPosition || positionSaveStopped) return;

      savingPosition = true;

      try {
        // 요청을 순서대로 보내 이전 위치가 최신 위치를 덮지 않게 합니다.
        while (pendingPosition !== null) {
          const position = pendingPosition;
          pendingPosition = null;

          if (position === lastSavedPosition) continue;

          const session = getStoredSession();

          if (
            playbackMemberId == null ||
            String(session.member?.memberId) !== String(playbackMemberId)
          ) {
            positionSaveStopped = true;
            pendingPosition = null;
            positionMessage.textContent =
              "로그인 상태가 변경되어 재생 위치 저장을 중단했습니다.";
            return;
          }

          lastPositionRequestAt = Date.now();

          try {
            const response = await authFetch(
              `/backend/lectures/${lectureId}/learn/position`,
              {
                method: "PUT",
                headers: {
                  Authorization: session?.authorization,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({ position }),
                keepalive: true,
              },
            );

            if (response.status !== 204) {
              const body = await response.json().catch(() => null);

              if (response.status === 401 || response.status === 403) {
                positionSaveStopped = true;
              }

              throw new Error(
                body?.message ||
                  `재생 위치 저장 실패: HTTP ${response.status}`,
              );
            }

            lastSavedPosition = position;
            data.position = position;
            positionMessage.textContent =
              `이어보기 위치 저장됨 · ${formatChapterTime(position)}`;
          } catch (error) {
            pendingPosition = null;
            positionMessage.textContent =
              error instanceof TypeError
                ? "재생 위치 저장 결과를 확인하지 못했습니다. 연결 상태를 확인해 주세요."
                : error.message;
            break;
          }
        }
      } finally {
        savingPosition = false;
      }
    }

    function saveCurrentPosition() {
      if (positionSaveStopped) return;

      const position = capturePosition();
      if (position === null) return;

      pendingPosition = position;
      void flushPosition();
    }

    // 영상 로딩·이어보기 복원 과정에서 0초가 잘못 저장되지 않게 합니다.
    player.addEventListener("loadedmetadata", () => {
      trackingPosition = false;
    });

    player.addEventListener("play", () => {
      trackingPosition = true;
    });

    player.addEventListener("emptied", () => {
      trackingPosition = false;
    });

    player.addEventListener("timeupdate", () => {
      if (
        !player.paused &&
        !player.seeking &&
        Date.now() - lastPositionRequestAt >= 15000
      ) {
        saveCurrentPosition();
      }
    });

    player.addEventListener("pause", saveCurrentPosition);
    // LESSON_COMPLETION
    const completionMessage = document.createElement("p");
    completionMessage.className = "screen-note";
    completionMessage.setAttribute("role", "status");

    const completionRetry = document.createElement("button");
    completionRetry.type = "button";
    completionRetry.className = "btn secondary";
    completionRetry.textContent = "수료 처리 다시 시도";
    completionRetry.hidden = true;

    positionMessage.after(completionMessage, completionRetry);

    let completing = false;

    if (data.done) {
      completionMessage.textContent = "이미 수료한 강의입니다.";
    }

    async function completeLesson() {
      if (completing || data.done || !player.ended) return;

      completing = true;
      completionRetry.hidden = true;
      completionMessage.textContent = "마지막 재생 위치를 저장하고 있습니다.";

      try {
        const position = capturePosition();

        if (position === null || positionSaveStopped) {
          throw new Error("재생 위치를 저장할 수 없습니다. 로그인 상태를 확인해 주세요.");
        }

        pendingPosition = position;
        await flushPosition();

        if (positionSaveStopped || lastSavedPosition !== position) {
          throw new Error("마지막 재생 위치 저장에 실패했습니다. 다시 시도해 주세요.");
        }

        const session = getStoredSession();

        if (
          playbackMemberId == null ||
          String(session.member?.memberId) !== String(playbackMemberId)
        ) {
          throw new Error("로그인 상태가 변경되었습니다. 새로고침 후 확인해 주세요.");
        }

        completionMessage.textContent = "수료 처리 중입니다.";

        const response = await authFetch(
          `/backend/lectures/${lectureId}/complete`,
          {
            method: "POST",
            headers: {
              Authorization: session?.authorization,
              Accept: "application/json",
            },
          },
        );

        const body = await response.json().catch(() => null);
        const alreadyCompleted =
          response.status === 409 && body?.code === "ALREADY_COMPLETED";

        if (!response.ok && !alreadyCompleted) {
          throw new Error(
            body?.message || `수료 처리 실패: HTTP ${response.status}`,
          );
        }

        data.done = true;
        completionMessage.textContent = "강의를 수료했습니다.";
      } catch (error) {
        completionMessage.textContent =
          error instanceof TypeError
            ? "수료 처리 결과를 확인하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요."
            : error.message;
        completionRetry.hidden = false;
      } finally {
        completing = false;
      }
    }

    player.addEventListener("ended", completeLesson);
    completionRetry.addEventListener("click", completeLesson);

    player.addEventListener("play", () => {
      completionRetry.hidden = true;
    });


    // 일시정지한 상태에서 목차로 이동한 경우에도 위치를 저장합니다.
    player.addEventListener("seeked", () => {
      if (player.paused) saveCurrentPosition();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveCurrentPosition();
    });

    // 기존 영상 정리 이벤트보다 먼저 마지막 위치를 캡처합니다.
    window.addEventListener("pagehide", saveCurrentPosition);

    player.addEventListener("loadedmetadata", () => {
      player.hidden = false;
      center.hidden = true;

      const savedPosition = Number(data.position);
      if (
        Number.isFinite(savedPosition) &&
        savedPosition > 0 &&
        savedPosition < player.duration
      ) {
        player.currentTime = savedPosition;
      }

      updateChapterButtons();

      if (defaultNote) {
        defaultNote.textContent =
          "재생 버튼을 눌러 시작하세요. 목차를 선택하면 해당 위치로 이동합니다.";
      }
    });

    player.addEventListener("error", () => {
      player.hidden = true;
      center.hidden = false;
      loadButton.hidden = false;
      loadButton.textContent = "다시 불러오기";
      showMessage(
        "영상을 재생하지 못했습니다. 파일 형식이나 손상 여부를 확인해 주세요.",
      );
      updateChapterButtons();
    });

    loadButton.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      loadButton.disabled = true;
      showMessage("영상 파일을 불러오는 중입니다. 파일 크기에 따라 시간이 걸릴 수 있습니다.");

      try {
        const response = await requestVideo();
        await checkResponse(response);

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("영상 파일이 비어 있습니다.");
        }

        player.pause();
        player.removeAttribute("src");
        player.load();

        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);

        player.src = objectUrl;
        player.load();
        showMessage("영상 형식을 확인하고 있습니다.");
      } catch (error) {
        if (error.name === "AbortError") return;

        showMessage(
          error instanceof TypeError
            ? "영상 서버에 연결하지 못했습니다."
            : error.message,
        );
        loadButton.textContent = "다시 불러오기";
      } finally {
        busy = false;
        loadButton.disabled = false;
      }
    });

    window.addEventListener("pagehide", (event) => {
      player.pause();
      if (event.persisted) return;

      controller.abort();
      player.removeAttribute("src");
      player.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    if (!data.videoUrl) {
      showMessage("등록된 강의 영상이 없습니다.");
      return;
    }

    showMessage("영상 파일을 확인하고 있습니다.");

    try {
      // 전체 다운로드 전에 작은 구간을 요청해 파일 존재를 확인합니다.
      const response = await requestVideo({ Range: "bytes=0-0" });
      await checkResponse(response);
      if (response.body) await response.body.cancel();

      showMessage("영상이 등록되어 있습니다. 불러오기 후 재생할 수 있습니다.");
      loadButton.hidden = false;

      if (defaultNote) {
        defaultNote.textContent =
          "영상을 불러오면 목차를 선택해 재생 위치를 이동할 수 있습니다.";
      }
    } catch (error) {
      if (error.name === "AbortError") return;

      showMessage(
        error instanceof TypeError
          ? "영상 서버에 연결하지 못했습니다."
          : error.message,
      );

      if (defaultNote) {
        defaultNote.textContent =
          "영상 파일이 준비된 뒤 새로고침하면 다시 확인합니다.";
      }
    }
  }


  // REAL_LECTURE_CHAPTERS
  const outline = classroom.querySelector(".lesson-outline");

  // CHAPTER_PLAYER_LINK
  function getLessonPlayer() {
    return classroom.querySelector(".lesson-video video");
  }

  function canSeekLesson() {
    const player = getLessonPlayer();
    return Boolean(
      player &&
      !player.error &&
      player.readyState >= 1 &&
      Number.isFinite(player.duration) &&
      player.duration > 0
    );
  }

  function updateChapterButtons() {
    if (!outline) return;

    const ready = canSeekLesson();

    outline.querySelectorAll(".lecture-chapter-seek").forEach(button => {
      const seconds = Number(button.dataset.startSec);
      const player = getLessonPlayer();

      button.disabled =
        !ready || seconds >= player.duration;

      button.title = !ready
        ? "영상이 준비되면 해당 위치로 이동할 수 있습니다."
        : button.disabled
          ? "이 목차의 시작 시간이 영상 길이를 벗어납니다."
          : "이 위치로 이동";
    });
  }

  // 영상이 나중에 추가되어도 준비 이벤트를 감지합니다.
  for (const eventName of [
    "loadedmetadata",
    "durationchange",
    "emptied",
    "error",
  ]) {
    classroom.addEventListener(eventName, (event) => {
      if (event.target.matches?.(".lesson-video video")) {
        updateChapterButtons();
      }
    }, true);
  }


  function showOutlineMessage(text) {
    if (!outline) return;
    const heading = document.createElement("h2");
    heading.textContent = "강의 목차";
    const message = document.createElement("p");
    message.textContent = text;
    outline.replaceChildren(heading, message);
  }

  function formatChapterTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function renderChapters(data) {
    if (!outline) return;

    if (
      !Array.isArray(data.chapters) ||
      data.chapters.some(chapter =>
        !Number.isInteger(chapter.startSec) ||
        chapter.startSec < 0 ||
        typeof chapter.title !== "string"
      )
    ) {
      showOutlineMessage("목차 정보의 응답 형식을 확인할 수 없습니다.");
      return;
    }

    showOutlineMessage(
      data.chapters.length
        ? "하나의 영상, 주제별로 살펴보세요."
        : "등록된 목차가 없습니다.",
    );

    const chapters = [...data.chapters].sort(
      (a, b) => a.startSec - b.startSec,
    );

    const list = document.createElement("ol");
    list.className = "lecture-real-chapters";

    for (const chapter of chapters) {
      const row = document.createElement("li");

      const time = document.createElement("span");
      time.className = "lecture-chapter-time";
      time.textContent = formatChapterTime(chapter.startSec);

      const title = document.createElement("span");
      title.textContent = chapter.title;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "lecture-chapter-seek";
      button.dataset.startSec = String(chapter.startSec);
      button.disabled = true;
      button.setAttribute(
        "aria-label",
        `${chapter.title}, ${formatChapterTime(chapter.startSec)} 위치로 이동`,
      );

      button.append(time, title);
      row.append(button);
      list.append(row);

      button.addEventListener("click", () => {
        const player = getLessonPlayer();
        if (!canSeekLesson()) return;
        if (chapter.startSec >= player.duration) return;

        try {
          // 재생 중이면 계속 재생, 일시정지 상태라면 위치만 이동합니다.
          player.currentTime = chapter.startSec;

          outline.querySelectorAll(".lecture-chapter-seek")
            .forEach(item => {
              item.classList.toggle("is-active", item === button);
            });
        } catch {
          const message = document.getElementById("lesson-status");
          if (message) {
            message.textContent =
              "재생 위치를 이동하지 못했습니다. 영상이 준비된 후 다시 시도해 주세요.";
          }
        }
      });
    }

    if (chapters.length) outline.append(list);
    updateChapterButtons();

    const footer = document.createElement("p");
    footer.className = "lecture-chapter-footer";
    footer.textContent =
      Number.isInteger(data.duration) && data.duration > 0
        ? `등록된 영상 길이: ${formatChapterTime(data.duration)}`
        : "영상 길이 정보가 없습니다.";

    outline.append(footer);
  }

  showOutlineMessage("목차를 불러오는 중입니다.");

  const introduction = classroom.querySelector("#lesson-default > p");
  if (introduction) {
    introduction.textContent = "오른쪽 목차에서 강의 구성을 확인하세요.";
  }


  async function loadLearningInfo() {
    // 다른 강의의 예시 제목이 실제 정보처럼 보이지 않게 합니다.
    title.textContent = "강의 정보 확인 중";
    if (videoTitle) videoTitle.textContent = "강의 정보 확인 중";

    const session = getStoredSession();



    status.textContent = "학습 정보를 불러오는 중입니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${lectureId}/learn`,
        {
          headers: {
            Authorization: session?.authorization,
          },
          cache: "no-store",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const messages = {
          401: "로그인이 만료되었거나 인증할 수 없습니다. 다시 로그인해 주세요.",
          403: "이 강의를 수강할 권한이 없습니다. 수강 중인 강의를 선택해 주세요.",
          404: "강의를 찾을 수 없습니다.",
        };

        throw new Error(
          messages[response.status] ||
            data?.message ||
            "학습 정보를 불러오지 못했습니다.",
        );
      }

      if (
        data?.lectureId !== Number(lectureId) ||
        typeof data.name !== "string" ||
        typeof data.done !== "boolean"
      ) {
        throw new Error("학습 정보 응답 형식을 확인해 주세요.");
      }

      title.textContent = data.name;
      if (videoTitle) videoTitle.textContent = data.name;
      renderChapters(data);
      await prepareLessonVideo(data);

      status.textContent = "";
    } catch (error) {
      title.textContent = "학습 정보를 불러올 수 없습니다";
      if (videoTitle) videoTitle.textContent = "학습 정보 조회 실패";
      showOutlineMessage("학습 정보를 불러오지 못해 목차를 표시할 수 없습니다.");
      status.textContent = error.message;
    }
  }

  loadLearningInfo();
}


// 학습 화면의 강의자료 조회·다운로드
if (learningPathMatch && classroom) {
  const lectureId = learningPathMatch[1];
  const panel = document.getElementById("materials-panel");
  const menu = document.querySelector(
    '[data-lesson-panel="materials-panel"]',
  );

  if (panel && menu) {
    let loading = false;

    const heading = document.createElement("h2");
    heading.textContent = "강의자료";

    const message = document.createElement("p");
    message.setAttribute("role", "status");
    message.textContent = "강의자료 버튼을 누르면 자료를 조회합니다.";

    const download = document.createElement("button");
    download.type = "button";
    download.className = "btn primary";
    download.textContent = "자료 다운로드";
    download.hidden = true;

    panel.replaceChildren(heading, message, download);

    let filename = "강의자료";

    async function requestMaterial(path) {
      const session = getStoredSession();



      return authFetch(path, {
        headers: {
          Authorization: session?.authorization,
        },
        cache: "no-store",
      });
    }

    async function responseError(response) {
      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        return "로그인이 만료되었거나 인증할 수 없습니다. 다시 로그인해 주세요.";
      }

      if (response.status === 403) {
        return "이 강의의 자료를 이용할 수 있는 수강 권한이 없습니다.";
      }

      if (
        response.status === 404 &&
        body?.code === "MATERIAL_NOT_FOUND"
      ) {
        return "등록된 강의자료가 없습니다.";
      }

      return body?.message ||
        `강의자료 요청에 실패했습니다. HTTP ${response.status}`;
    }

    menu.addEventListener("click", async () => {
      // 메뉴를 닫을 때는 조회하지 않습니다.
      if (panel.hidden || loading) return;

      loading = true;
      download.hidden = true;
      message.textContent = "강의자료를 확인하고 있습니다.";

      try {
        const response = await requestMaterial(
          `/backend/lectures/${lectureId}/material`,
        );

        if (!response.ok) {
          throw new Error(await responseError(response));
        }

        const data = await response.json();

        if (
          data.lectureId !== Number(lectureId) ||
          typeof data.filename !== "string"
        ) {
          throw new Error("강의자료 응답 형식이 올바르지 않습니다.");
        }

        filename = data.filename;
        message.textContent = filename;
        download.hidden = false;
      } catch (error) {
        message.textContent =
          error instanceof TypeError
            ? "강의자료 서버에 연결하지 못했습니다."
            : error.message;
      } finally {
        loading = false;
      }
    });

    download.addEventListener("click", async () => {
      if (download.disabled) return;

      download.disabled = true;
      message.textContent = "자료 파일을 내려받고 있습니다.";

      try {
        const response = await requestMaterial(
          `/backend/lectures/${lectureId}/material/download`,
        );

        if (!response.ok) {
          throw new Error(await responseError(response));
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        message.textContent = "자료 파일의 다운로드를 요청했습니다.";
      } catch (error) {
        message.textContent =
          error instanceof TypeError
            ? "자료 파일을 내려받지 못했습니다. 연결 상태를 확인해 주세요."
            : error.message;
      } finally {
        download.disabled = false;
      }
    });
  }
}

// 학습 화면의 강의 질문 목록
if (learningPathMatch && classroom) {
  const lectureId = learningPathMatch[1];
  const panel = document.getElementById("qna-panel");
  const menu = document.querySelector(
    '[data-lesson-panel="qna-panel"]',
  );

  if (panel && menu) {
    // 예시 질문을 제거하고, 아직 연결하지 않은 작성 UI는 숨깁니다.
    panel.querySelectorAll(".qna-row").forEach((row) => row.remove());
    const writeButton = document.getElementById("write-question");
    const questionForm = document.getElementById("question-form");
    if (writeButton) writeButton.hidden = false;
    if (questionForm) questionForm.hidden = true;

    // 설계안의 제목·닉네임 행 구조를 유지합니다.
    const tableHead = panel.querySelector(".qna-table-head");

    const message = document.createElement("p");
    message.className = "lecture-qna-message";
    message.setAttribute("role", "status");

    const list = document.createElement("div");
    const pagination = document.createElement("div");
    pagination.className = "form-actions";

    panel.append(message, list, pagination);
    if (tableHead) list.before(tableHead);
    list.className = "lecture-qna-list";

    let page = 1;
    let loading = false;

    async function loadQuestions(nextPage = 1) {
      if (loading) return;

      loading = true;
      message.classList.remove("is-empty");
      message.textContent = "질문 목록을 불러오는 중입니다.";
      list.replaceChildren();
      pagination.replaceChildren();

      try {
        const session = getStoredSession();
        const headers = { Accept: "application/json" };

        if (session?.authorization) {
          headers.Authorization = session?.authorization;
        }

        const response = await authFetch(
          `/backend/lectures/${lectureId}/qna?page=${nextPage}&size=10`,
          {
            headers,
            cache: "no-store",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `질문 조회 실패: HTTP ${response.status}`,
          );
        }

        if (
          !Array.isArray(data?.questions) ||
          !Number.isInteger(data?.page?.current) ||
          !Number.isInteger(data?.page?.totalPages)
        ) {
          throw new Error("질문 목록 응답 형식이 올바르지 않습니다.");
        }

        page = data.page.current;

        for (const question of data.questions) {
          const row = document.createElement("article");
          row.className = "lecture-qna-item";

          const heading = document.createElement("h3");
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "lecture-qna-toggle";
          toggle.textContent =
            `${question.secret ? "🔒 " : ""}${question.title}`;
          toggle.setAttribute("aria-expanded", "false");
          toggle.disabled = question.accessible === false;

          heading.append(toggle);

          const info = document.createElement("p");
          info.className = "lecture-qna-author";
          info.textContent = question.nickname || "작성자";
          info.title = question.answered ? "답변 완료" : "답변 대기";

          row.append(heading, info);

                    const detail = document.createElement("div");
          detail.className = "lecture-qna-detail";
          detail.id = `lecture-qna-detail-${question.qid}`;
          detail.hidden = true;

          toggle.setAttribute("aria-controls", detail.id);
          row.append(detail);

          let detailLoading = false;

          toggle.addEventListener("click", async () => {
            if (detailLoading || question.accessible === false) return;

            // 이미 열려 있으면 접습니다.
            if (!detail.hidden) {
              detail.hidden = true;
              toggle.setAttribute("aria-expanded", "false");
              return;
            }

            detail.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
            detail.textContent = "질문 내용을 불러오는 중입니다.";
            detailLoading = true;

            try {
              const session = getStoredSession();
              const headers = { Accept: "application/json" };

              if (session?.authorization) {
                headers.Authorization = session?.authorization;
              }

              const response = await authFetch(
                `/backend/lectures/${lectureId}/qna/${question.qid}`,
                {
                  headers,
                  cache: "no-store",
                },
              );

              const data = await response.json().catch(() => null);

              if (response.status === 401) {
                throw new Error("로그인 후 다시 확인해 주세요.");
              }

              if (response.status === 403) {
                throw new Error("이 질문을 열람할 권한이 없습니다.");
              }

              if (response.status === 404) {
                throw new Error("질문을 찾을 수 없습니다.");
              }

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                    `질문 상세 조회 실패: HTTP ${response.status}`,
                );
              }

              if (
                data?.qid !== question.qid ||
                data?.lectureId !== Number(lectureId)
              ) {
                throw new Error("질문 상세 응답 형식이 올바르지 않습니다.");
              }

              const questionLabel = document.createElement("h4");
              questionLabel.textContent = "질문 내용";

              const questionText = document.createElement("p");
              // 서버가 굵게·기울임을 태그로 바꿔 questionHtml 로 준다.
              questionText.innerHTML =
                data.questionHtml || "작성된 본문이 없습니다.";

              const answerBox = document.createElement("section");
              answerBox.className = "lecture-qna-answer";

              const answerLabel = document.createElement("h4");
              answerLabel.textContent = "강사 답변";

              const answerText = document.createElement("p");
              const hasAnswer = Boolean(data.answer?.trim());

              answerText.innerHTML = hasAnswer
                ? data.answerHtml
                : "아직 답변이 등록되지 않았습니다.";

              answerBox.append(answerLabel, answerText);

              if (hasAnswer && data.answeredAt) {
                const answeredAt = document.createElement("p");
                answeredAt.className = "lecture-qna-date";
                answeredAt.textContent =
                  `답변 일시: ${data.answeredAt.replace("T", " ")}`;
                answerBox.append(answeredAt);
              }

              info.textContent = data.nickname || "작성자";
              info.title = hasAnswer ? "답변 완료" : "답변 대기";

              detail.replaceChildren(
                questionLabel,
                questionText,
                answerBox,
              );
            } catch (error) {
              detail.textContent =
                error instanceof TypeError
                  ? "질문 내용을 불러오지 못했습니다. 연결 상태를 확인해 주세요."
                  : error.message;
            } finally {
              detailLoading = false;
            }
          });


          if (question.accessible === false) {
            const restricted = document.createElement("p");
            restricted.className = "lecture-qna-restricted";
            restricted.textContent = "열람 권한이 없는 비밀글입니다.";
            row.append(restricted);
          }

          list.append(row);
        }

        message.classList.toggle(
          "is-empty",
          data.questions.length === 0,
        );

        message.textContent = data.questions.length
          ? `총 ${data.page.total}개의 질문`
          : "아직 등록된 질문이 없어요.\n강의를 듣다가 궁금한 점을 남겨 주세요.";

        if (data.page.totalPages > 1) {
          const previous = document.createElement("button");
          previous.type = "button";
          previous.className = "btn secondary";
          previous.textContent = "이전";
          previous.disabled = page <= 1;
          previous.addEventListener("click", () => {
            loadQuestions(page - 1);
          });

          const pageInfo = document.createElement("span");
          pageInfo.textContent = `${page} / ${data.page.totalPages}`;

          const next = document.createElement("button");
          next.type = "button";
          next.className = "btn secondary";
          next.textContent = "다음";
          next.disabled = page >= data.page.totalPages;
          next.addEventListener("click", () => {
            loadQuestions(page + 1);
          });

          pagination.append(previous, pageInfo, next);
        }
      } catch (error) {
        message.textContent =
          error instanceof TypeError
            ? "질문 서버에 연결하지 못했습니다."
            : error.message;
      } finally {
        loading = false;
      }
    }

        if (questionForm && writeButton) {
      const fieldset = questionForm.querySelector("fieldset");
      const titleInput = document.getElementById("question-title");
      const bodyInput = document.getElementById("question-body");
      const formStatus = questionForm.querySelector(".form-status");
      const submitButton = questionForm.querySelector(
        'button[type="submit"]',
      );
      const cancelButton = document.getElementById("cancel-question");

      fieldset.disabled = false;
      titleInput.maxLength = 200;
      bodyInput.maxLength = 4000;

      const secretLabel = document.createElement("label");
      secretLabel.className = "lecture-qna-secret";

      const secretInput = document.createElement("input");
      secretInput.type = "checkbox";

      const secretText = document.createElement("span");
      secretText.textContent = "비밀글로 작성";
      const secretHelp = document.createElement("p");
      secretHelp.className = "lecture-qna-secret-help";
      secretHelp.id = "question-secret-help";
      secretHelp.textContent = "선택하면 작성자와 담당 강사만 볼 수 있어요.";
      secretInput.setAttribute("aria-describedby", secretHelp.id);
      secretLabel.append(secretInput, secretText);

      fieldset.insertBefore(
        secretLabel,
        fieldset.querySelector(".form-actions"),
      );

      secretLabel.after(secretHelp);

      let posting = false;

      questionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (posting) return;

        const title = titleInput.value.trim();
        const question = bodyInput.value.trim();

        if (!title || !question) {
          formStatus.textContent = "질문 제목과 내용을 입력해 주세요.";
          return;
        }

        const session = getStoredSession();



        posting = true;
        fieldset.disabled = true;
        writeButton.disabled = true;
        cancelButton.disabled = true;
        submitButton.disabled = true;
        formStatus.textContent = "질문을 등록하고 있습니다.";

        try {
          const response = await authFetch(
            `/backend/lectures/${lectureId}/qna`,
            {
              method: "POST",
              headers: {
                Authorization: session?.authorization,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                title,
                question,
                secret: secretInput.checked,
              }),
            },
          );

          const data = await response.json().catch(() => null);

          if (response.status === 401) {
            throw new Error("인증할 수 없습니다. 다시 로그인해 주세요.");
          }

          if (response.status === 403) {
            throw new Error("수강 중인 강의에만 질문을 등록할 수 있습니다.");
          }

          if (response.status !== 201) {
            throw new Error(
              data?.message || `질문 등록 실패: HTTP ${response.status}`,
            );
          }

          questionForm.reset();
          questionForm.hidden = true;
          writeButton.setAttribute("aria-expanded", "false");
          formStatus.textContent = "";

          // 등록된 질문이 보이도록 첫 페이지를 다시 조회합니다.
          await loadQuestions(1);
        } catch (error) {
          formStatus.textContent =
            error instanceof TypeError
              ? "등록 결과를 확인하지 못했습니다. 목록을 확인한 뒤 다시 시도해 주세요."
              : error.message;
        } finally {
          posting = false;
          fieldset.disabled = false;
          writeButton.disabled = false;
          cancelButton.disabled = false;
          submitButton.disabled = false;
        }
      });
    }

    menu.addEventListener("click", () => {
      // 패널을 열 때만 조회합니다.
      if (!panel.hidden) loadQuestions(1);
    });
  }
}

// COURSE_REVIEWS_START
{
  const panel = document.querySelector('[data-panel="reviews"]');
  const tab = document.querySelector('[data-tab="reviews"]');
  const lectureId = new URLSearchParams(location.search).get("id");

  if (panel && tab && /^[1-9]\d*$/.test(lectureId || "")) {
    panel.querySelectorAll(".screen-note").forEach(el => el.remove());

    const status = document.createElement("p");
    status.className = "course-review-status";
    status.setAttribute("role", "status");

    const list = document.createElement("div");
    const navigation = document.createElement("nav");
    navigation.className = "course-review-pagination";
    navigation.setAttribute("aria-label", "수강평 페이지");

    const emptyReview = document.createElement("div");
    emptyReview.className = "empty-panel course-review-empty";
    emptyReview.hidden = true;
    const emptyIcon = document.createElement("span");
    emptyIcon.className = "empty-icon";
    emptyIcon.setAttribute("aria-hidden", "true");
    emptyIcon.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 5v15M12 5C9 3 6 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z"/></svg>';
    const emptyTitle = document.createElement("h3");
    emptyTitle.textContent = "첫 번째 학습 경험을 기다려요.";
    const emptyDescription = document.createElement("p");
    emptyDescription.textContent = "아직 등록된 수강평이 없습니다.";
    emptyReview.append(emptyIcon, emptyTitle, emptyDescription);
    panel.append(status, emptyReview, list, navigation);
    let loading = false;

    // REVIEW_EDIT_DELETE
    let mutating = false;

    function addReviewActions(card, review) {
      const memberId = Number(getStoredSession()?.member?.memberId);
      if (
        !Number.isSafeInteger(memberId) ||
        memberId <= 0 ||
        memberId !== Number(review.userId)
      ) return;

      const make = (tag, text = "") => {
        const element = document.createElement(tag);
        element.textContent = text;
        return element;
      };

      const controls = make("div");
      controls.className = "course-review-actions";

      const edit = make("button", "수정");
      edit.type = "button";
      edit.className = "btn secondary";

      const remove = make("button", "삭제");
      remove.type = "button";
      remove.className = "btn secondary";

      const form = make("form");
      form.className = "course-review-edit";
      form.hidden = true;

      const fields = make("fieldset");

      const starLabel = make("label", "별점");
      const select = make("select");
      for (let value = 1; value <= 5; value += 1) {
        const option = make("option", `${value}점`);
        option.value = String(value);
        select.append(option);
      }
      select.value = String(review.star);
      starLabel.append(select);

      const textLabel = make("label", "수강평 내용");
      const textarea = make("textarea");
      textarea.rows = 5;
      textarea.maxLength = 2000;
      textarea.required = true;
      textarea.value = review.review || "";
      textLabel.append(textarea);

      const buttons = make("div");
      buttons.className = "course-review-actions";

      const save = make("button", "수정 저장");
      save.type = "submit";
      save.className = "btn primary";

      const cancel = make("button", "취소");
      cancel.type = "button";
      cancel.className = "btn secondary";

      const message = make("p");
      message.className = "course-review-status";
      message.setAttribute("role", "status");

      buttons.append(cancel, save);
      fields.append(starLabel, textLabel, buttons);
      form.append(fields);
      controls.append(edit, remove);
      card.append(controls, form, message);

      edit.addEventListener("click", () => {
        if (mutating) return;
        select.value = String(review.star);
        textarea.value = review.review || "";
        form.hidden = false;
        controls.hidden = true;
        message.textContent = "";
        textarea.focus();
      });

      cancel.addEventListener("click", () => {
        if (mutating) return;
        form.hidden = true;
        controls.hidden = false;
        message.textContent = "";
        edit.focus();
      });

      async function changeReview(method, payload) {
        if (mutating || loading) return;

        const session = getStoredSession();
        if (
          Number(session.member?.memberId) !== memberId
        ) {
          message.textContent =
            "로그인 계정이 변경되었거나 로그아웃되었습니다. 새로고침해 주세요.";
          return;
        }

        mutating = true;
        fields.disabled = true;
        edit.disabled = true;
        remove.disabled = true;
        message.textContent = method === "DELETE"
          ? "수강평을 삭제하고 있습니다."
          : "수강평을 수정하고 있습니다.";

        let succeeded = false;

        try {
          const headers = {
            Authorization: session?.authorization,
            Accept: "application/json",
          };
          if (payload) headers["Content-Type"] = "application/json";

          const response = await authFetch(
            `/backend/lectures/${lectureId}/reviews`,
            {
              method,
              headers,
              ...(payload ? { body: JSON.stringify(payload) } : {}),
            },
          );

          const expectedStatus = method === "DELETE" ? 204 : 200;
          if (response.status !== expectedStatus) {
            const data = await response.json().catch(() => null);
            throw new Error(
              data?.message || `처리 실패: HTTP ${response.status}`,
            );
          }

          succeeded = true;
        } catch (error) {
          message.textContent = error instanceof TypeError
            ? "처리 결과를 확인하지 못했습니다. 새로고침하여 확인해 주세요."
            : error.message;
        } finally {
          mutating = false;
          fields.disabled = false;
          edit.disabled = false;
          remove.disabled = false;
        }

        // 수정·삭제 후 목록과 평균 별점을 함께 갱신합니다.
        if (succeeded) await loadReviews(1);
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = textarea.value.trim();
        if (!text) {
          message.textContent = "수강평 내용을 입력해 주세요.";
          return;
        }

        changeReview("PUT", {
          star: Number(select.value),
          review: text,
        });
      });

      remove.addEventListener("click", () => {
        if (mutating || loading) return;
        if (!window.confirm("내 수강평을 삭제하시겠습니까?")) return;
        changeReview("DELETE");
      });
    }


    async function loadReviews(page = 1) {
      if (loading || mutating) return;
      loading = true;
      status.classList.remove("is-empty");
      emptyReview.hidden = true;
      status.textContent = "수강평을 불러오는 중입니다.";
      list.replaceChildren();
      navigation.replaceChildren();

      try {
        const response = await fetch(
          `/backend/lectures/${lectureId}/reviews?page=${page}&size=5`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `수강평 조회 실패: HTTP ${response.status}`,
          );
        }

        if (
          !Array.isArray(data?.reviews) ||
          !Number.isInteger(data?.page?.current) ||
          !Number.isInteger(data?.page?.totalPages)
        ) {
          throw new Error("수강평 응답 형식이 올바르지 않습니다.");
        }

        const summary = document.getElementById("detail-review-summary");
        if (summary) {
          summary.textContent =
            typeof data.rating === "number"
              ? `평균 ${data.rating.toFixed(1)}점 · 수강평 ${data.reviewCount}개`
              : `수강평 ${data.reviewCount}개`;
        }

        for (const review of data.reviews) {
          const card = document.createElement("article");
          card.className = "course-review-card";

          const meta = document.createElement("div");
          meta.className = "course-review-meta";

          const author = document.createElement("strong");
          author.textContent = review.nickname || "수강생";

          const rating = document.createElement("span");
          rating.className = "course-review-rating";
          const star = Number(review.star);

          if (Number.isInteger(star) && star >= 1 && star <= 5) {
            rating.textContent = "★".repeat(star) + "☆".repeat(5 - star);
            rating.setAttribute("aria-label", `5점 만점에 ${star}점`);
          } else {
            rating.textContent = "평점 정보 없음";
          }

          meta.append(author, rating);

          const body = document.createElement("p");
          body.className = "course-review-body";
          body.textContent = review.review || "작성된 내용이 없습니다.";

          card.append(meta, body);

          if (review.created) {
            const date = document.createElement("time");
            date.dateTime = review.created;
            date.textContent = review.created.slice(0, 10);
            card.append(date);
          }

          addReviewActions(card, review);
          list.append(card);
        }

        emptyReview.hidden = data.reviews.length !== 0;
        status.textContent = "";

        if (data.page.totalPages > 1) {
          const current = data.page.current;

          const previous = document.createElement("button");
          previous.type = "button";
          previous.className = "btn secondary";
          previous.textContent = "이전";
          previous.disabled = current <= 1;
          previous.addEventListener("click", () => loadReviews(current - 1));

          const pageText = document.createElement("span");
          pageText.textContent = `${current} / ${data.page.totalPages}`;

          const next = document.createElement("button");
          next.type = "button";
          next.className = "btn secondary";
          next.textContent = "다음";
          next.disabled = current >= data.page.totalPages;
          next.addEventListener("click", () => loadReviews(current + 1));

          navigation.append(previous, pageText, next);
        }
      } catch (error) {
        status.textContent = error instanceof TypeError
          ? "수강평 서버에 연결하지 못했습니다. 탭을 다시 눌러 재시도해 주세요."
          : error.message;
      } finally {
        loading = false;
      }
    }

    tab.addEventListener("click", () => loadReviews(1));
  }
}
// COURSE_REVIEWS_END

// 내 학습 화면에서 /lectures/{id}/learn?panel=assignment|materials|qna 로 들어오면
// 모든 메뉴 처리가 등록된 뒤 해당 메뉴를 열어 둡니다.
{
  const panelKey = new URLSearchParams(location.search).get("panel");
  const panelIds = {
    assignment: "assignment-panel",
    materials: "materials-panel",
    qna: "qna-panel",
  };
  const menu =
    panelIds[panelKey] &&
    document.querySelector(`[data-lesson-panel="${panelIds[panelKey]}"]`);
  if (menu && byId(panelIds[panelKey])?.hidden) {
    menu.click();
    menu.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

// 수강평 작은 창 (/courses/reviews?id=강의번호&user=작성자번호)
// 공개 API GET /lectures/{lid} (강의 이름)와 GET /lectures/{lid}/reviews (수강평 목록)를 씁니다.
if (byId("review-popup")) {
  const params = new URLSearchParams(location.search);
  const lectureId = params.get("id") || "";
  const highlightUser = params.get("user") || "";
  const status = byId("review-popup-status");
  const list = byId("review-popup-list");
  const pages = byId("review-popup-pages");
  const size = 5;
  let page = 1; // 강의 수강평 API는 1페이지부터 셉니다.
  let totalPages = 0;

  byId("review-popup-close").addEventListener("click", () => {
    if (window.opener) window.close();
    else history.back();
  });

  const stars = (count) => "★".repeat(Math.max(0, Math.min(5, Number(count) || 0)));
  const dateText = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ko-KR");
  };

  async function loadReviews() {
    status.textContent = "수강평을 불러오는 중입니다.";
    try {
      const response = await fetch(
        `${API_BASE_URL}/lectures/${lectureId}/reviews?page=${page}&size=${size}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(response.status === 404 ? "강의를 찾을 수 없습니다." : "수강평을 불러오지 못했습니다.");
      const data = await response.json();
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];
      totalPages = Number(data.page?.totalPages) || 0;
      byId("review-popup-summary").textContent =
        data.reviewCount ? `수강평 ${data.reviewCount}개 · 평균 ★ ${data.rating ?? "-"}` : "";
      list.replaceChildren(
        ...reviews.map((review) => {
          const item = document.createElement("li");
          if (highlightUser && String(review.userId) === highlightUser) item.className = "is-selected";
          const meta = document.createElement("div");
          meta.className = "review-popup-meta";
          const name = document.createElement("strong");
          name.textContent = review.nickname || "수강생";
          const star = document.createElement("span");
          star.className = "review-popup-stars";
          star.textContent = stars(review.star);
          star.setAttribute("aria-label", `${review.star}점`);
          const date = document.createElement("time");
          date.textContent = dateText(review.created);
          meta.append(name, star, date);
          const body = document.createElement("p");
          body.textContent = review.review || "";
          item.append(meta, body);
          return item;
        }),
      );
      status.textContent = reviews.length ? "" : "아직 등록된 수강평이 없습니다.";
      pages.hidden = totalPages <= 1;
      byId("review-popup-page").textContent = `${page} / ${Math.max(totalPages, 1)}`;
      byId("review-popup-prev").disabled = page <= 1;
      byId("review-popup-next").disabled = page >= totalPages;
      list.querySelector(".is-selected")?.scrollIntoView({ block: "center" });
    } catch (error) {
      status.textContent =
        error instanceof TypeError ? "서버에 연결하지 못했습니다." : error.message;
    }
  }

  if (!/^[1-9]\d*$/.test(lectureId)) {
    status.textContent = "강의 번호가 올바르지 않습니다.";
  } else {
    byId("review-popup-course").href = `${forumBase}/courses/detail?id=${encodeURIComponent(lectureId)}`;
    fetch(`${API_BASE_URL}/lectures/${lectureId}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((lecture) => {
        if (typeof lecture?.name === "string") {
          byId("review-popup-title").textContent = `${lecture.name} 수강평`;
          document.title = `${lecture.name} 수강평 · 새싹에듀`;
        }
      })
      .catch(() => {});
    byId("review-popup-prev").addEventListener("click", () => {
      if (page > 1) { page -= 1; loadReviews(); }
    });
    byId("review-popup-next").addEventListener("click", () => {
      if (page < totalPages) { page += 1; loadReviews(); }
    });
    loadReviews();
  }
}
