import { mountHeader } from "../ui/header.js";
// JSP 본문을 유지한 채 공통 헤더만 React로 연결합니다.
const header = document.getElementById("shared-header");
if (header) mountHeader(header);
const byId = (id) => document.getElementById(id);
const all = (selector) => [...document.querySelectorAll(selector)];
const on = (id, event, callback) => byId(id)?.addEventListener(event, callback);
// 시연 화면에는 계정/게시글 저장 서버가 없습니다. 입력값을 전송하거나 보관하지 않습니다.
["login-form", "signup-form", "question-form"].forEach((id) => {
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
on("show-login-error", "click", () => {
  byId("login-error").hidden = false;
  byId("pw").classList.add("invalid");
});
// 인증 상태 변화는 UI 시연용입니다. 실제 인증은 백엔드가 검증해야 합니다.
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
if (byId("course-search")) {
  const cards = all("[data-course]");
  const chips = all(".category-tabs [data-category]");
  const params = new URLSearchParams(location.search);
  let category = chips.some(
    (b) => b.dataset.category === params.get("category"),
  )
    ? params.get("category")
    : "웹 보안";
  byId("course-search").value = params.get("q") || "";
  const apply = () => {
    let count = 0;
    const q = byId("course-search").value.trim().toLowerCase();
    cards.forEach((card) => {
      card.hidden = !(
        (category === "전체" || card.dataset.category === category) &&
        card.textContent.toLowerCase().includes(q) &&
        (byId("level-filter").value === "all" ||
          byId("level-filter").value === card.dataset.level)
      );
      if (!card.hidden) count++;
    });
    chips.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.category === category)),
    );
    byId("catalog-title").textContent = category + " 강의";
    byId("course-count").textContent = count;
    byId("course-empty").hidden = count !== 0;
    const sorted = [...cards];
    const sort = byId("sort-filter").value;
    if (sort !== "default")
      sorted.sort(
        (a, b) =>
          (Number(a.dataset.price) - Number(b.dataset.price)) *
          (sort === "low" ? 1 : -1),
      );
    sorted.forEach((card) =>
      document.querySelector(".course-grid").append(card),
    );
  };
  chips.forEach((b) =>
    b.addEventListener("click", () => {
      category = b.dataset.category;
      apply();
    }),
  );
  on("course-search", "input", apply);
  on("level-filter", "change", apply);
  on("sort-filter", "change", apply);
  on("reset-courses", "click", () => {
    category = "전체";
    byId("course-search").value = "";
    byId("level-filter").value = "all";
    apply();
  });
  apply();
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
