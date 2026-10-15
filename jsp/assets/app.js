import { mountHeader, saveSession } from "../ui/header.js";
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
if (byId("post-search")) {
  let category = "전체";
  const chips = all(".community-tabs button");
  const apply = () => {
    let count = 0;
    all("[data-post]").forEach((post) => {
      post.hidden = !(
        (category === "전체" || post.dataset.category === category) &&
        post.textContent.includes(byId("post-search").value.trim())
      );
      if (!post.hidden) count++;
    });
    byId("post-empty").hidden = count !== 0;
    chips.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.textContent === category)),
    );
  };
  chips.forEach((b) =>
    b.addEventListener("click", () => {
      category = b.textContent;
      apply();
    }),
  );
  on("post-search", "input", apply);
}
on("post-form", "submit", (event) => {
  event.preventDefault();
  if (event.target.reportValidity())
    location.assign((header?.dataset.basePath || "") + "/community/done");
});
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