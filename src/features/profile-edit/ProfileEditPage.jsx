import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router";
import {
  getProfile,
  getProfileImageSrc,
  ProfileApiError,
  updatePassword,
  updateProfile,
  updateProfileImage,
  verifyPassword,
} from "./profileApi.js";
import { useProfileEditSession } from "./profileEditSessionContext.js";
import {
  ProfileEditLayout,
  ProfilePageHeader,
} from "./ProfileEditLayout.jsx";
import { PasswordMismatchDialog } from "./VerifyPasswordPage.jsx";
import "./profileEdit.css";

const editableFields = [
  ["name", "이름", "text"],
  ["email", "이메일", "email"],
  ["nickname", "닉네임", "text"],
  ["phone", "휴대폰", "tel"],
  ["birthDate", "생년월일", "date"],
];

const passwordFields = [
  ["currentPassword", "현재 비밀번호", "current-password"],
  ["newPassword", "새 비밀번호", "new-password"],
  ["newPasswordCheck", "새 비밀번호 확인", "new-password"],
];

function initialForm(profile) {
  return {
    name: typeof profile?.name === "string" ? profile.name : "",
    email: typeof profile?.email === "string" ? profile.email : "",
    nickname: typeof profile?.nickname === "string" ? profile.nickname : "",
    phone: typeof profile?.phone === "string" ? profile.phone : "",
    birthDate:
      typeof profile?.birthDate === "string" ? profile.birthDate : "",
  };
}

function validateProfile(form) {
  const errors = {};
  const name = form.name.trim();
  const nickname = form.nickname.trim();
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();
  const birthDate = form.birthDate;
  const phoneDigits = phone.replace(/-/g, "");

  if (name.length < 1 || name.length > 10) {
    errors.name = "이름은 1~10자로 입력해주세요.";
  }
  if (nickname.length < 2 || nickname.length > 20) {
    errors.nickname = "닉네임은 2~20자로 입력해주세요.";
  }
  if (
    email.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "올바른 이메일 주소를 입력해주세요. (최대 100자)";
  }
  if (!/^\d{10,11}$/.test(phoneDigits)) {
    errors.phone = "휴대폰 번호는 숫자 10~11자리로 입력해주세요.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    errors.birthDate = "생년월일을 YYYY-MM-DD 형식으로 입력해주세요.";
  } else {
    const date = new Date(`${birthDate}T00:00:00Z`);
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== birthDate ||
      birthDate > todayString
    ) {
      errors.birthDate = "올바른 생년월일을 입력해주세요.";
    }
  }

  return {
    errors,
    payload: {
      name,
      nickname,
      email,
      phone: phoneDigits,
      birthDate,
    },
  };
}

function serverFieldErrors(error) {
  if (error.code === "DUPLICATE_NICKNAME") {
    return { nickname: "이미 사용 중인 닉네임입니다." };
  }
  if (error.code === "DUPLICATE_EMAIL") {
    return { email: "이미 사용 중인 이메일입니다." };
  }
  if (error.code !== "INVALID_INPUT" || !Array.isArray(error.result?.errors)) {
    return {};
  }
  return Object.fromEntries(
    error.result.errors
      .filter(
        (entry) =>
          editableFields.some(([field]) => field === entry?.field) &&
          typeof entry.reason === "string",
      )
      .map((entry) => [entry.field, entry.reason]),
  );
}

