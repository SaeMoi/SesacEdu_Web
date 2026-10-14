// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../components/navigation/MyPageNavigation.jsx";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getProfile, ProfileApiError } from "../api/profile.js";
import SiteHeader from "../components/SiteHeader.jsx";
import "./MyPage.css";
const profileFields = [
  ["이름", "name"],
  ["이메일", "email"],
  ["닉네임", "nickname"],
  ["휴대폰", "phone"],
  ["생년월일", "birthDate"],
];

const roleLabels = {
  STUDENT: "학습자",
  INSTRUCTOR: "강사",
  ADMIN: "관리자",
};

function displayValue(value) {
  return typeof value === "string" && value.trim() ? value : "정보 없음";
}

function formatBirthDate(value) {
  if (typeof value !== "string" || !value.trim()) return "정보 없음";
  return value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}

function formatPhone(value) {
  if (typeof value !== "string" || !value.trim()) return "정보 없음";
  if (value.includes("*")) return value;

  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return value;

  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

function getErrorMessage(error) {
  if (!(error instanceof ProfileApiError)) {
    return "네트워크 오류로 프로필을 불러오지 못했습니다. 다시 시도해 주세요.";
  }

  switch (error.code) {
    case "UNAUTHORIZED":
      return "로그인이 필요합니다. 현재 프로젝트에 연결된 로그인 경로가 없어 프로필을 표시할 수 없습니다.";
    case "TOKEN_EXPIRED":
      return "로그인 토큰이 만료되었습니다. 토큰 재발급 연동 후 다시 시도해 주세요.";
    case "MEMBER_NOT_FOUND":
      return "회원 정보를 찾을 수 없습니다.";
    case "INVALID_RESPONSE":
      return "프로필 서버의 응답을 확인할 수 없습니다. 서버 연결을 확인해 주세요.";
    default:
      return error.message || "프로필 정보를 불러오지 못했습니다.";
  }
}

function ProfileContent() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editNotice, setEditNotice] = useState(false);

  const loadProfile = async (signal) => {
    try {
      const result = await getProfile({ signal });
      setProfile(result);
      setStatus("success");
    } catch (error) {
      if (error.name === "AbortError") return;
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal })
      .then((result) => {
        setProfile(result);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const name = displayValue(profile?.name);
  const role =
    typeof profile?.role === "string" && profile.role.trim()
      ? roleLabels[profile.role] ?? profile.role
      : "";
  const imageUrl =
    typeof profile?.profileImageUrl === "string" &&
    profile.profileImageUrl.trim()
      ? profile.profileImageUrl
      : "";

  return (
    <main className="profile-content">
      <nav className="breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>

      <header className="profile-heading">
        <h1>프로필 관리</h1>
        <p>회원님의 기본 정보를 확인하고 관리할 수 있어요.</p>
      </header>

      <MyPageTabs active="profile" />

      {status === "loading" && (
        <p className="profile-message" role="status">
          프로필 정보를 불러오는 중입니다.
        </p>
      )}

      {status === "error" && (
        <section className="profile-message profile-error" role="alert">
          <p>{errorMessage}</p>
          <button
            className="button button-primary retry-button"
            onClick={() => {
              setStatus("loading");
              setErrorMessage("");
              loadProfile();
            }}
            type="button"
          >
            다시 시도
          </button>
        </section>
      )}

      {status === "success" && (
        <>
          <section className="profile-card" aria-label="회원 프로필">
            {imageUrl ? (
              <img className="profile-avatar" src={imageUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                {typeof profile?.name === "string" && profile.name.trim()
                  ? profile.name.trim().slice(0, 1)
                  : "?"}
              </div>
            )}
            <div className="profile-identity">
              <div className="profile-name-line">
                <h2>{name}</h2>
                {role && <span className="profile-role">{role}</span>}
              </div>
              <p>{displayValue(profile?.email)}</p>
            </div>
            <button
              className="button button-primary edit-profile-button"
              onClick={() => setEditNotice((visible) => !visible)}
              type="button"
            >
              프로필 수정
            </button>
          </section>

          {editNotice && (
            <p className="edit-notice" role="status">
              프로필 수정은 현재 비밀번호 확인 API 연동 후 이용할 수 있습니다.
            </p>
          )}

          <section className="basic-info" aria-labelledby="basic-info-title">
            <h2 id="basic-info-title">기본 정보</h2>
            <dl className="profile-details">
              {profileFields.map(([label, field]) => {
                let value = profile?.[field];
                if (field === "birthDate") value = formatBirthDate(value);
                else if (field === "phone") value = formatPhone(value);
                else value = displayValue(value);

                return (
                  <div className="profile-detail" key={field}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </>
      )}
    </main>
  );
}

function MyPage() {
  return (
    <>
      <SiteHeader />
      <div className="mypage-layout">
        <MyPageSidebar />
        <ProfileContent />
      </div>
    </>
  );
}

export default MyPage;
