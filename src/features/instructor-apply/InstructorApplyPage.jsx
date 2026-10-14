// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  getInstructorApplicationStatus,
  submitInstructorApplication,
} from "./instructorApplyApi.js";
import { useInstructorApplyAuth } from "./instructorApplyAuthContext.js";
import "./instructorApply.css";
// 전체 페이지에서 동일한 공통 헤더를 사용합니다.
import Header from "../../components/navigation/Header.jsx";
const statusLabels = {
  NONE: "미신청 / 승인 후 강사센터 이용 가능",
  PENDING: "승인 대기 중입니다.",
  APPROVED: "승인 완료 / 강사센터 이용 가능",
};

function InstructorApplyPage() {
  const { accessToken } = useInstructorApplyAuth();
  const [statusRecord, setStatusRecord] = useState({
    status: "unavailable",
    message:
      "강사 신청 상태 API URL과 로그인 Access Token 연결이 필요합니다.",
  });
  const [introduce, setIntroduce] = useState("");
  const [subject, setSubject] = useState("");
  const [career, setCareer] = useState(null);
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [statusRetry, setStatusRetry] = useState(0);
  const fileInput = useRef(null);
  const submitLock = useRef(false);

  const statusEndpoint =
    import.meta.env.VITE_INSTRUCTOR_APPLICATION_STATUS_URL ?? "";
  const submitEndpoint =
    import.meta.env.VITE_INSTRUCTOR_APPLICATION_SUBMIT_URL ?? "";
  const status = statusRecord.status;
  const statusCanApply = status === "NONE";
  const isPendingOrApproved = status === "PENDING" || status === "APPROVED";

  useEffect(() => {
    if (!statusEndpoint || !accessToken) return undefined;
    const controller = new AbortController();
    getInstructorApplicationStatus({
      endpoint: statusEndpoint,
      accessToken,
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatusRecord({ status: result.status, message: result.message });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setStatusRecord({
            status: "unavailable",
            message: error.message,
          });
        }
      });
    return () => controller.abort();
  }, [accessToken, statusEndpoint, statusRetry]);

  function handleFileChange(event) {
    setCareer(event.target.files?.[0] ?? null);
    setSubmitMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current || submitState === "submitting") return;
    if (!statusCanApply) {
      setSubmitMessage(
        isPendingOrApproved
          ? statusRecord.message
          : "신청 상태를 확인할 수 없습니다. 상태 API와 로그인 연동 후 신청할 수 있습니다.",
      );
      return;
    }
    if (!introduce.trim() || !subject.trim() || !career) {
      setSubmitMessage(
        "강사 소개, 전문 분야, 경력 및 증빙 파일을 모두 입력해주세요.",
      );
      return;
    }
    if (!submitEndpoint || !accessToken) {
      setSubmitMessage(
        "강사 신청 API URL과 로그인 Access Token 연결이 필요합니다.",
      );
      return;
    }

    submitLock.current = true;
    setSubmitState("submitting");
    setSubmitMessage("");
    try {
      const result = await submitInstructorApplication({
        endpoint: submitEndpoint,
        accessToken,
        introduce: introduce.trim(),
        subject: subject.trim(),
        career,
      });
      setStatusRecord({ status: "PENDING", message: result.message });
      setSubmitState("success");
      setSubmitMessage(result.message);
      setCareer(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error.message);
    } finally {
      submitLock.current = false;
    }
  }

  return (
    <>
      <Header />
      <div className="instructor-layout">
        <MyPageSidebar />
        <main className="instructor-main">
          <nav className="instructor-breadcrumb" aria-label="현재 위치">
            <Link to="/">사용자공간</Link>
            <span aria-hidden="true">/</span>
            <span>마이페이지</span>
          </nav>
          <header className="instructor-heading">
            <h1>강사 신청</h1>
            <p>당신의 경험과 지식을 새싹에듀에서 나눠주세요.</p>
          </header>
          <MyPageTabs />

          <form className="instructor-application-form" onSubmit={handleSubmit}>
            <div className="instructor-form-field">
              <label htmlFor="instructor-introduce">강사 소개</label>
              <textarea
                disabled={isPendingOrApproved || submitState === "submitting"}
                id="instructor-introduce"
                onChange={(event) => setIntroduce(event.target.value)}
                placeholder="강사로서의 경험과 소개를 작성해주세요."
                rows={3}
                value={introduce}
              />
            </div>

            <div className="instructor-form-field">
              <label htmlFor="instructor-subject">전문 분야</label>
              <input
                disabled={isPendingOrApproved || submitState === "submitting"}
                id="instructor-subject"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="전문 분야를 입력해주세요."
                value={subject}
              />
            </div>

            <div className="instructor-form-field">
              <label htmlFor="instructor-career">경력 및 증빙</label>
              <div className="instructor-file-control">
                <span
                  aria-live="polite"
                  className={career ? "" : "is-placeholder"}
                >
                  {career?.name ?? "경력 증빙 파일을 선택해주세요."}
                </span>
                <input
                  accept="*/*"
                  className="instructor-file-input"
                  disabled={isPendingOrApproved || submitState === "submitting"}
                  id="instructor-career"
                  onChange={handleFileChange}
                  ref={fileInput}
                  type="file"
                />
                <button
                  disabled={
                    isPendingOrApproved || submitState === "submitting"
                  }
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
                  파일 선택
                </button>
              </div>
            </div>

            <section
              aria-live="polite"
              className={`instructor-status-card status-${status.toLowerCase()}`}
            >
              <h2>신청 상태</h2>
              <p>
                {statusLabels[status] ??
                  statusRecord.message ??
                  "신청 상태를 확인할 수 없습니다."}
              </p>
              {status === "unavailable" && statusEndpoint && accessToken && (
                <button
                  className="instructor-status-retry"
                  onClick={() => setStatusRetry((value) => value + 1)}
                  type="button"
                >
                  상태 다시 확인
                </button>
              )}
            </section>

            <div className="instructor-form-footer">
              {submitMessage && (
                <p
                  className={`instructor-form-message is-${submitState}`}
                  role={submitState === "error" ? "alert" : "status"}
                >
                  {submitMessage}
                </p>
              )}
              {(statusCanApply || status === "unavailable") && (
                <button
                  className="instructor-submit-button"
                  disabled={
                    !statusCanApply || submitState === "submitting"
                  }
                  title={
                    statusCanApply
                      ? undefined
                      : "신청 상태 및 로그인 연동 후 신청할 수 있습니다."
                  }
                  type="submit"
                >
                  {submitState === "submitting" ? "신청 중..." : "강사 신청"}
                </button>
              )}
              {isPendingOrApproved && (
                <p className="instructor-locked-note" role="status">
                  {statusRecord.message}
                </p>
              )}
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

export default InstructorApplyPage;