function formatProfileError(error) {
  if (error.code === "AUTH_INTEGRATION_REQUIRED") return error.message;
  if (error.code === "UNAUTHORIZED") {
    return "로그인 인증 연동이 필요합니다. 다시 로그인한 뒤 시도해주세요.";
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 현재 프로젝트에는 토큰 재발급 연동이 없습니다.";
  }
  if (error.code === "TOO_MANY_REQUESTS") {
    const retryAfter = error.result?.retryAfter;
    return Number.isFinite(retryAfter)
      ? `${retryAfter}초 후 다시 시도해주세요.`
      : error.message || "잠시 후 다시 시도해주세요.";
  }
  if (error.code === "INVALID_IMAGE") {
    return "유효한 이미지 파일인지 확인해주세요.";
  }
  if (error.code === "FILE_TOO_LARGE") {
    return "프로필 사진은 최대 5MB까지 가능합니다.";
  }
  if (error.code === "UNSUPPORTED_IMAGE_TYPE") {
    return "JPG, JPEG 또는 PNG 이미지 파일만 등록할 수 있습니다.";
  }
  if (error.code === "REAUTH_REQUIRED") {
    return "본인 확인이 만료되었습니다. 비밀번호를 다시 확인해주세요.";
  }
  return error.message || "요청을 처리하지 못했습니다. 다시 시도해주세요.";
}

function validateImageFile(file) {
  const allowedTypes = ["image/jpeg", "image/png"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (
    !allowedTypes.includes(file.type) ||
    !["jpg", "jpeg", "png"].includes(extension)
  ) {
    return Promise.reject(
      new Error("JPG, JPEG 또는 PNG 이미지 파일만 등록할 수 있습니다."),
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return Promise.reject(new Error("프로필 사진은 최대 5MB까지 가능합니다."));
  }

  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (image.width > 4096 || image.height > 4096) {
        reject(new Error("이미지 가로·세로 크기는 각각 4096px 이하여야 합니다."));
      } else {
        resolve();
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("유효한 이미지 파일인지 확인해주세요."));
    };
    image.src = objectUrl;
  });
}

