import { useEffect, useState } from 'react';
import { testmypage, updateProfile } from '../../api/accounts';
import axios from 'axios';
import React from "react";
import { Link } from 'react-router-dom';

/* ===================== Tab Navigation ===================== */
function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: '개요', icon: 'ri-dashboard-line' },
    { id: 'savings',  label: '예·적금', icon: 'ri-piggy-bank-line' },
    { id: 'profile',  label: '프로필', icon: 'ri-user-line' },
    { id: 'security', label: '보안', icon: 'ri-shield-line' },
    { id: 'limit',    label: '한도 관리', icon: 'ri-wallet-line' },
    { id: 'document', label: '증빙 서류', icon: 'ri-file-text-line' },
    { id: 'tax',      label: '세금/공과금 계산', icon: 'ri-calculator-line' }
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
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

/* ===================== Overview Tab ===================== */
function OverviewTab({ onTabSwitch }) {
  const [sv, setSv] = useState({
    percent: 0, paid: 0, total: 0, acc: 0, target: 0, nextDueDate: null, topAccounts: []
  });

  useEffect(() => {
    axios.get('/api/mypage/summary')
      .then(res => setSv(res.data))
      .catch(() => setSv(prev => ({ ...prev, percent: 0 })));
  }, []);

  const Donut = ({ percent = 0, size = 96, stroke = 10 }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = Math.max(0, Math.min(100, percent)) / 100 * c;
    return (
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size/2} cy={size/2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none"/>
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          className="text-blue-500 -rotate-90 origin-center"
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="font-semibold text-gray-800">
          {Math.round(percent)}%
        </text>
      </svg>
    );
  };

  const services = [
    {
      title: '계좌 조회',
      description: '전체 계좌 현황 및 잔액 확인',
      icon: 'ri-bank-line',
      color: 'from-blue-300 to-sky-400',
      image: 'https://readdy.ai/api/search-image?query=modern%20banking%20account%20overview%20with%20elegant%20financial%20dashboard%2C%20clean%20white%20background%2C%20professional%20banking%20interface%2C%20digital%20account%20management%2C%20minimalist%20design%20style%2C%20soft%20lighting&width=400&height=300&seq=account_overview&orientation=landscape',
      href: "/accounts"
    },
    {
      title: '대출',
      description: '대출 관리',
      icon: 'ri-bank-card-line',
      color: 'from-blue-500 to-sky-400',
      image: 'https://readdy.ai/api/search-image?query=elegant%20credit%20cards%20and%20loan%20management%20interface%2C%20modern%20banking%20cards%20display%2C%20clean%20white%20background%2C%20professional%20financial%20services%2C%20minimalist%20design%2C%20soft%20professional%20lighting&width=400&height=300&seq=card_loan&orientation=landscape'
    },
    {
      title: '자산관리',
      description: '투자 포트폴리오 및 자산 현황',
      icon: 'ri-line-chart-line',
      color: 'from-blue-300 to-sky-400',
      image: 'https://readdy.ai/api/search-image?query=investment%20portfolio%20dashboard%20with%20growing%20charts%20and%20financial%20assets%2C%20clean%20white%20background%2C%20professional%20wealth%20management%20interface%2C%20minimalist%20design%2C%20modern%20financial%20graphics&width=400&height=300&seq=investment_wealth&orientation=landscape'
    },
    {
      title: '보안 설정',
      description: '비밀번호 및 보안 관리',
      icon: 'ri-shield-check-line',
      color: 'from-indigo-500 to-indigo-200',
      image: 'https://readdy.ai/api/search-image?query=digital%20security%20shield%20and%20lock%20interface%2C%20modern%20banking%20security%20system%2C%20clean%20white%20background%2C%20professional%20cybersecurity%20design%2C%20minimalist%20tech%20style%2C%20secure%20banking%20environment&width=400&height=300&seq=security_settings&orientation=landscape',
      href: "#",
      targetTab: 'security'
    },
    {
      title: '개인정보 수정',
      description: '회원정보 및 연락처 변경',
      icon: 'ri-user-settings-line',
      color: 'from-indigo-700 to-indigo-300',
      image: 'https://readdy.ai/api/search-image?query=personal%20profile%20management%20interface%2C%20modern%20user%20settings%20dashboard%2C%20clean%20white%20background%2C%20professional%20account%20management%2C%20minimalist%20design%2C%20user-friendly%20interface&width=400&height=300&seq=personal_info&orientation=landscape',
      href: "#",
      targetTab: 'profile'
    },
    {
      title: '빠른 이체',
      description: '자주 사용하는 계좌로 빠른 송금',
      icon: 'ri-exchange-line',
      color: 'from-indigo-500 to-indigo-200',
      image: 'https://readdy.ai/api/search-image?query=quick%20money%20transfer%20interface%20with%20arrows%20and%20banking%20symbols%2C%20modern%20digital%20payment%20system%2C%20clean%20white%20background%2C%20professional%20financial%20transfer%2C%20minimalist%20design&width=400&height=300&seq=quick_transfer&orientation=landscape',
      href: "/transfer"
    }
  ];

  const handleTabSwitch = (event, targetTabName) => {
    if (targetTabName && onTabSwitch) {
      event.preventDefault();
      onTabSwitch(targetTabName);
    }
  };

  return (
    <div className="space-y-6">
      {/* 예·적금 요약 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-6">
        <div className="w-28 h-28 flex items-center justify-center">
          <Donut percent={sv.percent}/>
        </div>
        <div className="space-y-1">
          <div className="text-xl font-semibold text-gray-800">{Math.round(sv.percent)}%</div>
          <div className="text-sm text-gray-600">납입회차 <b>{sv.paid}/{sv.total}</b></div>
          <div className="text-sm text-gray-600">누적 {sv.acc?.toLocaleString()} / 목표 {sv.target?.toLocaleString()}</div>
          {sv.nextDueDate && <div className="text-sm text-gray-600">다음 납입일 {sv.nextDueDate}</div>}
        </div>
        <div className="ml-auto">
          <button
            onClick={(e)=>{ e.preventDefault(); onTabSwitch?.('savings'); }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap">
            자세히 보기
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <i className="ri-dashboard-line text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">서비스 개요</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Link
            key={index}
            onClick={service.targetTab ? (e) => handleTabSwitch(e, service.targetTab) : undefined}
            to={service.href || "#"}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-80 group-hover:opacity-70 transition-opacity`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className={`${service.icon} text-2xl`} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{service.title}</h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                <span>자세히 보기</span>
                <i className="ri-arrow-right-line ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-lightbulb-line text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">오늘의 금융 팁</h3>
            <p className="text-gray-600 leading-relaxed">
              정기적인 가계부 작성과 투자 포트폴리오 점검을 통해 건전한 재정 관리를 유지하세요.
              매월 수입과 지출을 분석하여 불필요한 지출을 줄이고 투자 목표를 설정해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Savings Tab (간단 플레이스홀더) ===================== */
function SavingsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
          <i className="ri-piggy-bank-line text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">예·적금 상세</h2>
      </div>
      <p className="text-gray-600">예·적금 상세 화면 구성 예정입니다.</p>
    </div>
  );
}

/* ===================== Profile Tab ===================== */
function ProfileTab({ initialData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [gender, setGender] = useState(initialData?.cgenderCd || null);

  const [isTermsPopupOpen, setIsTermsPopupOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    enname: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    occupation: '정보 없음',
    gender: '',
    marketing: 'N',
    pinnum: '',
  });

  useEffect(() => {
    if (initialData && (initialData.cnameKr || initialData.cnamekr)) {
      const nameKey       = initialData.cnameKr ?? initialData.cnamekr;
      const ennameKey     = initialData.cnameEn ?? initialData.cnameen;
      const emailKey      = initialData.cemail;
      const phoneKey      = initialData.cphoneMobile ?? initialData.cphonemobile;
      const birthKey      = initialData.cbirthDt ?? initialData.cbirthdt;
      const marketingKey  = initialData.cagreeMarketing ?? initialData.cagreemarketing ?? 'N';
      const addressKey    = initialData.caddress;
      const pinnumKey     = initialData.cpinnumber;

      setProfileData({
        name: nameKey || '',
        enname: ennameKey || '',
        email: emailKey || '',
        phone: phoneKey || '',
        birthDate: birthKey ? String(birthKey).split('T')[0] : '',
        gender: initialData?.cgenderCd || '',
        address: addressKey || '',
        occupation: '정보 없음',
        marketing: marketingKey === 'Y' ? 'Y' : 'N',
        pinnum: pinnumKey || '',
      });
      setGender(initialData?.cgenderCd || '');
    } else {
      // 아직 데이터 로딩 중
    }
  }, [initialData]);

  const handleMarketingToggle = (event) => {
    const isChecked = event.target.checked;
    const newValue = isChecked ? 'Y' : 'N';
    setProfileData(prev => ({ ...prev, marketing: newValue }));
  };

  const handleGenderChange = (event) => {
    const newGenderValue = event.target.value; // 'm' | 'f'
    setGender(newGenderValue);
    setProfileData(prev => ({ ...prev, gender: newGenderValue }));
  };

  const mockTerms = `
제 1조 (목적)
본 약관은 [회사명]이 제공하는 이벤트, 할인 정보, 신제품 소식 등의 마케팅 정보를 고객에게 제공하는 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제 2조 (수신 동의)
1. 고객은 본 동의서를 통해 SMS, 이메일, 앱 푸시 등의 전자적 전송 매체를 통한 정보 수신에 동의할 수 있습니다.
2. 수신 동의 시, 고객은 마케팅 활용 목적에 필요한 개인정보(이름, 연락처, 이메일 등) 제공에 동의한 것으로 간주합니다.

제 3조 (철회 및 불이익)
1. 고객은 언제든지 동의를 철회할 수 있으며, 철회 후 즉시 마케팅 정보 발송이 중단됩니다.
2. 마케팅 정보 수신 동의 여부는 서비스 이용에 영향을 미치지 않습니다.
  `;

  const handleSave = () => {
    const updatedDto = {
      ...initialData,
      // ★ 백엔드 DTO 키 명세에 맞춰 통일
      cnameKr: profileData.name,
      cnameEn: profileData.enname,
      cemail: profileData.email,
      cphoneMobile: profileData.phone,
      cbirthDt: profileData.birthDate,
      cgenderCd: profileData.gender,
      cagreeMarketing: profileData.marketing,
      caddress: profileData.address,
    };

    updateProfile(updatedDto)
      .then(res => {
        console.log("프로필 업데이트 성공:", res.data);
        alert('프로필 정보가 성공적으로 저장되었습니다.');
        setIsEditing(false);
      })
      .catch(err => {
        console.error("프로필 업데이트 실패:", err);
        alert('프로필 업데이트에 실패했습니다. 다시 시도해 주세요.');
      });
  };

  return (
    <div className="space-y-6">
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
            isEditing
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isEditing ? '저장' : '편집'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* 프로필 사진 섹션 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profileData.name?.[0] || '?'}
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <i className="ri-camera-line text-sm" />
                </button>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{profileData.name || '이름없음'}</h3>
              <p className="text-gray-600">프리미엄 회원</p>
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (<i key={i} className="ri-star-fill text-sm" />))}
                </div>
                <span className="text-sm text-gray-500 ml-2">등급: VIP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보 섹션 */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">개인정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.name}</div>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.email}</div>
              )}
            </div>

            {/* 영문이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">영문이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.enname}
                  onChange={(e) => setProfileData({ ...profileData, enname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.enname}</div>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    id="gender-male"
                    name="gender"
                    type="radio"
                    value="m"
                    disabled={!isEditing}
                    checked={gender === 'm'}
                    onChange={handleGenderChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="gender-male" className="ml-3 block text-sm font-medium text-gray-700">
                    남성
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="gender-female"
                    name="gender"
                    type="radio"
                    value="f"
                    disabled={!isEditing}
                    checked={gender === 'f'}
                    onChange={handleGenderChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="gender-female" className="ml-3 block text-sm font-medium text-gray-700">
                    여성
                  </label>
                </div>
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.phone}</div>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.birthDate}</div>
              )}
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.address}</div>
              )}
            </div>

            {/* 직업 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">직업</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.occupation}</div>
              )}
            </div>
          </div>
        </div>

        {/* 계정 설정 섹션 */}
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">마케팅 수신 동의</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className="relative mt-2 p-3 text-right"
                tabIndex={-1}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setIsTermsPopupOpen(false);
                }}
              >
                <span className="text-sm text-gray-700">
                  ※버튼을 활성화 하시면 마케팅 수신{' '}
                  <a
                    className="text-sm text-gray-700 cursor-pointer pb-0.5 hover:text-blue-600 transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsTermsPopupOpen(prev => !prev)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsTermsPopupOpen(prev => !prev);
                      }
                    }}
                    style={{ textDecoration: 'underline' }}
                  >
                    약관
                  </a>
                  에 동의한 것으로 간주됩니다.
                  <span className="text-blue-600 font-semibold border-b border-dashed border-blue-400 ml-1">
                    <br /><small>(약관을 클릭하시면 내용을 보실수 있습니다.)</small>
                  </span>
                </span>

                {isTermsPopupOpen && (
                  <div className="absolute right-0 bottom-full mb-4 w-full max-w-xs sm:max-w-md lg:max-w-lg mx-2 md:mx-0 z-10 bg-white border border-blue-200 rounded-xl shadow-2xl p-4 transition duration-300 ease-in-out transform origin-bottom-right">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-base font-semibold text-blue-600">
                        마케팅 수신 약관 (요약)
                      </div>
                      <button
                        onClick={() => setIsTermsPopupOpen(false)}
                        className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100"
                        aria-label="약관 팝업 닫기"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-gray-700 space-y-2 max-h-48 overflow-y-auto pr-2">
                      {mockTerms.split('\n\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph.trim()}</p>
                      ))}
                    </div>
                    <div className="absolute right-3 -bottom-2 w-4 h-4 bg-white border-b border-r border-blue-200 transform rotate-45" />
                  </div>
                )}
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profileData.marketing === 'Y'}
                  disabled={!isEditing}
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

