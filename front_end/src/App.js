// src/pages/mypage/my_customer2.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { testmypage, updateProfile } from "../../api/accounts";

/* =========================================================
   공용 유틸
========================================================= */
const toGenderLabel = (cd) =>
  cd === "M" || cd === "m" ? "남성" : cd === "F" || cd === "f" ? "여성" : "-";

/** 서버에서 내려온 직업 문자열 읽기 (필드명이 팀마다 달라서 안전하게 합침) */
const readServerOccupation = (initialData = {}) => {
  const raw =
    initialData.coccupation ??
    initialData.c_occupation ??
    initialData.occupation ??
    initialData.job ??
    "";
  return typeof raw === "string" ? raw : String(raw ?? "");
};

/* =========================================================
   탭 네비게이션
========================================================= */
function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: "overview", label: "개요", icon: "ri-dashboard-line" },
    { id: "profile", label: "프로필", icon: "ri-user-line" },
    { id: "security", label: "보안", icon: "ri-shield-line" },
    { id: "limit", label: "한도 관리", icon: "ri-wallet-line" },
    { id: "document", label: "증빙 서류", icon: "ri-file-text-line" },
    { id: "tax", label: "세금/공과금 계산", icon: "ri-calculator-line" },
  ];
  return (
    <nav className="border-b border-gray-200 bg-gray-50/50">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <i className={`${tab.icon} text-lg`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/* =========================================================
   개요 탭
========================================================= */
function OverviewTab({ onTabSwitch }) {
  const services = [
    {
      title: "계좌 조회",
      description: "전체 계좌 현황 및 잔액 확인",
      icon: "ri-bank-line",
      color: "from-blue-300 to-sky-400",
      href: "/accounts",
      image:
        "https://readdy.ai/api/search-image?query=modern%20banking%20account%20overview%20with%20elegant%20financial%20dashboard%2C%20clean%20white%20background%2C%20professional%20banking%20interface&width=400&height=300&seq=account_overview",
    },
    {
      title: "상품",
      description: "상품 관리",
      icon: "ri-bank-card-line",
      color: "from-blue-500 to-sky-400",
      href: "/deposits",
      image:
        "https://readdy.ai/api/search-image?query=credit%20cards%20and%20loan%20management%20interface&width=400&height=300&seq=card_loan",
    },
    {
      title: "자산관리",
      description: "투자 포트폴리오 및 자산 현황",
      icon: "ri-line-chart-line",
      color: "from-blue-300 to-sky-400",
      image:
        "https://readdy.ai/api/search-image?query=investment%20portfolio%20dashboard&width=400&height=300&seq=investment_wealth",
    },
    {
      title: "보안 설정",
      description: "비밀번호 및 보안 관리",
      icon: "ri-shield-check-line",
      color: "from-indigo-500 to-indigo-200",
      href: "#",
      targetTab: "security",
      image:
        "https://readdy.ai/api/search-image?query=banking%20security%20shield%20ui&width=400&height=300&seq=security_settings",
    },
    {
      title: "개인정보 수정",
      description: "회원정보 및 연락처 변경",
      icon: "ri-user-settings-line",
      color: "from-indigo-700 to-indigo-300",
      href: "#",
      targetTab: "profile",
      image:
        "https://readdy.ai/api/search-image?query=personal%20profile%20dashboard&width=400&height=300&seq=personal_info",
    },
    {
      title: "빠른 이체",
      description: "자주 사용하는 계좌로 빠른 송금",
      icon: "ri-exchange-line",
      color: "from-indigo-500 to-indigo-200",
      href: "/transfer",
      image:
        "https://readdy.ai/api/search-image?query=quick%20money%20transfer%20ui&width=400&height=300&seq=quick_transfer",
    },
  ];

  const handleTabSwitch = (e, target) => {
    if (target && onTabSwitch) {
      e.preventDefault();
      onTabSwitch(target);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <i className="ri-dashboard-line text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">서비스 개요</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <Link
            key={i}
            to={s.href || "#"}
            onClick={s.targetTab ? (e) => handleTabSwitch(e, s.targetTab) : undefined}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img src={s.image} alt={s.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
              <div className={`absolute inset-0 bg-gradient-to-t ${s.color} opacity-80 group-hover:opacity-70 transition-opacity`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className={`${s.icon} text-2xl`} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
              <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                <span>자세히 보기</span>
                <i className="ri-arrow-right-line ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   프로필 탭 (마케팅 동의: 즉시 저장)
========================================================= */
function ProfileTab({ initialData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [genderUI, setGenderUI] = useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    enname: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    gender: "",
    occupation: "미입력",
    marketing: "N",
    loginty: "",
    naverid: "",
  });

  // 직업(서버 → 보기)
  const [occupationNone, setOccupationNone] = useState(false);
  const [occSelected, setOccSelected] = useState([]);
  const [occCustomOn, setOccCustomOn] = useState(false);
  const [occCustom, setOccCustom] = useState("");

  const OCC_OPTIONS = [
    "학생",
    "회사원",
    "공무원",
    "자영업",
    "프리랜서",
    "전문직",
    "무직",
    "군인",
    "연구원",
    "서비스직",
  ];

  useEffect(() => {
    if (!initialData) return;
    const nameKr = initialData.cnameKr ?? initialData.cnamekr ?? "";
    const nameEn = initialData.cnameEn ?? initialData.c_name_en ?? "";
    const email = initialData.email ?? "";
    const phone = initialData.cphoneMobile ?? "";
    const birth = (initialData.cbirthDt || initialData.cBirthDt || "").toString();
    const birthDate = birth.includes("T") ? birth.split("T")[0] : birth;
    const genderCd = (initialData.cgenderCd || initialData.cGenderCd || "").toString().toUpperCase();
    const address = initialData.caddress ?? "";
    const marketing = (initialData.cagreeMarketing || initialData.c_agree_marketing || "N") === "Y" ? "Y" : "N";
    const occupationStr = readServerOccupation(initialData);

    setProfileData((prev) => ({
      ...prev,
      name: nameKr,
      enname: nameEn,
      email,
      phone,
      address,
      birthDate,
      gender: genderCd,
      marketing,
      loginty: initialData.loginType ?? "",
      naverid: initialData.naverid ?? "",
    }));
    setGenderUI(genderCd?.toLowerCase());

    // 직업 문자열 분해
    const parsed = occupationStr
      ? occupationStr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const inOpts = parsed.filter((x) => OCC_OPTIONS.includes(x));
    const outOpts = parsed.filter((x) => !OCC_OPTIONS.includes(x));
    setOccSelected(inOpts);
    setOccCustom(outOpts.join(", "));
    setOccCustomOn(outOpts.length > 0);
    setOccupationNone(parsed.length === 0);
  }, [initialData]);

  // 마케팅 동의: 즉시 저장
  const handleMarketingToggle = async (e) => {
    const nextVal = e.target.checked ? "Y" : "N";
    setProfileData((prev) => ({ ...prev, marketing: nextVal }));

    const dto = {
      ...initialData,
      cagreeMarketing: nextVal,
      // 다음은 서버 Validation 회피용 동반 필드
      cnameKr: profileData.name,
      cnameEn: profileData.enname,
      email: profileData.email,
      cphoneMobile: profileData.phone,
      caddress: profileData.address,
      cBirthDt: profileData.birthDate,
      cGenderCd: profileData.gender,
      coccupation: profileData.occupation,
    };

    try {
      await updateProfile(dto);
    } catch (err) {
      // 실패 시 롤백
      setProfileData((prev) => ({
        ...prev,
        marketing: prev.marketing === "Y" ? "N" : "Y",
      }));
      alert("마케팅 동의 저장에 실패했습니다.");
    }
  };

  // 편집 저장 (직업 포함)
  const buildOccString = () => {
    if (occupationNone) return "";
    const parts = [
      ...occSelected,
      ...(occCustomOn && occCustom.trim()
        ? occCustom.split(",").map((s) => s.trim()).filter(Boolean)
        : []),
    ];
    return [...new Set(parts)].join(", ");
  };

  const handleSave = async () => {
    const occFinal = buildOccString();
    const dto = {
      ...initialData,
      cnameKr: profileData.name,
      cnameEn: profileData.enname,
      email: profileData.email,
      cphoneMobile: profileData.phone,
      caddress: profileData.address,
      cBirthDt: profileData.birthDate,
      cGenderCd: profileData.gender,
      cagreeMarketing: profileData.marketing,
      cOccupation: occFinal,
      c_occupation: occFinal,
      occupation: occFinal,
    };
    try {
      await updateProfile(dto);
      alert("프로필 정보가 저장되었습니다.");
      setIsEditing(false);
    } catch {
      alert("저장에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const toggleOcc = (label) => {
    setOccupationNone(false);
    setOccSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const displayOcc = () => {
    if (occupationNone || (occSelected.length === 0 && !occCustom.trim()))
      return "미입력";
    const customShown =
      occCustomOn && occCustom.trim() ? occCustom.trim() : "";
    return [...occSelected, ...(customShown ? [customShown] : [])].join(", ");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 & 저장 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <i className="ri-user-line text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">프로필 관리</h2>
        </div>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            isEditing ? "bg-green-500 text-white hover:bg-green-600" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isEditing ? "저장" : "편집"}
        </button>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* 상단 프로필 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profileData.name?.[0] || "?"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{profileData.name || "-"}</h3>
              <p className="text-gray-600">
                {profileData.naverid != null || profileData.loginty === "NAVER" ? "통합아이디 로그인 중" : "이음은행로그인 중"}
              </p>
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="ri-star-fill text-sm" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">등급: VIP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보 폼 */}
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">개인정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.name || "-"}</div>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.email || "-"}</div>
              )}
            </div>

            {/* 영문이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">영문이름</label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="예) LEE MIN JUN"
                  value={profileData.enname}
                  onChange={(e) => setProfileData((p) => ({ ...p, enname: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.enname || <span className="text-gray-400">외화 계좌 개설시 표시됩니다.</span>}
                </div>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gender"
                    value="m"
                    checked={genderUI === "m"}
                    onChange={() => {
                      setGenderUI("m");
                      setProfileData((p) => ({ ...p, gender: "M" }));
                    }}
                    disabled={!isEditing}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>남성</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gender"
                    value="f"
                    checked={genderUI === "f"}
                    onChange={() => {
                      setGenderUI("f");
                      setProfileData((p) => ({ ...p, gender: "F" }));
                    }}
                    disabled={!isEditing}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>여성</span>
                </label>
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.phone || "-"}</div>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profileData.birthDate || ""}
                  onChange={(e) => setProfileData((p) => ({ ...p, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.birthDate || "-"}</div>
              )}
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.address || "-"}</div>
              )}
            </div>

            {/* 직업 보기/편집 (간단 버전) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">직업</label>
              </div>
              {!isEditing ? (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{displayOcc()}</div>
              ) : (
                <div className="space-y-3 border rounded-lg p-3">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={occupationNone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setOccupationNone(checked);
                        if (checked) {
                          setOccSelected([]);
                          setOccCustom("");
                          setOccCustomOn(false);
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">직업 없음(미입력)</span>
                  </label>

                  <div className={`${occupationNone ? "opacity-50" : ""}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["학생","회사원","공무원","자영업","프리랜서","전문직","무직","군인","연구원","서비스직"].map((opt) => (
                        <label key={opt} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={occSelected.includes(opt)}
                            onChange={() => toggleOcc(opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 space-y-2">
                      <label className="inline-flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={occCustomOn}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setOccCustomOn(on);
                            if (on) setOccupationNone(false);
                          }}
                        />
                        <span>직접 입력</span>
                      </label>
                      {occCustomOn && (
                        <input
                          type="text"
                          value={occCustom}
                          onChange={(e) => setOccCustom(e.target.value.slice(0, 80))}
                          onFocus={() => setOccupationNone(false)}
                          placeholder="예) 소프트웨어 엔지니어, 디자이너"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      )}
                      {occCustomOn && (
                        <p className="text-xs text-gray-500">
                          쉼표(,)로 여러 개를 입력할 수 있어요. {(occCustom?.length || 0)}/80
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 마케팅 수신 동의 (항상 활성, 즉시 저장) */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">마케팅 수신 동의</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                버튼을 활성화 하시면 마케팅 수신 <span className="text-gray-700">약관</span>에 동의한 것으로 간주됩니다.
              </p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profileData.marketing === "Y"}
                  onChange={handleMarketingToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   보안/한도/서류/세금 — 간단 섹션 (정의 누락 방지)
========================================================= */
function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <i className="ri-shield-check-line text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">보안 설정</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">보안 관련 설정은 준비 중입니다.</p>
      </div>
    </div>
  );
}

function LimitTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <i className="ri-wallet-line text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">한도 관리</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">한도 관리 기능은 준비 중입니다.</p>
      </div>
    </div>
  );
}

function DocumentTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <i className="ri-file-text-line text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">증빙 서류</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">서류 업로드/검증 기능은 준비 중입니다.</p>
      </div>
    </div>
  );
}

function TaxTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <i className="ri-calculator-line text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">세금/공과금 계산</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">계산기는 추후 제공됩니다.</p>
      </div>
    </div>
  );
}

/* =========================================================
   사이드바
========================================================= */
function Sidebar({ customerName, customerPhone }) {
  return (
    <aside className="w-72 bg-gray-50 border-l border-gray-200 p-6">
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-user-line text-gray-600 mr-2" />
            My
          </h3>
          <div className="space-y-2">
            <div className="text-right">
              <div className="text-sm opacity-90">안녕하세요</div>
              <div className="font-semibold">{customerName} 님</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-pie-chart-line text-blue-600 mr-2" />
            요약
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">이체한도</span>
              <span className="text-sm font-medium">1,000만원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">핀번호 등록</span>
              {customerPhone !== null ? (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">완료</span>
              ) : (
                <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">미등록</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-shield-check-line text-orange-600 mr-2" />
            보안 주의
          </h3>
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            정기적인 비밀번호 변경을 권장합니다
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-customer-service-line text-teal-600 mr-2" />
            문의/도움말
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <i className="ri-mail-line text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">이메일</div>
                <div className="text-sm">support@E-UMbank.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <i className="ri-phone-line text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">전화</div>
                <div className="text-sm">1588-1234</div>
              </div>
            </div>
            <button
              onClick={() => {
                const widget = document.querySelector("#vapi-widget-floating-button");
                if (widget) widget.click();
              }}
              className="w-full mt-3 bg-teal-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              AI 상담사와 채팅하기
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   메인 페이지 (my_customer2)
========================================================= */
export default function MyCustomer2() {
  const [customerProfile, setCustomerProfile] = useState({});
  const [customerName, setCustomerName] = useState("이름없음");
  const [customerPhone, setCustomerPhone] = useState("로딩 중...");
  const [activeTab, setActiveTab] = useState("overview"); // 필요 시 "profile"로 시작

  useEffect(() => {
    testmypage()
      .then((res) => {
        const data = res.data || {};
        setCustomerProfile(data);
        setCustomerName(data?.cnameKr || "데이터 오류");
        setCustomerPhone(data?.cpinnumber ? data.cpinnumber : null);
      })
      .catch((err) => {
        console.error("API 호출 중 예외:", err);
        setCustomerName("통신 오류");
      });
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab onTabSwitch={setActiveTab} />;
      case "profile":
        return <ProfileTab initialData={customerProfile} />;
      case "security":
        return <SecurityTab />;
      case "limit":
        return <LimitTab />;
      case "document":
        return <DocumentTab />;
      case "tax":
        return <TaxTab />;
      default:
        return <OverviewTab onTabSwitch={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex">
            <div className="flex-1 p-6">{renderTab()}</div>
            <Sidebar customerName={customerName} customerPhone={customerPhone} />
          </div>
        </div>
      </div>
    </div>
  );
}
