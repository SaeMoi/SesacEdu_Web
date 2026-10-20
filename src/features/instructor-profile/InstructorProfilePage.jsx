import { useEffect, useRef, useState } from "react";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import { InstructorCenterTabs } from "../instructor-center/InstructorCenterTabs.jsx";
import {
  getInstructorProfile,
  updateInstructorProfile,
} from "./instructorProfileApi.js";
import { useInstructorCoursesAuth } from "../instructor-courses/instructorCoursesAuthContext.js";
import "./instructorProfile.css";

const EMPTY_PROFILE = {
  iname: "",
  bio: "",
  career: "",
  link: "",
  field: "",
  bank: "",
  account: "",
};

function InstructorProfileLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="profile">
      {children}
    </SharedInstructorCenterLayout>
  );
}

function InstructorProfileHeading() {
  return (
    <>
      <header className="instructor-profile-heading">
        <h1>강사 정보 관리</h1>
        <p>공개 프로필과 정산 계좌 정보를 관리하세요.</p>
      </header>
      <InstructorCenterTabs className="instructor-profile-tabs" />
    </>
  );
}

function isMaskedAccount(account) {
  return typeof account === "string" && /[*＊•●]/.test(account);
}

function getProfileValues(data) {
  const profile = {};
  for (const field of Object.keys(EMPTY_PROFILE)) {
    profile[field] = typeof data[field] === "string" ? data[field] : "";
  }
  if (isMaskedAccount(profile.account)) {
    profile.account = "";
  }
  return profile;
}

function buildProfileFormData(profile, careerFile) {
  const formData = new FormData();
  for (const field of ["iname", "bio", "career", "link", "bank", "account", "field"]) {
    formData.append(field, profile[field]);
  }
  if (careerFile) formData.append("careerFile", careerFile);
  return formData;
}

