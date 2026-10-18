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
const byId = (id) => document.getElementById(id);
const all = (selector) => [...document.querySelectorAll(selector)];
const on = (id, event, callback) => byId(id)?.addEventListener(event, callback);
// 시연 화면에는 계정/게시글 저장 서버가 없습니다. 입력값을 전송하거나 보관하지 않습니다.
[ "signup-form", "question-form"].forEach((id) => {
  const form = byId(id);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector(".form-status").textContent =
      id === "login-form"
        ? "화면 미리보기입니다. 인증 서버 연결 전이라 실제 로그인은 진행되지 않습니다."
        : id === "signup-form"
          ? "입력 확인 완료. 실제 계정은 생성되지 않습니다."
          : "입력 확인 완료. 질문은 서버에 저장되지 않습니다.";
  });
});



if (byId("signup-form")) {
  const form = byId("signup-form");
  let verified = false;
  const update = () => {
    const mismatch =
      byId("pwcheck").value !== "" &&
      byId("pwcheck").value !== byId("pw").value;
    byId("pwcheck").setCustomValidity(
      mismatch ? "비밀번호가 일치하지 않습니다." : "",
    );
    byId("password-error").hidden = !mismatch;
    byId("signup-submit").disabled = !verified || !form.checkValidity();
  };
  const request = () => {
    if (!byId("email").reportValidity()) return;
    verified = false;
    byId("verification").hidden = false;
    byId("email-status").className = "field-status";
    byId("email-status").textContent =
      "인증 화면 미리보기입니다. 실제 메일은 발송하지 않았어요.";
    byId("code-status").textContent = "예시 인증번호: 123456";
    update();
  };
  on("check-email", "click", request);
  on("resend-code", "click", request);
  on("verify-code", "click", () => {
    verified = byId("code").value === "123456";
    byId("code-status").textContent = verified
      ? "인증 완료 상태 미리보기입니다."
      : "인증번호가 올바르지 않습니다. 다시 확인해 주세요.";
    byId("code-status").className = verified
      ? "field-status"
      : "field-status error";
    update();
  });
  on("email", "input", () => {
    verified = false;
    byId("verification").hidden = true;
    byId("email-status").textContent = "";
    update();
  });
  on("duplicate-email", "click", () => {
    verified = false;
    byId("email-status").className = "field-status error";
    byId("email-status").textContent =
      "이미 사용 중인 이메일입니다. (중복 상태 미리보기)";
    update();
  });
  form.addEventListener("input", update);
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

    card.append(
      art,
      makeElement("span", "pill", lecture.level || "난이도 미정"),
      makeElement("h3", "", lecture.name),
      makeElement(
        "p",
        "",
        `${lecture.category || ""} · ${lecture.instructor || "강사 미정"}`,
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
      const response = await fetch(`/backend/lectures?${query}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

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
      const response = await fetch(
        `/backend/lectures/${encodeURIComponent(lectureId)}`,
        {
          headers: { Accept: "application/json" },
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
        typeof data.price !== "number"
      ) {
        throw new Error("강의 상세 응답 형식이 올바르지 않습니다.");
      }
      // 상세 API에서 받은 강사 정보입니다. 없으면 빈 객체를 사용합니다.
      const teacher = data.instructor || {};
      // 선택한 강의의 학습 화면으로 이동하도록 연결합니다.
      // 이 링크 자체가 로그인·수강 권한을 확인하는 것은 아닙니다.
      const classroomLink = document.querySelector(
        "[data-preview-classroom-link]",
      );

      if (classroomLink) {
        const contextPath = classroomLink.dataset.contextPath || "";
        classroomLink.href =
          `${contextPath}/lectures/${encodeURIComponent(lectureId)}/learn`;
        classroomLink.hidden = false;
      }

      // 상단 배너
      document.title = `${data.name} · 새싹에듀`;
      setText(
        "detail-category-level",
        [data.category, data.level].filter(Boolean).join(" / "),
      );
      setText("detail-name", data.name);
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

      setText("teacher-catchphrase", teacher.catchphrase);
      byId("teacher-catchphrase").hidden = !teacher.catchphrase;

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
        `${data.price.toLocaleString("ko-KR")}원`,
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
      if (data.viewerState === "guest" && data.action === "purchase") {
        purchase.hidden = false;
        setText(
          "purchase-status",
          "수강하려면 로그인이 필요합니다. 로그인·결제 연결은 준비 중입니다.",
        );
      } else if (data.viewerState === "enrolled") {
        setText(
          "purchase-status",
          "수강 중인 강의입니다. 학습 화면 연결은 준비 중입니다.",
        );
      } else {
        setText(
          "purchase-status",
          "구매·수강 기능 연결은 준비 중입니다.",
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
all("[data-video-note]").forEach((b) =>
  b.addEventListener("click", () => {
    b.parentElement.querySelector(".video-status").textContent =
      "영상 파일 연결 전입니다. 실제 재생은 지원하지 않습니다.";
  }),
);
on("open-purchase", "click", () => byId("purchase-dialog").showModal());
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
  return session ? { Authorization: session.authorization } : {};
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
      ? `${forumBase}/courses/detail?id=${encodeURIComponent(post.lectureId)}`
      : `${forumBase}/community/detail?id=${encodeURIComponent(post.postId)}`;
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
      const loggedIn = Boolean(getSession());
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
    if (sending || !form.reportValidity()) return;
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
// 본문 입력의 간단한 표시(**굵게**, *기울임*, - 목록, [링크](주소))를 HTML로 바꿔 보냅니다.
// 서버가 허용 서식만 다시 걸러 저장합니다.
const forumEscape = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const forumInline = (text) =>
  forumEscape(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
const forumToHtml = (text) =>
  text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((line) => /^\s*-\s+/.test(line))) {
        return `<ul>${lines.map((line) => `<li>${forumInline(line.replace(/^\s*-\s+/, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map(forumInline).join("<br>")}</p>`;
    })
    .join("");

if (byId("post-form")) {
  const form = byId("post-form");
  const status = byId("post-write-status");
  if (!getSession()) {
    status.textContent = "글을 등록하려면 먼저 로그인해 주세요.";
  }
  let sending = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (!getStoredSession()) {
      status.textContent = "글을 등록하려면 먼저 로그인해 주세요.";
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
          content: forumToHtml(byId("post-body").value),
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
all("[data-format]").forEach((b) =>
  b.addEventListener("click", () => {
    const input = byId("post-body");
    const value =
      input.value.slice(input.selectionStart, input.selectionEnd) || "내용";
    const marks = {
      bold: "**" + value + "**",
      italic: "*" + value + "*",
      list: "\n- " + value,
      link: "[" + value + "](https://example.com)",
    };
    input.setRangeText(
      marks[b.dataset.format],
      input.selectionStart,
      input.selectionEnd,
      "end",
    );
    input.focus();
  }),
);
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

    if (submitting || !loginForm.reportValidity()) return;

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
      status.textContent = "로그인되었습니다. 메인으로 이동합니다.";

      // 로그인 화면을 메인 화면으로 대체합니다.
      window.location.replace((header?.dataset.basePath || "") + "/");
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