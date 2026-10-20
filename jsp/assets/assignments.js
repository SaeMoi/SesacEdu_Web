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
  const feedbackCard = document.createElement("article");
  feedbackCard.className = "assignment-card assignment-feedback";
  feedbackCard.hidden = true;

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
  const fileLabel = document.createElement("label");
  fileLabel.htmlFor = "assignment-api-file";
  fileLabel.textContent = "첨부 파일 (선택, 10MB 이하)";
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
  assignmentArea.append(submitForm, submissionCard, feedbackCard);
  const submitHeading = document.createElement("h2");
  submitHeading.textContent = "과제 제출";
  submitForm.prepend(submitHeading);

  let submitting = false;
    let currentSubmission = null;
  let editing = false;

  const actions = document.createElement("div");
  actions.className = "form-actions";
  actions.hidden = true;

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn secondary";
  editButton.textContent = "수정";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn secondary";
  deleteButton.textContent = "삭제";

  actions.append(editButton, deleteButton);
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
    submitButton.textContent = "수정 저장";
    submitMessage.textContent = "";
    cancelEdit.hidden = false;
    submitForm.hidden = false;
    actions.hidden = true;
    noteInput.focus();
  });

  cancelEdit.addEventListener("click", () => {
    if (submitting) return;

    editing = false;
    submitForm.hidden = true;
    cancelEdit.hidden = true;
    actions.hidden = false;
    submitMessage.textContent = "";
  });

  deleteButton.addEventListener("click", async () => {
    if (submitting || !currentSubmission || !learningMatch) return;

    if (!window.confirm("제출한 과제를 삭제하시겠습니까?")) return;

    const session = getStoredSession();

    if (!session?.authorization) {
      status.textContent = "로그인 후 이용해 주세요.";
      return;
    }

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
            Authorization: session.authorization,
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

    if (!note && !file) {
      submitMessage.textContent = "파일을 첨부하거나 과제 내용을 입력해 주세요.";
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      submitMessage.textContent = "과제 파일은 10MB까지 올릴 수 있습니다.";
      return;
    }

    const session = getStoredSession();

    if (!session?.authorization) {
      submitMessage.textContent = "로그인 후 제출해 주세요.";
      return;
    }

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
            headers: { Authorization: session.authorization, Accept: "application/json" },
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
            Authorization: session.authorization,
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
     submitForm.hidden = true;
    content.textContent = "";
    fileType.textContent = "";
    submissionState.textContent = "";
    submissionCard.hidden = true;
    feedbackCard.hidden = true;


    if (!session?.authorization) {
      status.textContent = "로그인 후 이용해 주세요.";
      return;
    }

    status.textContent = "과제를 불러오는 중입니다.";

    try {
      const response = await authFetch(
        `/backend/lectures/${lectureId}/assignment`,
        {
          headers: {
            Accept: "application/json",
            Authorization: session.authorization,
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


        if (data.submission) {
          const submission = data.submission;
          currentSubmission = submission;


        // 0점도 채점된 점수이므로 값의 존재 여부로 확인합니다.
        const isScored = submission.score !== null &&
          submission.score !== undefined;
                // 채점된 제출물은 서버에서도 수정·삭제를 허용하지 않습니다.
        actions.hidden = isScored;

        // 현재 수정 기능은 내용만 제출한 과제에 적용합니다.
        // 첨부 과제를 내용만으로 수정하면 기존 첨부 정보가 지워질 수 있습니다.
        editButton.hidden = Boolean(
          submission.filename || submission.fileUrl,
        );


        const make = (tag, text, className = "") => {
          const element = document.createElement(tag);
          element.textContent = text;
          element.className = className;
          return element;
        };
        const headingRow = make("div", "", "section-heading");
        headingRow.append(
          make("h2", "내가 제출한 과제"),
          make("span", "제출 완료", "assignment-badge"),
        );
        const submittedAt = make("p", submission.submittedAt
          ? `제출 일시: ${submission.submittedAt.replace("T", " ")}` : "");
        submissionCard.replaceChildren(
          headingRow, submittedAt, make("h3", data.title),
          make("p", submission.note || "작성된 내용이 없습니다.", "assignment-memo"),
          actions,
        );
        if (submission.filename) {
          const attachment = make("div", "", "assignment-download");
          attachment.append(make("strong", submission.filename));
          actions.before(attachment);
        }
        const feedbackHeading = make("div", "", "section-heading");
        feedbackHeading.append(
          make("h2", "강사 피드백"),
          make("span", isScored ? "채점 완료" : "피드백 대기", "assignment-badge"),
        );
        const feedback = make("div", "", submission.feedback?.trim()
          ? "assignment-memo" : "feedback-wait");
        if (submission.feedback?.trim()) {
          feedback.append(make("p", submission.feedback));
        } else {
          feedback.append(
            make("h3", "강사님의 피드백을 기다리고 있어요."),
            make("p", "피드백이 등록되면 이곳에서 확인할 수 있어요."),
          );
        }
        if (isScored) feedback.append(make("p", `점수: ${submission.score}점`));
        if (submission.feedbackAt) feedback.append(make("p",
          `피드백 일시: ${submission.feedbackAt.replace("T", " ")}`));
        feedbackCard.replaceChildren(feedbackHeading, feedback);
        submissionCard.hidden = false;
        feedbackCard.hidden = false;
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