export function InstructorProfilePage() {
  const { accessToken } = useInstructorCoursesAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [careerFile, setCareerFile] = useState(null);
  const [existingCareerFileName, setExistingCareerFileName] = useState("");
  const [maskedAccount, setMaskedAccount] = useState("");
  const [bankMode, setBankMode] = useState("select");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const result = await getInstructorProfile(accessToken, {
          signal: controller.signal,
        });
        if (!active) return;
        setProfile(getProfileValues(result));
        setMaskedAccount(isMaskedAccount(result.account) ? result.account : "");
        setExistingCareerFileName(
          typeof result.careerFilename === "string" ? result.careerFilename : "",
        );
        setBankMode(result.bank ? "existing" : "select");
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, retry]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setError("");
    setNotice("");
  }

  function handleBankModeChange(event) {
    const nextMode = event.target.value;
    setBankMode(nextMode);
    if (nextMode === "custom") {
      setProfile((current) => ({ ...current, bank: "" }));
    } else if (nextMode === "select") {
      setProfile((current) => ({ ...current, bank: "" }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const requiredFields = [
      ["iname", "공개 강사명을 입력해 주세요."],
      ["field", "전문 분야를 입력해 주세요."],
      ["bank", "은행을 입력하거나 선택해 주세요."],
      ["account", "계좌번호를 입력해 주세요."],
    ];
    const missingField = requiredFields.find(([field]) => !profile[field].trim());
    if (missingField) {
      setError(missingField[1]);
      return;
    }
    if (isMaskedAccount(profile.account)) {
      setError("마스킹된 계좌번호는 저장할 수 없습니다. 실제 계좌번호를 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const formData = buildProfileFormData(profile, careerFile);
      await updateInstructorProfile(accessToken, formData);
      setNotice("강사 정보가 저장되었습니다.");
      const result = await getInstructorProfile(accessToken);
      setProfile(getProfileValues(result));
      setMaskedAccount(isMaskedAccount(result.account) ? result.account : "");
      setExistingCareerFileName(
        typeof result.careerFilename === "string" ? result.careerFilename : "",
      );
      setCareerFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <InstructorProfileLayout>
      <InstructorProfileHeading />
      <form className="instructor-profile-form" onSubmit={handleSubmit}>
        {error && (
          <div className="instructor-profile-message is-error" role="alert">
            <span>{error}</span>
            {!accessToken && (
              <button
                onClick={() => setRetry((count) => count + 1)}
                type="button"
              >
                다시 시도
              </button>
            )}
          </div>
        )}
        {notice && <p className="instructor-profile-message is-success" role="status">{notice}</p>}
        {loading && <p className="instructor-profile-loading" role="status">강사 정보를 불러오는 중입니다...</p>}

        <div className="instructor-profile-public-fields">
          <label className="instructor-profile-field">
            <span>공개 강사명 <b>*</b></span>
            <input autoComplete="name" name="iname" onChange={updateField} value={profile.iname} />
          </label>
          <label className="instructor-profile-field">
            <span>한 줄 소개</span>
            <input name="bio" onChange={updateField} value={profile.bio} />
          </label>
          <label className="instructor-profile-field">
            <span>강사 소개</span>
            <textarea name="career" onChange={updateField} rows={2} value={profile.career} />
          </label>
          <label className="instructor-profile-field">
            <span>공개 연락처 / 링크</span>
            <input name="link" onChange={updateField} value={profile.link} />
          </label>
          <label className="instructor-profile-field">
            <span>전문 분야 <b>*</b></span>
            <input
              name="field"
              onChange={updateField}
              placeholder="예: 정보보안 / 웹 보안"
              value={profile.field}
            />
          </label>
          <div className="instructor-profile-field">
            <span>경력 및 증빙</span>
            <div className="instructor-profile-file-row">
              <span className="instructor-profile-file-name">
                {careerFile?.name || existingCareerFileName || "등록된 파일 정보가 없습니다."}
              </span>
              <input
                accept="*/*"
                className="instructor-profile-file-input"
                onChange={(event) => setCareerFile(event.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="instructor-profile-file-button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                파일 선택
              </button>
            </div>
          </div>
        </div>

        <section className="instructor-profile-bank-section">
          <h2>정산 계좌 정보</h2>
          <div className="instructor-profile-bank-fields">
            <label className="instructor-profile-field">
              <span>은행 <b>*</b></span>
              <select
                aria-label="은행"
                onChange={handleBankModeChange}
                value={bankMode}
              >
                <option value="select">은행을 선택해주세요</option>
                {bankMode === "existing" && profile.bank && (
                  <option value="existing">{profile.bank}</option>
                )}
                <option value="custom">은행 직접 입력</option>
              </select>
              {bankMode === "custom" && (
                <input
                  aria-label="은행명 직접 입력"
                  autoComplete="off"
                  name="bank"
                  onChange={updateField}
                  placeholder="은행명을 입력해주세요"
                  value={profile.bank}
                />
              )}
            </label>
            <label className="instructor-profile-field">
              <span>계좌번호 <b>*</b></span>
              <input
                autoComplete="off"
                name="account"
                onChange={updateField}
                placeholder={
                  maskedAccount
                    ? `기존 계좌: ${maskedAccount} · 유지 기능 확인 필요`
                    : "계좌번호를 입력해주세요"
                }
                type="text"
                value={profile.account}
              />
            </label>
          </div>
          <p className="instructor-profile-bank-note">
            정산 계좌 정보는 학생에게 공개되지 않습니다.
          </p>
          {maskedAccount && (
            <p className="instructor-profile-account-warning" role="note">
              조회된 계좌번호는 마스킹되어 있습니다. 마스킹 값을 저장하지 않도록 실제 계좌번호를 입력해야 합니다.
              기존 계좌 유지 방식은 백엔드 확인이 필요합니다.
            </p>
          )}
        </section>

        <div className="instructor-profile-submit-row">
          <button className="instructor-profile-save" disabled={saving || loading} type="submit">
            {saving ? "저장 중..." : "정보 저장"}
          </button>
        </div>
      </form>
    </InstructorProfileLayout>
  );
}
