import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  createLectureFilesFormData,
  deleteInstructorLectureFiles,
  saveInstructorLectureAssignment,
  getInstructorCoursesErrorMessage,
  getInstructorLecture,
  getInstructorLectures,
  saveInstructorLecture,
  uploadLectureFiles,
} from "./instructorCoursesApi.js";
import { useInstructorCoursesAuth } from "./instructorCoursesAuthContext.js";
import {
  InstructorCoursesHeading,
  InstructorCoursesLayout,
} from "./InstructorCoursesLayout.jsx";
import "./instructorCourses.css";

const statusLabels = {
  open: "공개",
  closed: "비공개",
  draft: "임시 저장",
};
const filters = [
  ["", "전체"],
  ["open", "공개"],
  ["closed", "비공개"],
  ["draft", "임시 저장"],
];

function ErrorState({ message, onRetry }) {
  return (
    <div className="instructor-courses-state is-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} type="button">
          다시 시도
        </button>
      )}
    </div>
  );
}

export function InstructorCoursesPage() {
  const location = useLocation();
  const view = location.state?.view ?? "list";

  if (view === "editor") {
    return <LectureEditorPage />;
  }
  if (view === "files") {
    return <LectureFilesPage />;
  }
  return <LectureListPage />;
}

function LectureListPage() {
  const { accessToken } = useInstructorCoursesAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [retry, setRetry] = useState(0);
  const [record, setRecord] = useState(null);
  const requestKey = `${filter}:${pageNumber}:${retry}`;
  const isLoading = record?.key !== requestKey || record.status === "loading";
  const error = record?.key === requestKey ? record.error : "";
  const pageData = record?.key === requestKey ? record.data : null;

  useEffect(() => {
    const controller = new AbortController();
    getInstructorLectures(accessToken, {
      status: filter || undefined,
      page: pageNumber,
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecord({ key: requestKey, data, error: "" });
        }
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setRecord({
          key: requestKey,
          data: null,
          error: getInstructorCoursesErrorMessage(requestError),
        });
      });
    return () => controller.abort();
  }, [accessToken, filter, pageNumber, requestKey]);

  const content = Array.isArray(pageData?.content) ? pageData.content : [];
  const totalPages =
    Number.isInteger(pageData?.totalPages) && pageData.totalPages > 0
      ? pageData.totalPages
      : 0;
  const currentPage =
    Number.isInteger(pageData?.page) && pageData.page > 0
      ? pageData.page
      : pageNumber;
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );

  function selectFilter(nextFilter) {
    setFilter(nextFilter);
    setPageNumber(1);
  }

  return (
    <InstructorCoursesLayout>
      <InstructorCoursesHeading
        description="강의의 공개 상태와 수강 현황을 확인하고 관리하세요."
        title="강의 관리"
      />
      <div className="instructor-lecture-toolbar">
        <div className="instructor-lecture-filters" role="group" aria-label="강의 상태">
          {filters.map(([value, label]) => (
            <button
              aria-pressed={filter === value}
              className={filter === value ? "is-active" : ""}
              key={value || "all"}
              onClick={() => selectFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="instructor-bright-button"
          onClick={() =>
            navigate("/instructor/lectures", {
              state: { view: "editor", mode: "create" },
            })
          }
          type="button"
        >
          새 강의 등록
        </button>
      </div>
      {location.state?.notice && (
        <p className="instructor-course-success" role="status">
          {location.state.notice}
        </p>
      )}

      {isLoading && (
        <p className="instructor-courses-state" role="status">
          강의 목록을 불러오는 중입니다.
        </p>
      )}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} />
      )}
      {!isLoading && !error && content.length === 0 && (
        <p className="instructor-courses-state">
          등록된 강의가 없습니다.
        </p>
      )}
      {!isLoading && !error && content.length > 0 && (
        <>
          <div className="instructor-lecture-table-scroll">
            <table className="instructor-lecture-table">
              <thead>
                <tr>
                  <th scope="col">강의명</th>
                  <th scope="col">상태</th>
                  <th scope="col">수강생</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                {content.map((lecture) => (
                  <tr key={lecture.lid}>
                    <td className="instructor-lecture-name">
                      {lecture.name || "강의명 없음"}
                    </td>
                    <td>
                      <span
                        className={`instructor-lecture-status status-${lecture.status}`}
                      >
                        {statusLabels[lecture.status] ?? "상태 확인"}
                      </span>
                    </td>
                    <td>{Number.isFinite(lecture.studentCount) ? lecture.studentCount : 0}명</td>
                    <td>
                      <button
                        className="instructor-table-action"
                        onClick={() =>
                          navigate("/instructor/lectures", {
                            state: {
                              view: "editor",
                              mode: "edit",
                              lid: lecture.lid,
                            },
                          })
                        }
                        type="button"
                      >
                        {lecture.status === "draft" ? "계속 작성" : "수정"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav
              aria-label="강의 목록 페이지"
              className="instructor-courses-pagination"
            >
              <button
                aria-label="이전 페이지"
                disabled={currentPage <= 1}
                onClick={() => setPageNumber(currentPage - 1)}
                type="button"
              >
                ‹
              </button>
              {visiblePages.map((number) => (
                <button
                  aria-current={number === currentPage ? "page" : undefined}
                  className={number === currentPage ? "is-current" : ""}
                  key={number}
                  onClick={() => setPageNumber(number)}
                  type="button"
                >
                  {number}
                </button>
              ))}
              <button
                aria-label="다음 페이지"
                disabled={currentPage >= totalPages}
                onClick={() => setPageNumber(currentPage + 1)}
                type="button"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </InstructorCoursesLayout>
  );
}

// 서버(LectureOptions)와 같은 목록·순서입니다. 난이도는 값 "입문", 화면 "입문 과정"입니다.
const LECTURE_CATEGORIES = ["웹 보안", "네트워크", "개발 기초", "로그 분석", "클라우드"];
const LECTURE_LEVELS = [
  ["입문", "입문 과정"],
  ["초급", "초급 과정"],
  ["중급", "중급 과정"],
  ["고급", "고급 과정"],
];

const blankLecture = {
  name: "",
  category: "",
  level: "",
  headline: "",
  summary: "",
  price: "",
  status: "open",
  thumbnail: null,
};

export function LectureEditorPage() {
  const { accessToken } = useInstructorCoursesAuth();
  const location = useLocation();
  const lid = location.state?.lid;
  const navigate = useNavigate();
  const isEditing = location.state?.mode === "edit" && Boolean(lid);
  const [values, setValues] = useState(blankLecture);
  const [loadState, setLoadState] = useState(isEditing ? "loading" : "ready");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!isEditing) return undefined;
    const controller = new AbortController();
    getInstructorLecture(accessToken, lid, controller.signal)
      .then((lecture) => {
        if (controller.signal.aborted) return;
        setValues({
          name: lecture.name ?? "",
          category: LECTURE_CATEGORIES.includes(lecture.category)
            ? lecture.category
            : "",
          level: LECTURE_LEVELS.some(([value]) => value === lecture.level)
            ? lecture.level
            : "",
          headline: lecture.headline ?? "",
          summary: lecture.summary ?? "",
          price:
            Number.isInteger(lecture.price) && lecture.price >= 0
              ? String(lecture.price)
              : "",
          status: ["open", "closed", "draft"].includes(lecture.status)
            ? lecture.status
            : "open",
          thumbnail: null,
        });
        setLoadState("ready");
        setLoadError("");
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setLoadState("error");
        setLoadError(getInstructorCoursesErrorMessage(error));
      });
    return () => controller.abort();
  }, [accessToken, isEditing, lid, retry]);

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaveError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (submitLock.current || isSaving) return;
    if (
      !values.name.trim() ||
      !values.category.trim() ||
      !values.level.trim() ||
      !values.headline.trim() ||
      !values.price ||
      !Number.isInteger(Number(values.price)) ||
      Number(values.price) < 0
    ) {
      setSaveError("강의 제목, 카테고리, 난이도, 한 줄 소개, 가격을 확인해주세요.");
      return;
    }

    submitLock.current = true;
    setIsSaving(true);
    setSaveError("");
    try {
      const result = await saveInstructorLecture(accessToken, {
        ...values,
        price: Number(values.price),
        lid: isEditing ? lid : null,
      });
            navigate("/instructor/lectures", {
        state: {
          view: "files",
          lid: isEditing ? lid : result.lid,
          lectureName: values.name,
        },
      });
    } catch (error) {
      setSaveError(getInstructorCoursesErrorMessage(error));
    } finally {
      submitLock.current = false;
      setIsSaving(false);
    }
  }

  return (
    <InstructorCoursesLayout>
      <InstructorCoursesHeading
        description="강의의 기본 정보를 입력하고 다음 단계로 진행하세요."
        title={isEditing ? "강의 등록 / 수정" : "강의 등록"}
      />
      <nav className="instructor-editor-steps" aria-label="강의 등록 단계">
        <span className="is-active">기본 정보</span>
        <span>커리큘럼</span>
        <span>자료 업로드</span>
        <span>미리보기</span>
      </nav>

      {loadState === "loading" && (
        <p className="instructor-courses-state" role="status">
          강의 정보를 불러오는 중입니다.
        </p>
      )}
      {loadState === "error" && (
        <ErrorState
          message={loadError}
          onRetry={() => {
            setRetry((value) => value + 1);
          }}
        />
      )}
      {loadState === "ready" && (
        <form className="instructor-lecture-editor" onSubmit={handleSave}>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-name">강의 제목</label>
            <input
              id="lecture-name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="강의 제목을 입력해주세요."
              value={values.name}
            />
          </div>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-category">카테고리 / 난이도</label>
            <div className="instructor-course-two-columns">
              <select
                id="lecture-category"
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                value={values.category}
              >
                <option value="">카테고리 선택</option>
                {LECTURE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                aria-label="난이도"
                onChange={(event) => updateField("level", event.target.value)}
                value={values.level}
              >
                <option value="">난이도 선택</option>
                {LECTURE_LEVELS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-headline">강의 한 줄 소개</label>
            <input
              id="lecture-headline"
              onChange={(event) => updateField("headline", event.target.value)}
              placeholder="강의를 한 문장으로 소개해주세요."
              value={values.headline}
            />
          </div>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-summary">강의 소개</label>
            <textarea
              id="lecture-summary"
              onChange={(event) => updateField("summary", event.target.value)}
              placeholder="강의에서 다루는 내용을 소개해주세요."
              rows={3}
              value={values.summary}
            />
          </div>
          <div className="instructor-course-two-columns instructor-course-price-thumbnail">
            <div className="instructor-course-form-field">
              <label htmlFor="lecture-price">가격</label>
              <input
                id="lecture-price"
                inputMode="numeric"
                onChange={(event) =>
                  updateField("price", event.target.value.replace(/\D/g, ""))
                }
                placeholder="가격 (원)"
                value={values.price}
              />
            </div>
            <div className="instructor-course-form-field">
              <label htmlFor="lecture-thumbnail">
                썸네일 (선택, 없으면 기본 이미지)
              </label>
              <div className="instructor-thumbnail-control">
                <input
                  accept="image/*"
                  id="lecture-thumbnail"
                  onChange={(event) =>
                    updateField("thumbnail", event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </div>
            </div>
          </div>
          <fieldset className="instructor-course-status-options">
            <legend>공개 범위</legend>
            {[
              ["open", "수강생 공개"],
              ["closed", "비공개"],
              ["draft", "임시 저장"],
            ].map(([value, label]) => (
              <label
                className={values.status === value ? "is-selected" : ""}
                key={value}
              >
                <input
                  checked={values.status === value}
                  name="lecture-status"
                  onChange={() => updateField("status", value)}
                  type="radio"
                  value={value}
                />
                <span aria-hidden="true">
                  {values.status === value ? "●" : "○"}
                </span>
                {label}
              </label>
            ))}
          </fieldset>
          {saveError && (
            <p className="instructor-course-error" role="alert">
              {saveError}
            </p>
          )}
          <div className="instructor-editor-actions">
            <Link className="instructor-course-secondary" to="/instructor/lectures">
              목록으로
            </Link>
            <button
              className="instructor-course-primary"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "저장 중..." : "다음"}
            </button>
          </div>
        </form>
      )}
    </InstructorCoursesLayout>
  );
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) return "—";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function LectureFilesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lid, setLid] = useState(location.state?.lid ?? null);
  const [lectureName, setLectureName] = useState(
  location.state?.lectureName ?? ""
  );
  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [lecturesError, setLecturesError] = useState("");
  const [files, setFiles] = useState({ video: null, material: null });
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const uploadLock = useRef(false);
  const { accessToken } = useInstructorCoursesAuth();
  // 이미 올라가 있는 영상·자료 (강의 상세의 video_filename / material_filename)
  const [uploaded, setUploaded] = useState({ video: null, material: null });
  const [uploadedState, setUploadedState] = useState("idle");
  const [uploadedVersion, setUploadedVersion] = useState(0);
  const [deletingSlot, setDeletingSlot] = useState("");
  // 강의 과제 설정 (lectures.assignment_*)
  const [assignment, setAssignment] = useState({ title: "", content: "", fileType: "" });
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");

  useEffect(() => {
    if (!lid) return undefined;
    const controller = new AbortController();

    async function loadUploaded() {
      setUploadedState("loading");
      try {
        const lecture = await getInstructorLecture(accessToken, lid, controller.signal);
        if (controller.signal.aborted) return;
        setUploaded({
          video: lecture.video_filename || null,
          material: lecture.material_filename || null,
        });
        setAssignment({
          title: lecture.assignmentTitle ?? "",
          content: lecture.assignmentContent ?? "",
          fileType: lecture.assignmentFileType ?? "",
        });
        setUploadedState("ready");
      } catch (error) {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setUploadedState("error");
        setUploadError(getInstructorCoursesErrorMessage(error));
      }
    }

    loadUploaded();
    return () => controller.abort();
  }, [accessToken, lid, uploadedVersion]);

  const uploadedRows = [
    uploaded.video && { type: "video", label: "수업 영상", name: uploaded.video },
    uploaded.material && {
      type: "material",
      label: "학습 자료",
      name: uploaded.material,
    },
  ].filter(Boolean);

  async function handleSaveAssignment(event) {
    event.preventDefault();
    if (!lid || assignmentSaving) return;
    setAssignmentSaving(true);
    setAssignmentMessage("");
    try {
      await saveInstructorLectureAssignment(accessToken, lid, assignment);
      setAssignmentMessage(
        assignment.title.trim()
          ? "과제를 저장했습니다. 수강생 학습 화면에 표시됩니다."
          : "과제를 비웠습니다. 수강생에게는 '등록된 과제가 없습니다'로 보입니다.",
      );
    } catch (error) {
      setAssignmentMessage(getInstructorCoursesErrorMessage(error));
    } finally {
      setAssignmentSaving(false);
    }
  }

  async function handleDeleteUploaded(type, name) {
    if (!lid || deletingSlot) return;
    if (!window.confirm(`'${name}' 파일을 삭제할까요?`)) return;
    setDeletingSlot(type);
    setUploadError("");
    setUploadSuccess("");
    try {
      await deleteInstructorLectureFiles(accessToken, lid, type);
      setUploadSuccess("파일을 삭제했습니다.");
      setUploadedVersion((value) => value + 1);
    } catch (error) {
      setUploadError(getInstructorCoursesErrorMessage(error));
    } finally {
      setDeletingSlot("");
    }
  }

useEffect(() => {
  const controller = new AbortController();

  async function loadLectures() {
    setLecturesLoading(true);
    setLecturesError("");

    try {
      const result = await getInstructorLectures(accessToken, {
        page: 1,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setLectures(
          Array.isArray(result?.content) ? result.content : []
        );
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        setLecturesError(getInstructorCoursesErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLecturesLoading(false);
      }
    }
  }

  loadLectures();

  return () => controller.abort();
}, [accessToken]);

  useEffect(() => {
    if (lectureName || !lid) return undefined;
    const controller = new AbortController();
    getInstructorLecture(accessToken, lid, controller.signal)
      .then((lecture) => {
        if (!controller.signal.aborted) setLectureName(lecture.name ?? "");
      })
      .catch((error) => {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          setNotice(getInstructorCoursesErrorMessage(error));
        }
      });
    return () => controller.abort();
  }, [accessToken, lid, lectureName, retry]);

  const pendingFormData = createLectureFilesFormData(files);
  const selectedFileRows = [
    files.video && { type: "video", label: "수업 영상", file: files.video },
    files.material && {
      type: "material",
      label: "학습 자료",
      file: files.material,
    },
  ].filter(Boolean);

  function setSelectedFile(type, file) {
    setFiles((current) => ({ ...current, [type]: file }));
    setNotice("");
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    let nextVideo = null;
    let nextMaterial = null;
    for (const file of droppedFiles) {
      if (!nextVideo && file.type.startsWith("video/")) {
        nextVideo = file;
      } else if (!nextMaterial && /\.(pdf|zip)$/i.test(file.name)) {
        nextMaterial = file;
      }
    }
    if (!nextVideo && !nextMaterial) {
      setNotice("영상 또는 PDF/ZIP 학습 자료 파일을 선택해주세요.");
      return;
    }
    setFiles((current) => ({
      video: nextVideo ?? current.video,
      material: nextMaterial ?? current.material,
    }));
    setNotice("");
  }

  async function handleUpload() {
    if (uploadLock.current || isUploading) return;
    if (!lid) {
      setUploadError("강의 식별 정보가 없습니다. 강의 목록에서 다시 시작해주세요.");
      return;
    }
    if (pendingFormData.entries().next().done) {
      setUploadError("업로드할 영상 또는 학습 자료를 선택해주세요.");
      return;
    }
    uploadLock.current = true;
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
    await uploadLectureFiles(accessToken, lid, files);
    setUploadSuccess("강의 자료를 업로드했습니다.");
      setFiles({ video: null, material: null });
      setUploadedVersion((value) => value + 1);
    } catch (error) {
      setUploadError(getInstructorCoursesErrorMessage(error));
    } finally {
      uploadLock.current = false;
      setIsUploading(false);
    }
  }

  return (
    <InstructorCoursesLayout>
      <InstructorCoursesHeading
        description="수업을 선택하고 학습 영상과 자료를 업로드하세요."
        title="자료 업로드"
      />
      <nav className="instructor-editor-steps" aria-label="강의 등록 단계">
        <span>기본 정보</span>
        <span>커리큘럼</span>
        <span className="is-active">자료 업로드</span>
        <span>미리보기</span>
      </nav>
      <div className="instructor-current-lecture">
        <strong>{lectureName || "강의 정보를 확인 중입니다."}</strong>
        <span>강의 관리&nbsp; / &nbsp;자료 업로드</span>
      </div>
      <div className="instructor-course-form-field instructor-lesson-select">
  <label htmlFor="lecture-lesson">강의 선택 *</label>

  <select
    id="lecture-lesson"
    value={lid == null ? "" : String(lid)}
    disabled={lecturesLoading || Boolean(lecturesError) || isUploading}
    onChange={(event) => {
      const selectedId = event.target.value;
      const selectedLecture = lectures.find(
        (lecture) => String(lecture.lid) === selectedId
      );

      setLid(selectedId ? Number(selectedId) : null);
      setLectureName(selectedLecture?.name ?? "");
      setFiles({ video: null, material: null });
      setUploaded({ video: null, material: null });
      setUploadedState("idle");
      setAssignment({ title: "", content: "", fileType: "" });
      setAssignmentMessage("");
      setUploadError("");
      setUploadSuccess("");
      setNotice("");
    }}
  >
    <option value="">
      {lecturesLoading
        ? "강의 목록을 불러오는 중입니다..."
        : lecturesError
          ? "강의 목록 조회 실패"
          : "강의를 선택해주세요"}
    </option>

    {lectures.map((lecture) => (
      <option key={lecture.lid} value={String(lecture.lid)}>
        {lecture.name || `강의 ${lecture.lid}`}
      </option>
    ))}
  </select>

  {lecturesError && (
    <p role="alert">{lecturesError}</p>
  )}
</div>
      <section
        className="instructor-file-drop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div>
          <h2>영상 또는 학습 자료를 이곳에 끌어다 놓으세요.</h2>
          <p>영상 MP4 · 학습 자료 PDF, ZIP</p>
        </div>
        <div className="instructor-file-pickers">
          <label>
            영상 파일
            <input
              accept="video/*"
              onChange={(event) =>
                setSelectedFile("video", event.target.files?.[0] ?? null)
              }
              type="file"
            />
          </label>
          <label>
            자료 파일
            <input
              accept=".pdf,.zip,application/pdf,application/zip"
              onChange={(event) =>
                setSelectedFile("material", event.target.files?.[0] ?? null)
              }
              type="file"
            />
          </label>
        </div>
      </section>
      <section className="instructor-selected-files">
        <h2>업로드된 파일</h2>
        {!lid ? (
          <p className="instructor-files-empty">강의를 선택하면 업로드된 파일이 표시됩니다.</p>
        ) : uploadedState === "loading" ? (
          <p className="instructor-files-empty" role="status">업로드된 파일을 불러오는 중입니다.</p>
        ) : uploadedRows.length > 0 ? (
          <div className="instructor-files-table-scroll">
            <table className="instructor-files-table">
              <thead>
                <tr>
                  <th scope="col">파일명</th>
                  <th scope="col">유형</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                {uploadedRows.map(({ type, label, name }) => (
                  <tr key={type}>
                    <td>{name}</td>
                    <td>{label}</td>
                    <td>
                      <button
                        className="instructor-table-action"
                        disabled={Boolean(deletingSlot) || isUploading}
                        onClick={() => handleDeleteUploaded(type, name)}
                        type="button"
                      >
                        {deletingSlot === type ? "삭제 중..." : "삭제"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="instructor-files-empty">아직 업로드된 파일이 없습니다.</p>
        )}
        <p className="instructor-upload-note">
          영상과 자료는 각각 1개씩 둘 수 있습니다. 새 파일을 올리면 기존 파일을 바꿉니다.
        </p>
      </section>
      {lid && uploadedState === "ready" && (
        <form className="instructor-selected-files" onSubmit={handleSaveAssignment}>
          <h2>과제 설정</h2>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-assignment-title">과제 제목 (비우면 과제 없음)</label>
            <input
              id="lecture-assignment-title"
              maxLength={200}
              onChange={(event) =>
                setAssignment((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="예: XSS 재현 보고서"
              value={assignment.title}
            />
          </div>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-assignment-content">과제 안내</label>
            <textarea
              id="lecture-assignment-content"
              onChange={(event) =>
                setAssignment((current) => ({ ...current, content: event.target.value }))
              }
              placeholder="과제 내용과 제출 요구사항을 적어주세요."
              rows={4}
              value={assignment.content}
            />
          </div>
          <div className="instructor-course-form-field">
            <label htmlFor="lecture-assignment-type">제출 파일 형식 안내</label>
            <input
              id="lecture-assignment-type"
              maxLength={100}
              onChange={(event) =>
                setAssignment((current) => ({ ...current, fileType: event.target.value }))
              }
              placeholder="예: PDF 또는 ZIP, 10MB 이하"
              value={assignment.fileType}
            />
          </div>
          {assignmentMessage && (
            <p className="instructor-course-success" role="status">{assignmentMessage}</p>
          )}
          <div className="instructor-editor-actions">
            <button className="instructor-course-primary" disabled={assignmentSaving} type="submit">
              {assignmentSaving ? "저장 중..." : "과제 저장"}
            </button>
          </div>
        </form>
      )}
      <section className="instructor-selected-files">
        <h2>선택한 파일</h2>
        {selectedFileRows.length > 0 ? (
          <div className="instructor-files-table-scroll">
            <table className="instructor-files-table">
              <thead>
                <tr>
                  <th scope="col">파일명</th>
                  <th scope="col">유형</th>
                  <th scope="col">크기</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                {selectedFileRows.map(({ type, label, file }) => (
                  <tr key={type}>
                    <td>{file.name}</td>
                    <td>{label}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>
                      <button
                        className="instructor-table-action"
                        onClick={() => setSelectedFile(type, null)}
                        type="button"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="instructor-files-empty">아직 선택한 파일이 없습니다.</p>
        )}
        <p className="instructor-upload-note">
          선택한 강의에 영상(MP4) 또는 학습 자료(PDF, ZIP)를 업로드할 수 있습니다.
        </p>
      </section>
      {notice && (
        <p className="instructor-course-error" role="alert">
          {notice}
        </p>
      )}
      {uploadError && (
        <p className="instructor-course-error" role="alert">
          {uploadError}
        </p>
      )}
      {uploadSuccess && (
        <p className="instructor-course-success" role="status">
          {uploadSuccess}
        </p>
      )}
      <div className="instructor-editor-actions instructor-files-actions">
        <button
          className="instructor-course-secondary"
          onClick={() =>
            navigate("/instructor/lectures", {
              state: { view: "list" },
            })
          }
          type="button"
        >
          목록으로
        </button>
        <button
          className="instructor-course-primary"
          disabled={selectedFileRows.length === 0 || isUploading}
          onClick={handleUpload}
          type="button"
        >
          {isUploading ? "업로드 중..." : "업로드 시작"}
        </button>
      </div>
      {notice && !lectureName && lid && (
        <button
          className="instructor-file-retry"
          onClick={() => setRetry((value) => value + 1)}
          type="button"
        >
          강의 정보 다시 불러오기
        </button>
      )}
    </InstructorCoursesLayout>
  );
}