function ProfileEditPage() {
  const navigate = useNavigate();
  const {
    accessToken,
    reauthTokens,
    setReauthToken,
    clearReauthToken,
  } = useProfileEditSession();
  const credential = reauthTokens.PROFILE_UPDATE;
  const [clock, setClock] = useState(null);
  const hasValidReauth = credential?.token
    ? clock === null
      ? null
      : credential.expiresAt > clock
    : false;
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm(null));
  const [profileErrors, setProfileErrors] = useState({});
  const [profileStatus, setProfileStatus] = useState("loading");
  const [profileRetry, setProfileRetry] = useState(0);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordCheck: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordNotice, setPasswordNotice] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showMismatch, setShowMismatch] = useState(false);
  const passwordInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!credential?.expiresAt) return undefined;
    const readyTimer = window.setTimeout(() => setClock(Date.now()), 0);
    const expirationTimer = window.setTimeout(
      () => setClock(Date.now()),
      Math.max(0, credential.expiresAt - Date.now()),
    );
    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(expirationTimer);
    };
  }, [credential?.expiresAt]);

  useEffect(() => {
    if (!hasValidReauth || !accessToken) return undefined;
    if (credential.expiresAt <= Date.now()) {
      clearReauthToken("PROFILE_UPDATE");
      navigate("/mypage/verify-password", {
        replace: true,
        state: { notice: "본인 확인 시간이 만료되었습니다." },
      });
      return undefined;
    }
    const controller = new AbortController();

    getProfile(accessToken, controller.signal)
      .then((result) => {
        setProfile(result);
        setForm(initialForm(result));
        setProfileStatus("success");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (error.code === "REAUTH_REQUIRED") {
          clearReauthToken("PROFILE_UPDATE");
          navigate("/mypage/verify-password", {
            replace: true,
            state: { notice: formatProfileError(error) },
          });
          return;
        }
        setProfileError(
          error instanceof ProfileApiError
            ? formatProfileError(error)
            : "프로필 조회 중 네트워크 오류가 발생했습니다.",
        );
        setProfileStatus("error");
      });

    const timeout = window.setTimeout(() => {
      clearReauthToken("PROFILE_UPDATE");
      navigate("/mypage/verify-password", {
        replace: true,
        state: { notice: "본인 확인 시간이 만료되었습니다." },
      });
    }, Math.max(0, credential.expiresAt - Date.now()));

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    accessToken,
    clearReauthToken,
    credential?.expiresAt,
    hasValidReauth,
    navigate,
    profileRetry,
  ]);

  useEffect(() => {
    if (!imagePreview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function redirectForExpiredReauth() {
    clearReauthToken("PROFILE_UPDATE");
    navigate("/mypage/verify-password", {
      replace: true,
      state: { notice: "본인 확인 시간이 만료되었습니다." },
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (isSavingProfile) return;
    setProfileNotice("");
    setProfileError("");

    if (
      !hasValidReauth ||
      !credential?.token ||
      credential.expiresAt <= Date.now()
    ) {
      redirectForExpiredReauth();
      return;
    }
    const validation = validateProfile(form);
    setProfileErrors(validation.errors);
    if (Object.keys(validation.errors).length) return;

    setIsSavingProfile(true);
    try {
      const updated = await updateProfile(
        accessToken,
        credential.token,
        validation.payload,
      );
      clearReauthToken("PROFILE_UPDATE");
      navigate("/mypage", {
        replace: true,
        state: {
          notice: "프로필이 수정되었습니다.",
          profile: updated,
        },
      });
    } catch (error) {
      if (error.code === "REAUTH_REQUIRED") {
        clearReauthToken("PROFILE_UPDATE");
        navigate("/mypage/verify-password", {
          replace: true,
          state: { notice: formatProfileError(error) },
        });
        return;
      }
      const fieldErrors = serverFieldErrors(error);
      if (Object.keys(fieldErrors).length) {
        setProfileErrors(fieldErrors);
      } else {
        setProfileError(
          error instanceof ProfileApiError
            ? formatProfileError(error)
            : "프로필 수정 중 네트워크 오류가 발생했습니다.",
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImageNotice("");
    if (!file) return;

    try {
      await validateImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsUploadingImage(true);
      const imageUrl = await updateProfileImage(accessToken, file);
      setProfile((current) => ({
        ...current,
        profileImageUrl: imageUrl,
      }));
      setImagePreview("");
      setImageNotice("프로필 사진이 변경되었습니다.");
    } catch (error) {
      setImageNotice(
        error instanceof ProfileApiError
          ? formatProfileError(error)
          : error.message || "사진을 업로드하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  function closeMismatch() {
    setShowMismatch(false);
    setPasswordForm((current) => ({ ...current, currentPassword: "" }));
    window.requestAnimationFrame(() => {
      document.getElementById("password-currentPassword")?.focus();
    });
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (isChangingPassword) return;
    setPasswordErrors({});
    setPasswordNotice("");

    const errors = {};
    const { currentPassword, newPassword, newPasswordCheck } = passwordForm;
    if (!currentPassword) errors.currentPassword = "현재 비밀번호를 입력해주세요.";
    if (
      newPassword.length < 8 ||
      newPassword.length > 30 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      errors.newPassword =
        "새 비밀번호는 8~30자이며 영문, 숫자, 특수문자를 포함해야 합니다.";
    }
    if (newPasswordCheck !== newPassword) {
      errors.newPasswordCheck = "새 비밀번호가 일치하지 않습니다.";
    }
    if (newPassword && currentPassword === newPassword) {
      errors.newPassword = "현재 비밀번호와 다른 비밀번호를 입력해주세요.";
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setIsChangingPassword(true);
    let verifiedToken;
    try {
      const verification = await verifyPassword(
        accessToken,
        currentPassword,
        "PASSWORD_CHANGE",
      );
      if (
        typeof verification?.reauthToken !== "string" ||
        !verification.reauthToken ||
        !Number.isFinite(verification.expiresIn) ||
        verification.expiresIn <= 0
      ) {
        throw new ProfileApiError(
          "INVALID_RESPONSE",
          "본인 확인 토큰 응답을 확인할 수 없습니다.",
        );
      }
      verifiedToken = verification.reauthToken;
      setReauthToken(
        "PASSWORD_CHANGE",
        verifiedToken,
        verification.expiresIn,
      );
      await updatePassword(
        accessToken,
        verifiedToken,
        newPassword,
        newPasswordCheck,
      );
      clearReauthToken("PASSWORD_CHANGE");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        newPasswordCheck: "",
      });
      navigate("/login", {
        replace: true,
        state: {
          notice: "비밀번호가 변경되었습니다. 다시 로그인해주세요.",
        },
      });
    } catch (error) {
      if (verifiedToken) clearReauthToken("PASSWORD_CHANGE");
      if (error.code === "PASSWORD_MISMATCH") {
        setShowMismatch(true);
      } else if (error.code === "SAME_AS_CURRENT_PASSWORD") {
        setPasswordErrors({
          newPassword: "현재 비밀번호와 다른 비밀번호를 입력해주세요.",
        });
      } else if (error.code === "INVALID_INPUT" && Array.isArray(error.result?.errors)) {
        setPasswordErrors(
          Object.fromEntries(
            error.result.errors
                .filter(
                  (entry) => entry && typeof entry.reason === "string",
                )
                .map((entry) => {
                  const fieldMap = {
                    pw: "currentPassword",
                    newPw: "newPassword",
                    newPwCheck: "newPasswordCheck",
                  };
                  return [fieldMap[entry.field] ?? entry.field, entry.reason];
                })
                .filter(([field]) =>
                  passwordFields.some(([knownField]) => knownField === field),
                ),
          ),
        );
      } else {
        setPasswordNotice(
          error instanceof ProfileApiError
            ? formatProfileError(error)
            : "비밀번호 변경 중 네트워크 오류가 발생했습니다.",
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (hasValidReauth === null) {
    return (
      <ProfileEditLayout>
        <ProfilePageHeader
          title="프로필 수정"
          description="기본 정보와 비밀번호를 한 화면에서 수정할 수 있어요."
        />
        <p className="profile-page-message" role="status">
          본인 확인 상태를 확인하는 중입니다.
        </p>
      </ProfileEditLayout>
    );
  }

  if (hasValidReauth && !accessToken) {
    return (
      <ProfileEditLayout>
        <ProfilePageHeader
          title="프로필 수정"
          description="기본 정보와 비밀번호를 한 화면에서 수정할 수 있어요."
        />
        <p className="profile-page-message profile-page-error" role="alert">
          로그인 Access Token 연동이 완료되지 않아 프로필을 불러올 수 없습니다.
        </p>
      </ProfileEditLayout>
    );
  }

  if (!hasValidReauth) {
    return (
      <Navigate
        replace
        to="/mypage/verify-password"
        state={{ notice: "프로필 수정 전 현재 비밀번호를 확인해주세요." }}
      />
    );
  }

  if (profileStatus === "loading") {
    return (
      <ProfileEditLayout>
        <ProfilePageHeader
          title="프로필 수정"
          description="기본 정보와 비밀번호를 한 화면에서 수정할 수 있어요."
        />
        <p className="profile-page-message" role="status">
          회원 정보를 불러오는 중입니다.
        </p>
      </ProfileEditLayout>
    );
  }

  if (profileStatus === "error") {
    return (
      <ProfileEditLayout>
        <ProfilePageHeader
          title="프로필 수정"
          description="기본 정보와 비밀번호를 한 화면에서 수정할 수 있어요."
        />
        <section className="profile-page-message profile-page-error" role="alert">
          <p>{profileError}</p>
          <button
            className="button button-primary"
            onClick={() => {
              setProfileError("");
              setProfileStatus("loading");
              setProfileRetry((current) => current + 1);
            }}
            type="button"
          >
            다시 시도
          </button>
        </section>
      </ProfileEditLayout>
    );
  }

  const imageSrc =
    imagePreview || getProfileImageSrc(profile?.profileImageUrl);

  return (
    <ProfileEditLayout>
      <ProfilePageHeader
        title="프로필 수정"
        description="기본 정보와 비밀번호를 한 화면에서 수정할 수 있어요."
      />

      <section className="profile-edit-section">
        <h2>기본 정보</h2>
        <div className="profile-photo-row">
          {imageSrc ? (
            <img className="profile-photo-preview" src={imageSrc} alt="프로필 사진" />
          ) : (
            <div className="profile-photo-preview profile-photo-placeholder" aria-label="기본 프로필 사진">
              사진
            </div>
          )}
          <div className="profile-photo-actions">
            <input
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="profile-file-input"
              onChange={handleImageChange}
              ref={imageInputRef}
              type="file"
            />
            <button
              className="profile-photo-change"
              disabled={isUploadingImage}
              onClick={() => imageInputRef.current?.click()}
              type="button"
            >
              {isUploadingImage ? "업로드 중..." : "사진 변경"}
            </button>
            <button
              className="profile-button-secondary profile-photo-reset"
              onClick={() =>
                setImageNotice(
                  "기본 이미지 초기화 API가 제공되지 않아 서버 사진은 변경되지 않았습니다.",
                )
              }
              type="button"
            >
              기본 이미지로
            </button>
            <p>JPG · PNG / 최대 5MB</p>
          </div>
        </div>
        {imageNotice && (
          <p className="profile-inline-notice" role="status">
            {imageNotice}
          </p>
        )}

        {profileNotice && (
          <p className="profile-inline-notice" role="status">
            {profileNotice}
          </p>
        )}
        {profileError && (
          <p className="profile-form-error" role="alert">
            {profileError}
          </p>
        )}

        <form className="profile-info-form" onSubmit={handleProfileSubmit}>
          {editableFields.map(([field, label, type]) => (
            <div
              className={`profile-edit-field profile-field-${field}`}
              key={field}
            >
              <label htmlFor={`profile-${field}`}>{label}</label>
              <input
                autoComplete={
                  field === "name" || field === "nickname" ? "off" : undefined
                }
                id={`profile-${field}`}
                maxLength={
                  field === "name"
                    ? 10
                    : field === "nickname"
                      ? 20
                      : field === "email"
                        ? 100
                        : undefined
                }
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }));
                  setProfileErrors((current) => ({
                    ...current,
                    [field]: "",
                  }));
                }}
                type={type}
                value={form[field]}
              />
              {profileErrors[field] && (
                <p className="profile-form-error" role="alert">
                  {profileErrors[field]}
                </p>
              )}
            </div>
          ))}
          <div className="profile-form-actions">
            <button
              className="button button-primary"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? "저장 중..." : "변경사항 저장"}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-edit-section password-edit-section">
        <div className="password-section-heading">
          <h2>비밀번호 변경</h2>
          <p>변경할 때만 아래 항목을 입력해주세요.</p>
        </div>
        <form
          className="password-change-form"
          onSubmit={handlePasswordSubmit}
        >
          {passwordFields.map(([field, label, autocomplete]) => (
            <div className="profile-edit-field" key={field}>
              <label htmlFor={`password-${field}`}>{label}</label>
              <input
                autoComplete={autocomplete}
                id={`password-${field}`}
                maxLength={30}
                onChange={(event) => {
                  setPasswordForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }));
                  setPasswordErrors((current) => ({
                    ...current,
                    [field]: "",
                  }));
                }}
                ref={field === "currentPassword" ? passwordInputRef : undefined}
                type="password"
                value={passwordForm[field]}
              />
              {passwordErrors[field] && (
                <p className="profile-form-error" role="alert">
                  {passwordErrors[field]}
                </p>
              )}
            </div>
          ))}
          {passwordNotice && (
            <p className="profile-inline-notice" role="status">
              {passwordNotice}
            </p>
          )}
          <div className="profile-form-actions">
            <button
              className="button button-primary"
              disabled={isChangingPassword}
              type="submit"
            >
              {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </form>
      </section>
      {showMismatch && (
        <PasswordMismatchDialog onClose={closeMismatch} />
      )}
    </ProfileEditLayout>
  );
}

export default ProfileEditPage;
