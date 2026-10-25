import {
  getStoredSession,
  authFetch,
} from "../ui/header.js";

const assignmentArea = document.getElementById("assignment-area");
const learningMatch = location.pathname.match(
  /^\/lectures\/([1-9]\d*)\/learn$/,
);

if (assignmentArea) {
  // 실제 서버 연동 전의 예시 과제와 제출 미리보기를 숨깁니다.
  for (const child of assignmentArea.children) {
    child.hidden = true;
  }

  const card = document.createElement("article");
  card.className = "assignment-card assignment-guide";

  const title = document.createElement("h2");
  title.textContent = "과제 안내";

  const status = document.createElement("p");
  status.setAttribute("role", "status");

  const content = document.createElement("p");
  content.style.whiteSpace = "pre-wrap";

  const fileType = document.createElement("p");
  const submissionState = document.createElement("div");
  submissionState.className = "assignment-submission-state";
  const submissionCard = document.createElement("article");
  submissionCard.className = "assignment-card assignment-live-submission";
  submissionCard.hidden = true;

  card.append(
    title,
    status,
    content,
    submissionState,
  );
  const assignmentBottom = document.createElement("div");
  assignmentBottom.className = "assignment-bottom";
  assignmentBottom.append(fileType, submissionState);
  card.append(assignmentBottom);
  assignmentArea.append(card);
  const submitForm = document.createElement("form");
  submitForm.className = "assignment-card";
  submitForm.hidden = true;

  const label = document.createElement("label");
  label.htmlFor = "assignment-api-note";
  label.textContent = "제출 메모";

  const noteInput = document.createElement("textarea");
  noteInput.id = "assignment-api-note";
  noteInput.rows = 8;
  noteInput.maxLength = 3000;
  noteInput.placeholder = "과제 내용을 입력해 주세요. 최대 3000자입니다. 파일만 제출해도 됩니다.";

  // 과제 첨부 파일 (선택). 먼저 /assignments/file 로 올린 뒤 받은 경로를 제출에 넣습니다.
  const FILE_LABEL = "첨부 파일 (선택, 10MB 이하)";
  const fileLabel = document.createElement("label");
  fileLabel.htmlFor = "assignment-api-file";
  fileLabel.textContent = FILE_LABEL;
  const fileInput = document.createElement("input");
  fileInput.id = "assignment-api-file";
  fileInput.type = "file";
  fileInput.accept = ".pdf,.zip,.docx,.hwp,.pptx,.png,.jpg,.jpeg,.txt";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "btn primary";
  submitButton.textContent = "과제 제출";

  const submitMessage = document.createElement("p");
  submitMessage.setAttribute("role", "status");

  submitForm.append(fileLabel, fileInput, label, noteInput, submitButton, submitMessage);
  assignmentArea.append(submitForm, submissionCard);
  const submitHeading = document.createElement("h2");
  submitHeading.textContent = "과제 제출";
  submitForm.prepend(submitHeading);

  let submitting = false;
  let currentSubmission = null;
  let assignmentTitle = "";
  let editing = false;

  const make = (tag, text, className = "") => {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  };

  const actions = document.createElement("div");
  actions.className = "form-actions";
  actions.hidden = true;

  // 피드백 확인·다운로드 결과는 내 제출 카드 안에 보여 줍니다.
  const submissionMessage = document.createElement("p");
  submissionMessage.setAttribute("role", "status");

  // 강사 피드백은 처음에 접어 두고, 버튼을 누르면 이 제출물 바로 아래에 펼칩니다.
  const feedbackPanel = document.createElement("section");
  feedbackPanel.id = "assignment-feedback-panel";
  feedbackPanel.className = "assignment-feedback-inline";
  feedbackPanel.hidden = true;

  const feedbackButton = document.createElement("button");
  feedbackButton.type = "button";
  feedbackButton.className = "btn secondary";
  feedbackButton.textContent = "피드백 확인";
  feedbackButton.setAttribute("aria-controls", feedbackPanel.id);
  feedbackButton.setAttribute("aria-expanded", "false");

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn secondary";
  editButton.textContent = "수정";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn secondary";
  deleteButton.textContent = "삭제";

  actions.append(feedbackButton, editButton, deleteButton);
  submissionCard.append(actions);

  const cancelEdit = document.createElement("button");
  cancelEdit.type = "button";
  cancelEdit.className = "btn secondary";
  cancelEdit.textContent = "수정 취소";
  cancelEdit.hidden = true;
  const submitActions = document.createElement("div");
  submitActions.className = "form-actions assignment-submit-actions";
  submitActions.append(cancelEdit, submitButton);
  submitForm.insertBefore(submitActions, submitMessage);

  editButton.addEventListener("click", () => {
    if (submitting || !currentSubmission) return;

    editing = true;
    noteInput.value = currentSubmission.note || "";
    // 새 파일을 고르지 않으면 서버가 기존 첨부를 그대로 둡니다.
    fileLabel.textContent = currentSubmission.filename
      ? `${FILE_LABEL} · 현재 첨부: ${currentSubmission.filename} (새 파일을 고르면 바뀝니다)`
      : FILE_LABEL;
    submitButton.textContent = "수정 저장";
    submitMessage.textContent = "";
    cancelEdit.hidden = false;
    submitForm.hidden = false;
    actions.hidden = true;
    closeFeedback();
    noteInput.focus();
  });

  cancelEdit.addEventListener("click", () => {
    if (submitting) return;

    editing = false;
    submitForm.hidden = true;
    cancelEdit.hidden = true;
    actions.hidden = false;
    fileLabel.textContent = FILE_LABEL;
    submitMessage.textContent = "";
  });

  function closeFeedback() {
    feedbackPanel.hidden = true;
    feedbackButton.textContent = "피드백 확인";
    feedbackButton.setAttribute("aria-expanded", "false");
  }

  // 점수·피드백·피드백 일시를 접힌 패널에 채웁니다.
  function fillFeedback(submission) {
    const isScored = submission.score !== null &&
      submission.score !== undefined;
    const heading = make("h3", "강사 피드백");

    if (!submission.feedback?.trim() && !isScored) {
      feedbackPanel.replaceChildren(
        heading,
        make("p", "아직 강사 피드백이 없습니다. 피드백이 등록되면 여기에서 확인할 수 있어요."),
      );
      return;
    }

    feedbackPanel.replaceChildren(heading);
    if (isScored) feedbackPanel.append(make("p", `점수: ${submission.score}점`, "assignment-score"));
    if (submission.feedback?.trim()) {
      feedbackPanel.append(make("p", submission.feedback, "assignment-memo"));
    }
    if (submission.feedbackAt) {
      feedbackPanel.append(make("p",
        `피드백 일시: ${submission.feedbackAt.replace("T", " ")}`, "assignment-feedback-date"));
    }
  }

  // GET /assignments/{aid} — 누를 때마다 서버에서 제출물을 다시 읽어 최신 피드백을 펼칩니다.
  // 페이지를 연 뒤에 강사가 남긴 피드백도 새로고침 없이 볼 수 있습니다.
  feedbackButton.addEventListener("click", async () => {
    if (submitting || !currentSubmission || !learningMatch) return;

    if (!feedbackPanel.hidden) {
      closeFeedback();
      return;
    }

    const session = getStoredSession();



    feedbackButton.disabled = true;
    submissionMessage.textContent = "강사 피드백을 확인하고 있습니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${learningMatch[1]}/assignments/${currentSubmission.assignmentId}`,
        {
          headers: {
            Authorization: session?.authorization,
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error("로그인이 만료되었거나 인증할 수 없습니다. 다시 로그인해 주세요.");
      }

      if (response.status === 403) {
        throw new Error("이 강의의 과제를 조회할 수강 권한이 없습니다.");
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `과제 상세 조회 실패: HTTP ${response.status}`,
        );
      }

      if (data?.assignmentId !== currentSubmission.assignmentId) {
        throw new Error("과제 상세 응답 형식이 올바르지 않습니다.");
      }

      // 상태 배지도 최신 값으로 다시 그린 뒤 피드백을 펼칩니다.
      showSubmission(data);
      fillFeedback(data);
      feedbackPanel.hidden = false;
      feedbackButton.textContent = "피드백 접기";
      feedbackButton.setAttribute("aria-expanded", "true");
      submissionMessage.textContent = "";
    } catch (error) {
      submissionMessage.textContent =
        error instanceof TypeError
          ? "과제 서버에 연결하지 못했습니다."
          : error.message;
    } finally {
      feedbackButton.disabled = false;
    }
  });

  // GET /assignments/{aid}/file — 제출한 첨부 파일을 원래 이름으로 내려받습니다.
  async function downloadSubmissionFile(button) {
    if (!currentSubmission || !learningMatch) return;

    const session = getStoredSession();



    button.disabled = true;
    submissionMessage.textContent = "제출한 파일을 내려받고 있습니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${learningMatch[1]}/assignments/${currentSubmission.assignmentId}/file`,
        {
          headers: { Authorization: session?.authorization },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          throw new Error("로그인이 만료되었거나 인증할 수 없습니다. 다시 로그인해 주세요.");
        }

        if (
          response.status === 404 &&
          data?.code === "SUBMISSION_FILE_NOT_FOUND"
        ) {
          throw new Error("제출한 파일을 찾을 수 없습니다.");
        }

        throw new Error(
          data?.message || `파일 다운로드 실패: HTTP ${response.status}`,
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = currentSubmission.filename || "submission";
      document.body.append(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      submissionMessage.textContent = "제출한 파일의 다운로드를 요청했습니다.";
    } catch (error) {
      submissionMessage.textContent =
        error instanceof TypeError
          ? "파일을 내려받지 못했습니다. 연결 상태를 확인해 주세요."
          : error.message;
    } finally {
      button.disabled = false;
    }
  }

  deleteButton.addEventListener("click", async () => {
    if (submitting || !currentSubmission || !learningMatch) return;

    if (!window.confirm("제출한 과제를 삭제하시겠습니까?")) return;

    const session = getStoredSession();



    submitting = true;
    editButton.disabled = true;
    deleteButton.disabled = true;
    status.textContent = "제출한 과제를 삭제하고 있습니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${learningMatch[1]}/assignments/${currentSubmission.assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: session?.authorization,
            Accept: "application/json",
          },
        },
      );

      // 삭제 성공 응답은 본문이 없는 204입니다.
      if (response.status !== 204) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || `삭제 실패: HTTP ${response.status}`,
        );
      }

      noteInput.value = "";
      await loadAssignment();
    } catch (error) {
      status.textContent =
        error instanceof TypeError
          ? "삭제 결과를 확인하지 못했습니다. 새로고침하여 제출 상태를 확인해 주세요."
          : error.message;
    } finally {
      submitting = false;
      editButton.disabled = false;
      deleteButton.disabled = false;
    }
  });


  submitForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitting || !learningMatch) return;

    const note = noteInput.value.trim();
    const file = fileInput.files?.[0] ?? null;
    // 수정할 때 기존 첨부가 있으면 내용을 비워도 첨부는 남습니다.
    const keepsFile = editing && Boolean(currentSubmission?.filename);

    if (!note && !file && !keepsFile) {
      submitMessage.textContent = "파일을 첨부하거나 과제 내용을 입력해 주세요.";
      return;
    }


    const session = getStoredSession();



    submitting = true;
    submitButton.disabled = true;
        submitMessage.textContent = editing
      ? "과제를 수정하고 있습니다."
      : "과제를 제출하고 있습니다.";

    const isEditing = editing;
    const requestUrl = isEditing
      ? `/backend/lectures/${learningMatch[1]}/assignments/${currentSubmission.assignmentId}`
      : `/backend/lectures/${learningMatch[1]}/assignments`;

    try {
      // 1) 파일이 있으면 먼저 업로드해서 저장 경로를 받습니다.
      let uploaded = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await authFetch(
          `/backend/lectures/${learningMatch[1]}/assignments/file`,
          {
            method: "POST",
            headers: { Authorization: session?.authorization, Accept: "application/json" },
            body: formData,
          },
        );
        const uploadData = await uploadResponse.json().catch(() => null);
        if (uploadResponse.status !== 201 || !uploadData?.work) {
          throw new Error(uploadData?.message || `파일 업로드 실패: HTTP ${uploadResponse.status}`);
        }
        uploaded = uploadData;
      }

      // 2) 내용과 파일 경로를 제출합니다.
      const response = await authFetch(
        requestUrl,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: session?.authorization,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            uploaded
              ? { note, work: uploaded.work, workFilename: uploaded.workFilename }
              : { note },
          ),
        },
      );

      const data = await response.json().catch(() => null);

      if (response.status === 409 && data?.code === "ALREADY_SUBMITTED") {
        await loadAssignment();
        submitMessage.textContent =
          "이미 제출된 과제가 있습니다. 제출 상태를 다시 확인했습니다.";
        return;
      }

      if (response.status === 401) {
        throw new Error("인증할 수 없습니다. 다시 로그인해 주세요.");
      }

      if (response.status === 403) {
        throw new Error("이 강의의 과제를 제출할 권한이 없습니다.");
      }

      if (response.status !== (isEditing ? 200 : 201)) {
        throw new Error(
          data?.message || `과제 제출 실패: HTTP ${response.status}`,
        );
      }

      // 제출 성공 후 서버에서 저장된 내용을 다시 읽습니다.
      fileInput.value = "";
      await loadAssignment();
    } catch (error) {
      submitMessage.textContent =
        error instanceof TypeError
          ? "제출 결과를 확인하지 못했습니다. 다시 조회하여 저장 여부를 확인해 주세요."
          : error.message;
    } finally {
      submitting = false;
      submitButton.disabled = false;
    }
  });

  // 제출물 한 건(과제 안내의 submission 또는 상세 API 응답)으로 내 제출 카드를 그립니다.
  // 카드에는 피드백 상태(배지)만 보이고, 피드백 내용은 '피드백 확인'을 눌러야 펼쳐집니다.
  function showSubmission(submission) {
    currentSubmission = submission;

    // 0점도 채점된 점수이므로 값의 존재 여부로 확인합니다.
    const isScored = submission.score !== null &&
      submission.score !== undefined;
    // 채점된 제출물은 수정·삭제 버튼을 숨기고, 피드백 확인은 그대로 둡니다.
    editButton.hidden = isScored;
    deleteButton.hidden = isScored;
    actions.hidden = false;

    const feedbackState = isScored
      ? "채점 완료"
      : submission.feedback?.trim() ? "피드백 도착" : "피드백 대기";
    const headingRow = make("div", "", "section-heading");
    headingRow.append(
      make("h2", "내가 제출한 과제"),
      make("span", feedbackState, "assignment-badge"),
    );
    const submittedAt = make("p", submission.submittedAt
      ? `제출 일시: ${submission.submittedAt.replace("T", " ")}` : "");
    submissionCard.replaceChildren(
      headingRow, submittedAt, make("h3", assignmentTitle),
      make("p", submission.note || "작성된 내용이 없습니다.", "assignment-memo"),
      actions, feedbackPanel, submissionMessage,
    );
    if (submission.filename) {
      const attachment = make("div", "", "assignment-download");
      const fileButton = make("button", "파일 다운로드", "btn secondary");
      fileButton.type = "button";
      fileButton.addEventListener("click", () => downloadSubmissionFile(fileButton));
      attachment.append(make("strong", submission.filename), fileButton);
      actions.before(attachment);
    }
    submissionCard.hidden = false;
  }

  async function loadAssignment() {
    if (!learningMatch) {
      status.textContent =
        "강의 상세에서 해당 강의의 학습 화면으로 이동해 주세요.";
      return;
    }

    const lectureId = learningMatch[1];
    const session = getStoredSession();

    title.textContent = "과제 안내";
    currentSubmission = null;
    editing = false;
    actions.hidden = true;
    cancelEdit.hidden = true;
    submitButton.textContent = "과제 제출";
    submitMessage.textContent = "";
    submissionMessage.textContent = "";
    fileLabel.textContent = FILE_LABEL;
     submitForm.hidden = true;
    content.textContent = "";
    fileType.textContent = "";
    submissionState.textContent = "";
    submissionCard.hidden = true;
    closeFeedback();




    status.textContent = "과제를 불러오는 중입니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${lectureId}/assignment`,
        {
          headers: {
            Accept: "application/json",
            Authorization: session?.authorization,
          },
          cache: "no-store",
        },
      );

      const data = await response.json().catch(() => null);

      if (
        response.status === 404 &&
        data?.code === "ASSIGNMENT_NOT_FOUND"
      ) {
        status.textContent = "등록된 과제가 없습니다.";
        return;
      }

      if (response.status === 401) {
        throw new Error(
          "로그인이 만료되었거나 인증할 수 없습니다. 다시 로그인해 주세요.",
        );
      }

      if (response.status === 403) {
        throw new Error("이 강의의 과제를 조회할 수강 권한이 없습니다.");
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `과제 조회 실패: HTTP ${response.status}`,
        );
      }

      if (
        data?.lectureId !== Number(lectureId) ||
        typeof data.title !== "string"
      ) {
        throw new Error("과제 안내 응답 형식이 올바르지 않습니다.");
      }

      title.textContent = data.title;
      content.textContent = data.content || "등록된 과제 설명이 없습니다.";
      fileType.textContent = data.fileType
        ? `제출 파일 형식: ${data.fileType}`
        : "제출 파일 형식 안내가 없습니다.";

            submissionState.style.whiteSpace = "pre-wrap";


      assignmentTitle = data.title;

      if (data.submission) {
        showSubmission(data.submission);
        submissionState.append(make("span", "제출 완료", "assignment-badge"));
        submitForm.hidden = true;
      } else {
        submissionState.textContent = "내 제출 상태: 미제출";
        submitForm.hidden = false;
      }

      status.textContent = "";

    } catch (error) {
      status.textContent =
        error instanceof TypeError
          ? "과제 서버에 연결하지 못했습니다."
          : error.message;
    }
  }

  loadAssignment();
}