/* ===================== Security Tab ===================== */
function SecurityTab() {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <i className="ri-shield-check-line text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">보안 설정</h2>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i className="ri-shield-check-fill text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">보안 등급: 우수</h3>
            <p className="text-gray-600">모든 보안 설정이 활성화되어 있습니다.</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* OTP */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-smartphone-line text-blue-600 mr-2" />
          아마도 핀번호 인증
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mb-1">일회용 비밀번호 인증이 활성화되어 있습니다.</p>
            <p className="text-sm text-green-600">등록된 기기: iPhone 14 Pro</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowOTPModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              재설정
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap">
              비활성화
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 관리 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-lock-line text-orange-600 mr-2" />
          비밀번호 관리
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">로그인 비밀번호</p>
              <p className="text-sm text-gray-600">마지막 변경: 2024년 1월 15일</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
            >
              변경
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">거래 비밀번호</p>
              <p className="text-sm text-gray-600">마지막 변경: 2024년 1월 10일</p>
            </div>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap">
              변경
            </button>
          </div>
        </div>
      </div>

      {/* OTP 모달 */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">OTP 재설정</h3>
            <p className="text-gray-600 mb-4">새로운 기기에서 OTP를 설정하시겠습니까?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOTPModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={() => setShowOTPModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Limit Tab ===================== */
function LimitTab() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState('');

  const limits = [
    { type: '일일 이체한도', current: '500만원',  max: '1,000만원', icon: 'ri-exchange-line', color: 'blue' },
    { type: '월간 이체한도', current: '3,000만원', max: '5,000만원',  icon: 'ri-calendar-line', color: 'green' },
    { type: '카드 결제한도', current: '300만원',  max: '500만원',  icon: 'ri-bank-card-line', color: 'purple' },
    { type: '해외송금 한도', current: '$5,000',  max: '$10,000', icon: 'ri-global-line', color: 'orange' }
  ];

  const handleEditLimit = (limitType) => {
    setSelectedLimit(limitType);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <i className="ri-wallet-line text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">한도 관리</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {limits.map((limit, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* 동적 색상은 Tailwind safelist 필요할 수 있음 */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100`}>
                  <i className={`${limit.icon} text-gray-700`} />
                </div>
                <h3 className="font-semibold text-gray-800">{limit.type}</h3>
              </div>
              <button
                onClick={() => handleEditLimit(limit.type)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                수정
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">현재 한도</span>
                <span className="font-semibold text-gray-800">{limit.current}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">최대 한도</span>
                <span className="text-sm text-gray-500">{limit.max}</span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>사용률</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 bg-gray-600 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 변경 내역 (예시) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-history-line text-indigo-600 mr-2" />
          최근 한도 변경 내역
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-exchange-line text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium">일일 이체한도 변경</p>
                <p className="text-xs text-gray-500">300만원 → 500만원</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.15</p>
              <p className="text-xs text-green-600">승인완료</p>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedLimit} 변경</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새로운 한도</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="한도를 입력하세요"
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">만원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">변경 사유</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="한도 변경 사유를 입력해주세요"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  한도 증액 신청 시 신용도 평가가 진행되며, 심사 결과에 따라 승인되지 않을 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                신청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Document Tab ===================== */
function DocumentTab() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  const documents = [
    { type: '신분증', name: '주민등록증_조원빈.pdf', uploadDate: '2024.01.15', status: '승인완료', icon: 'ri-id-card-line', color: 'green' },
    { type: '소득증명서', name: '근로소득원천징수영수증_2023.pdf', uploadDate: '2024.01.10', status: '승인완료', icon: 'ri-file-text-line', color: 'blue' },
    { type: '재직증명서', name: '재직증명서_테크컴퍼니.pdf', uploadDate: '2024.01.08', status: '심사중', icon: 'ri-building-line', color: 'orange' },
    { type: '통장사본', name: '통장사본_하나은행.pdf', uploadDate: '2024.01.05', status: '승인완료', icon: 'ri-bank-line', color: 'purple' }
  ];

  const requiredDocs = [
    { type: '신분증', required: true, submitted: true },
    { type: '소득증명서', required: true, submitted: true },
    { type: '재직증명서', required: true, submitted: true },
    { type: '통장사본', required: true, submitted: true },
    { type: '거주지 확인서', required: false, submitted: false },
    { type: '사업자등록증', required: false, submitted: false }
  ];

  const handleUpload = (docType) => {
    setSelectedDocType(docType);
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <i className="ri-file-text-line text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">증빙 서류</h2>
      </div>

      {/* 제출 현황 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">서류 제출 완료</h3>
              <p className="text-gray-600">필수 서류가 모두 제출되었습니다.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-500">완료율</div>
          </div>
        </div>
      </div>

      {/* 제출된 서류 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="ri-folder-line text-blue-600 mr-2" />
            제출된 서류
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {documents.map((doc, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i className={`${doc.icon} text-gray-700`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{doc.type}</h4>
                    <p className="text-sm text-gray-600">{doc.name}</p>
                    <p className="text-xs text-gray-500">업로드: {doc.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === '승인완료' ? 'bg-green-100 text-green-800'
                      : doc.status === '심사중' ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doc.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    <i className="ri-download-line" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 체크리스트 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-task-line text-purple-600 mr-2" />
          서류 제출 체크리스트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocs.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${doc.submitted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <i className={doc.submitted ? 'ri-check-line' : 'ri-time-line'} style={{ fontSize: 12 }} />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">{doc.type}</span>
                  {doc.required && <span className="text-xs text-red-500 ml-1">*필수</span>}
                </div>
              </div>
              {!doc.submitted && (
                <button
                  onClick={() => handleUpload(doc.type)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  업로드
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedDocType} 업로드</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">파일을 여기로 드래그하거나</p>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap">
                  파일 선택
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                지원 형식: PDF, JPG, PNG (최대 10MB)
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Tax Tab ===================== */
function TaxTab() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [showCalculator, setShowCalculator] = useState(false);

  const taxData = [
    { type: '소득세', amount: '1,250,000', status: '납부완료', dueDate: '2024.05.31', icon: 'ri-money-dollar-circle-line', color: 'green' },
    { type: '지방소득세', amount: '125,000', status: '납부완료', dueDate: '2024.05.31', icon: 'ri-building-line', color: 'blue' },
    { type: '주민세', amount: '100,000', status: '납부예정', dueDate: '2024.08.31', icon: 'ri-home-line', color: 'orange' },
    { type: '재산세', amount: '450,000', status: '납부완료', dueDate: '2024.07.16', icon: 'ri-building-2-line', color: 'purple' }
  ];

  const publicBills = [
    { type: '전기요금', amount: '85,400', month: '2024년 1월', status: '납부완료', icon: 'ri-flashlight-line', color: 'yellow' },
    { type: '가스요금', amount: '127,500', month: '2024년 1월', status: '납부완료', icon: 'ri-fire-line', color: 'red' },
    { type: '수도요금', amount: '42,300', month: '2024년 1월', status: '납부완료', icon: 'ri-drop-line', color: 'blue' },
    { type: '통신요금', amount: '89,000', month: '2024년 1월', status: '미납부', icon: 'ri-smartphone-line', color: 'purple' }
  ];

  const deductions = [
    { category: '건강보험료', amount: '180,000', rate: '15%' },
    { category: '국민연금',   amount: '540,000', rate: '30%' },
    { category: '신용카드',   amount: '1,200,000', rate: '10%' },
    { category: '교육비',     amount: '450,000', rate: '20%' },
    { category: '의료비',     amount: '320,000', rate: '18%' },
    { category: '기부금',     amount: '200,000', rate: '12%' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="ri-calculator-line text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">세금/공과금 계산</h2>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="2022">2022년</option>
          </select>
          <button
            onClick={() => setShowCalculator(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
          >
            세금 계산기
          </button>
        </div>
      </div>

      {/* 연간 요약 */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">2024년 세금 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">₩1,925,000</div>
            <div className="text-sm text-gray-600">총 납부세액</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₩1,825,000</div>
            <div className="text-sm text-gray-600">납부완료</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">₩100,000</div>
            <div className="text-sm text-gray-600">납부예정</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₩2,890,000</div>
            <div className="text-sm text-gray-600">소득공제</div>
          </div>
        </div>
      </div>

      {/* 세금 납부 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="ri-tax-line text-green-600 mr-2" />
            세금 납부 현황
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {taxData.map((tax, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i className={`${tax.icon} text-gray-700`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{tax.type}</h4>
                    <p className="text-sm text-gray-600">납부기한: {tax.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">₩{tax.amount}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tax.status === '납부완료' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {tax.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 공과금 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="ri-bill-line text-blue-600 mr-2" />
            공과금 납부 현황
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {publicBills.map((bill, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i className={`${bill.icon} text-gray-700 text-sm`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{bill.type}</h4>
                    <p className="text-xs text-gray-500">{bill.month}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">₩{bill.amount}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bill.status === '납부완료' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 소득공제 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-discount-percent-line text-purple-600 mr-2" />
          소득공제 현황
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deductions.map((deduction, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">{deduction.category}</span>
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {deduction.rate}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-800">₩{deduction.amount}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: deduction.rate }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 계산기 모달 */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">간단 세금 계산기</h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연간 총소득</label>
                <input
                  type="text"
                  placeholder="소득을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부양가족 수</label>
                <select className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="0">0명</option>
                  <option value="1">1명</option>
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명 이상</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">신용카드 사용액</label>
                <input
                  type="text"
                  placeholder="연간 신용카드 사용액"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">예상 세액</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>소득세</span>
                    <span className="font-medium">₩1,250,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>지방소득세</span>
                    <span className="font-medium">₩125,000</span>
                  </div>
                  <div className="border-t border-orange-200 pt-1 flex justify-between font-semibold">
                    <span>총 세액</span>
                    <span>₩1,375,000</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCalculator(false)}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                계산하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Sidebar ===================== */
function Sidebar({ customerName, customerPhone }) {
  return (
    <aside className="w-80 bg-gray-50 border-l border-gray-200 p-6">
      <div className="space-y-6">
        {/* 회원 확인 */}
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

        {/* 요약 */}
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
              {customerPhone !== null
                ? <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">완료</span>
                : <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">미등록</span>}
            </div>
          </div>
        </div>

        {/* 보안 주의 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-shield-check-line text-orange-600 mr-2" />
            보안 주의
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">핀번호/비밀번호 관리</div>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              정기적인 비밀번호 변경을 권장합니다
            </div>
          </div>
        </div>

        {/* 문의/도움말 */}
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
                const widget = document.querySelector('#vapi-widget-floating-button');
                if (widget) widget.click();
              }}
              className="w-full mt-3 bg-teal-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors whitespace-nowrap"
            >
              AI 상담사와 채팅하기
            </button>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-time-line text-purple-600 mr-2" />
            최근 활동
          </h3>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 border-l-2 border-blue-200 pl-2">
              <div>계좌 조회</div>
              <div className="text-gray-400">2분 전</div>
            </div>
            <div className="text-xs text-gray-500 border-l-2 border-green-200 pl-2">
              <div>이체 실행</div>
              <div className="text-gray-400">15분 전</div>
            </div>
            <div className="text-xs text-gray-500 border-l-2 border-orange-200 pl-2">
              <div>보안 설정 변경</div>
              <div className="text-gray-400">1시간 전</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ===================== MyPage Root ===================== */
function MyPage() {
  const [customerProfile, setCustomerProfile] = useState({});
  const [customerName, setCustomerName] = useState('이름없음');
  const [customerPhone, setCustomerPhone] = useState('로딩 중...');
  const [activeTab, setActiveTab] = useState('overview');

  const goToTab = (tabName) => setActiveTab(tabName);

  useEffect(() => {
    testmypage()
      .then(res => {
        const customerData = res.data;
        setCustomerProfile(customerData);

        const fetchedName = customerData?.cnameKr;
        if (fetchedName) setCustomerName(fetchedName);
        else {
          console.error("DTO에서 cnameKr 필드를 찾을 수 없거나 값이 비어있습니다.");
          setCustomerName('데이터 오류');
        }

        const fetchedPin = customerData?.cpinnumber;
        if (fetchedPin) {
          setCustomerPhone(fetchedPin);
          console.log(customerData.cpinnumber);
        } else {
          console.warn("DTO에서 cpinnumber 필드를 찾을 수 없거나 값이 비어있습니다.");
          setCustomerPhone(null);
        }
      })
      .catch(error => {
        console.error("API 호출 중 예외 발생:", error);
        setCustomerName('통신 오류');
      });
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onTabSwitch={goToTab} />;
      case 'savings':
        return <SavingsTab />;
      case 'profile':
        return <ProfileTab initialData={customerProfile} />;
      case 'security':
        return <SecurityTab />;
      case 'limit':
        return <LimitTab />;
      case 'document':
        return <DocumentTab />;
      case 'tax':
        return <TaxTab />;
      default:
        return <OverviewTab onTabSwitch={goToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-38 py-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex">
            <div className="flex-1 p-6">
              {renderTabContent()}
            </div>
            <Sidebar customerName={customerName} customerPhone={customerPhone} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
