import { useEffect, useState } from 'react';
import { testmypage } from '../../api/accounts';
import { updateProfile } from '../../api/accounts';
import { CheckPinProvider} from "./contexts/CheckPinContext";
import { useCheckPin } from "./contexts/CheckPinContext";

import { resetPin } from "../account/api/accountApi";

import axios from 'axios';
import React from "react";
import { Link } from 'react-router-dom';
// Header Component
function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <i className="ri-bank-line text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Pacifico, serif" }}>NeoBank</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm opacity-90">안녕하세요</div>
            <div className="font-semibold">조원빈 님</div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
            <i className="ri-user-line text-lg"></i>
          </div>
        </div>
      </div>
    </header>
  );
}

// TabNavigation Component
function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: '개요', icon: 'ri-dashboard-line' },
    { id: 'profile', label: '프로필', icon: 'ri-user-line' },
    { id: 'security', label: '보안', icon: 'ri-shield-line' },
    { id: 'limit', label: '한도 관리', icon: 'ri-wallet-line' },
    { id: 'document', label: '증빙 서류', icon: 'ri-file-text-line' },
    { id: 'tax', label: '세금/공과금 계산', icon: 'ri-calculator-line' }
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
            <i className={`${tab.icon} text-lg`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// OverviewTab Component
function OverviewTab({onTabSwitch}) {
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

  // Link의 기본 동작을 막고 탭 전환 함수를 실행하는 범용 핸들러
  const handleTabSwitch = (event, targetTabName) => {
    // targetTabName이 있고 onTabSwitch 함수가 전달되었는지 확인
    if (targetTabName && onTabSwitch) {
      event.preventDefault(); // Link의 URL 이동 기본 동작 방지
      onTabSwitch(targetTabName); // ★ 매개변수로 탭 이름(예: 'security' 또는 'profile') 전달
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <i className="ri-dashboard-line text-blue-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">서비스 개요</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Link
            key={index}
            // '탭 전환' 항목(href가 #이거나 targetTab이 있는 항목)에만 핸들러 적용
            onClick={service.targetTab ? (e) => handleTabSwitch(e, service.targetTab) : undefined}
            // to는 href 값을 그대로 사용합니다. (일반 링크는 /accounts로, 프로필은 #로)
            to={service.href || "#"}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-80 group-hover:opacity-70 transition-opacity`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className={`${service.icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{service.title}</h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                <span>자세히 보기</span>
                <i className="ri-arrow-right-line ml-1 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-lightbulb-line text-blue-600 text-xl"></i>
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

// ProfileTab Component
function ProfileTab({initialData}) {
  const [isEditing, setIsEditing] = useState(false);
  const [gender, setGender] = useState(initialData?.cgenderCd || null);
  const [checkPin, setCheckPin] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    enname: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    occupation: '',
    gender:'',
    marketing:'',
    pinnum:'',
    loginty: '',
    naverid: '',
  });

  const [isTermsPopupOpen, setIsTermsPopupOpen] = useState(false);



  useEffect(() => {
    // initialData가 존재하고, DTO의 핵심 필드가 채워졌을 때만 실행
    // cnameKr 대신 cnamekr로 접근하거나, 더 안전하게 cNameKr도 시도합니다.
    if (initialData && (initialData.cnameKr || initialData.cnamekr)) { 
        
        console.log("ProfileTab: API 데이터 수신 및 상태 업데이트:", initialData);
        // console.log(profileData.marketing);
        // ⭐ 핵심: 로그에 표시된 실제 키를 사용합니다.
        // DTO 필드명 (cnameKr, cemail)이 소문자 시작으로 들어왔다면,
        // JSON 키는 'cnamekr', 'cemail' 형태로 들어올 가능성이 높습니다.
        
        // 옵셔널 체이닝과 OR 연산자를 사용하여 가장 확실한 키를 찾습니다.
        const nameKey = initialData.cnameKr; 
        const ennameKey = initialData.cnameEn; 
        const emailKey = initialData.email;
        const phoneKey = initialData.cphoneMobile;
        const birthKey = initialData.cbirthDt;
        const marketingKey = initialData.cagreeMarketing;
        const addressKey = initialData.caddress;
        const pinnumKey = initialData.cpinnumber;
        const logintyKey = initialData.loginType;
        const naveridKey = initialData.naverid;
        setProfileData({
            name: nameKey || '', 
            enname: ennameKey || '', 
            email: emailKey || '', 
            phone: phoneKey || '',
            
            // 날짜 형식 변환: T 뒤의 시간 부분 제거
            birthDate: birthKey ? birthKey.split('T')[0] : '', 
            gender: initialData?.cgenderCd || null ,
            address: addressKey || '', 
            occupation: '정보 없음', // DTO에 해당 필드가 없으므로 기본값 유지
            marketing: marketingKey,
            pinnum: pinnumKey,
            loginty: logintyKey,
            naverid: naveridKey,
        });
    } else {
        // 이 로그가 계속 찍히지 않는지 확인하세요. (API 호출이 두 번 성공해야 합니다.)
        console.log("ProfileTab: initialData가 비어있거나 아직 로딩 중입니다."); 
        
    }
  }, [initialData]);

  // 마케팅 토글 핸들러 함수
  const handleMarketingToggle = (event) => {
      // 체크박스 클릭 시의 checked 상태 (true/false)
      const isChecked = event.target.checked; 
      
      // checked 상태를 서버 DTO가 요구하는 'Y'/'N' 값으로 변환합니다.
      const newValue = isChecked ? 'Y' : 'N';
      
      // profileData 상태를 업데이트하여 profileData.marketing에 반영합니다.
      setProfileData(prevData => ({
          ...prevData,
          marketing: newValue 
      }));
      
      console.log(`[Toggle Event] 마케팅 동의 상태 변경됨: ${newValue}`);
  };

  const handleGenderChange = (event) => {
    const newGenderValue = event.target.value; // 'm' 또는 'f'
        
        // 1. UI를 제어하는 gender 상태 업데이트 (클릭 시 체크가 되도록 함)
      setGender(newGenderValue);
        
        // 2. ⭐ profileData 상태도 업데이트하여 최종 전송 데이터에 반영되도록 동기화
      setProfileData(prevData => ({
          ...prevData,
          gender: newGenderValue
      }));
  };

  // 약관 내용 Mock Data
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


        // 서버로 전송할 DTO 형식에 맞게 데이터를 매핑합니다.
        // 현재 ProfileData 키(name, email, phone)를 DTO 키(cnameKr, cemail, cphoneMobile)로 다시 변환해야 합니다.
        console.log("프론트 상태 (profileData.name):", profileData.name);

        const updatedDto = {
            ...initialData, 

            // 2. 수정된 필드만 덮어씁니다.
            //    (백엔드 DTO 필드명 cNameKr, cEmail 등과 일치시켜야 합니다.)
            cnameKr: profileData.name, 
            cnameEn: profileData.enname,
            email: profileData.email,
            cphoneMobile: profileData.phone,
            cBirthDt: profileData.birthDate,
            cGenderCd: profileData.gender,
            cagreeMarketing: profileData.marketing, 
            caddress: profileData.address,

            // 3. (옵션) 업데이트 시 갱신 정보를 추가합니다. (DB UpdatedAt, UpdatedBy 컬럼용)
            // cUpdatedAt: new Date().toISOString(),
            // cUpdatedBy: '현재 로그인 사용자 ID'
        };
        
        console.log("전송될 최종 DTO:", updatedDto);

        // 1. API 호출
        updateProfile(updatedDto)
            .then(res => {
                // 2. 서버 응답 성공 (예: 200 OK)
                console.log("프로필 업데이트 성공:", res.data);
                alert('프로필 정보가 성공적으로 저장되었습니다.');
                
                // 3. 편집 모드 종료
                setIsEditing(false);
                
                // 4. (선택 사항) 부모 컴포넌트(MyPage)의 상태도 갱신하도록 콜백 함수를 호출할 수 있습니다.
            })
            .catch(error => {
                // 5. API 호출 실패
                console.error("프로필 업데이트 실패:", error);
                alert('프로필 업데이트에 실패했습니다. 다시 시도해 주세요.');
                
                // 에러 발생 시 편집 모드를 유지할지 결정할 수 있습니다.
                // setIsEditing(false);
            });
    // return axios.put('../../api/accounts');
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <i className="ri-user-line text-purple-600"></i>
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
          {isEditing ? '저장' : '수정'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* 프로필 사진 섹션 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profileData.name[0]}
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <i className="ri-camera-line text-sm"></i>
                </button>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{profileData.name}</h3>
              {/* <p className="text-gray-600">프리미엄 회원</p> */}
              {profileData.naverid != null || profileData.loginty === 'NAVER' ? (<p className="text-gray-600">통합아이디 로그인 중</p>) : (profileData.loginty === 'NAVER' ? '네이버로그인 중' : '이음은행로그인 중')}
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="ri-star-fill text-sm"></i>
                  ))}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.name}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.email}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">영문이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.enname}
                  onChange={(e) => setProfileData({...profileData, enname: e.target.value})}
                  className="w-full h-40px px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              ) : (
                <div className="h-40px px-3 py-2 bg-gray-50 rounded-lg">{profileData.enname}</div>
              )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    성별
                </label>
                <div className="flex space-x-6">
                    {/* 남성 Radio 버튼 */}
                    <div className="flex items-center">
                        <input
                            id="gender-male"
                            name="gender"
                            type="radio"
                            value="M"
                            disabled={true}
                            checked={gender === 'M'}
                            onChange={handleGenderChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="gender-male" className="ml-3 block text-sm font-medium text-gray-700">
                            남성
                        </label>
                    </div>
                    
                    {/* 여성 Radio 버튼 */}
                    <div className="flex items-center">
                        <input
                            id="gender-female"
                            name="gender"
                            type="radio"
                            value="F"
                            disabled={true}
                            checked={gender === 'F'}
                            onChange={handleGenderChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="gender-female" className="ml-3 block text-sm font-medium text-gray-700">
                            여성
                        </label>
                    </div>
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.phone}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.birthDate}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{profileData.address}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">직업</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
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
                // onBlur 이벤트 추가: 팝업이 열려있을 때 팝업 외부를 클릭하면 닫히도록 설정
                tabIndex={-1} 
                onBlur={(e) => {
                    // relatedTarget이 null이거나, 관련 요소가 이 div의 자식이 아니라면 팝업 닫기
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsTermsPopupOpen(false);
                    }
                }}
            >
                <span className="text-sm text-gray-700" >
                    ※버튼을 활성화 하시면 마케팅 수신 <a className="text-sm text-gray-700 cursor-pointer pb-0.5 hover:text-blue-600 transition-colors"
                    role="button" // 접근성 향상을 위해 버튼 역할 지정
                    tabIndex="0" // 키보드 접근 가능하게 설정 (엔터키로도 클릭 가능)
                    onClick={() => setIsTermsPopupOpen(prev => !prev)}
                    onKeyDown={(e) => {
                        // Enter 또는 Spacebar 키를 눌러도 클릭 작동하도록 처리
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsTermsPopupOpen(prev => !prev);
                        }
                    }} style={{textDecoration: 'underline'}}>약관</a>에 동의한 것으로 간주됩니다.
                    <span className="text-blue-600 font-semibold border-b border-dashed border-blue-400 ml-1">
                        <br></br><small>(약관을 클릭하시면 내용을 보실수 있습니다.)</small>
                    </span>
                </span>

                {/* 약관 팝업 (Tooltip 형태) */}
                {isTermsPopupOpen && (
                    <div className="absolute right-0 bottom-full mb-4 w-full max-w-xs sm:max-w-md lg:max-w-lg
                                   mx-2 md:mx-0  z-10 bg-white border border-blue-200 rounded-xl shadow-2xl p-4 transition duration-300 ease-in-out transform origin-bottom-right">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-base font-semibold text-blue-600">
                                마케팅 수신 약관 (요약)
                            </div>
                            {/* 닫기 버튼 추가 */}
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
                        
                        {/* 약관 내용 (스크롤 가능) */}
                        <div className="text-xs text-gray-700 space-y-2 max-h-48 overflow-y-auto pr-2">
                            {mockTerms.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph.trim()}</p>
                            ))}
                        </div>
                        {/* 꼬리 (Tooltip Tail) */}
                        <div className="absolute right-3 -bottom-2 w-4 h-4 bg-white border-b border-r border-blue-200 transform rotate-45"></div>
                    </div>
                )}
            </div>
              <label className="relative inline-flex items-center cursor-pointer">
                {/* {profileData.marketing === 'Y' ? (<input type="checkbox" className="sr-only peer" defaultChecked />) : (<input type="checkbox" className="sr-only peer"  />)} */}
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    // 'Y'일 때 체크, 'N'일 때 미체크
                    checked={profileData.marketing === 'Y'} 
                    // 편집 모드일 때만 변경 가능하도록
                    disabled={!isEditing}
                    // 토글 시 profileData.marketing 상태 업데이트
                    onChange={handleMarketingToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="ri-mail-line text-green-600"></i>
                <span className="text-gray-700">이메일 알림</span>
              </div>
              {/* <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label> */}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="ri-phone-line text-orange-600"></i>
                <span className="text-gray-700">SMS 알림</span>
              </div>
              {/* <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SecurityTab Component
function SecurityTab() {
  const { checkPin, setCheckPin } = useCheckPin();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pinError, setPinError] = useState('');

// PIN 재설정 API 함수
    const handleResetPin = async () => {
        // 유효성 검사
        if (!newPin || !confirmPin) {
            setPinError('PIN을 입력해주세요.');
            return;
        }

        if (newPin.length !== 6) {
            setPinError('PIN은 6자리여야 합니다.');
            return;
        }

        if (newPin !== confirmPin) {
            setPinError('PIN이 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        setPinError('');

        try {
            const result = await resetPin(newPin);

            if (result.ok) {
                alert('PIN이 성공적으로 재설정되었습니다.');
                handleCloseModal();
            } else {
                setPinError(result.message || 'PIN 재설정에 실패했습니다.');
            }
        } catch (error) {
            setPinError(error.message || '서버 연결에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setShowOTPModal(false);
        setNewPin('');
        setConfirmPin('');
        setPinError('');
    };



  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <i className="ri-shield-check-line text-red-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">보안 설정</h2>
      </div>

      {/* 보안 상태 개요 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i className="ri-shield-check-fill text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">보안 등급: 우수</h3>
            <p className="text-gray-600">모든 보안 설정이 활성화되어 있습니다.</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP 설정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-smartphone-line text-blue-600 mr-2"></i>
            핀번호 변경
        </h3>
        <div className="flex items-center justify-between">
            {checkPin ? (
                <>
                    <div>
                        <p className="text-gray-600 mb-1">일회용 핀 인증이 활성화되어 있습니다.</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowOTPModal(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
                        >
                            재설정
                        </button>
                    </div>
                </>
            ) : (
                <div>
                <p className="text-gray-600 mb-1">일회용 핀 인증이 비활성화되어 있습니다.</p>
                </div>

            )}
        </div>
      </div>

      {/* 비밀번호 관리 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-lock-line text-orange-600 mr-2"></i>
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

      {/* 생체 인증 */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-fingerprint-line text-purple-600 mr-2"></i>
          생체 인증
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className="ri-fingerprint-2-line text-purple-600"></i>
              <div>
                <p className="font-medium text-gray-800">지문 인증</p>
                <p className="text-sm text-gray-600">등록된 지문: 2개</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className="ri-eye-line text-green-600"></i>
              <div>
                <p className="font-medium text-gray-800">Face ID</p>
                <p className="text-sm text-gray-600">얼굴 인식 로그인</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div> */}

      {/* 로그인 기록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-history-line text-indigo-600 mr-2"></i>
          최근 로그인 기록
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-computer-line text-green-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">웹 브라우저</p>
                <p className="text-xs text-gray-500">Chrome - Windows</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.20 14:30</p>
              <p className="text-xs text-green-600">현재 세션</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-smartphone-line text-blue-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">모바일 앱</p>
                <p className="text-xs text-gray-500">iOS App</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.20 09:15</p>
              <p className="text-xs text-gray-500">서울시 강남구</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="ri-computer-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">웹 브라우저</p>
                <p className="text-xs text-gray-500">Safari - macOS</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.19 22:45</p>
              <p className="text-xs text-gray-500">서울시 강남구</p>
            </div>
          </div>
        </div>
      </div>

        {/* PIN 재설정 모달 */}
        {showOTPModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">PIN 재설정</h3>
                    <p className="text-gray-600 mb-4">새로운 6자리 PIN을 설정해주세요.</p>

                    {/* PIN 입력 필드 */}
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                새 PIN
                            </label>
                            <input
                                type="password"
                                maxLength={6}
                                value={newPin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setNewPin(value);
                                    setPinError('');
                                }}
                                placeholder="6자리 숫자"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PIN 확인
                            </label>
                            <input
                                type="password"
                                maxLength={6}
                                value={confirmPin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setConfirmPin(value);
                                    setPinError('');
                                }}
                                placeholder="6자리 숫자"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* 에러 메시지 */}
                    {pinError && (
                        <p className="text-red-500 text-sm mb-4">{pinError}</p>
                    )}

                    {/* 버튼 */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCloseModal}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleResetPin}
                            disabled={!newPin || !confirmPin || isLoading}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '처리중...' : '확인'}
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

// LimitTab Component
function LimitTab() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState('');

  const limits = [
    {
      type: '일일 이체한도',
      current: '500만원',
      max: '1,000만원',
      icon: 'ri-exchange-line',
      color: 'blue'
    },
    {
      type: '월간 이체한도',
      current: '3,000만원',
      max: '5,000만원',
      icon: 'ri-calendar-line',
      color: 'green'
    },
    {
      type: '카드 결제한도',
      current: '300만원',
      max: '500만원',
      icon: 'ri-bank-card-line',
      color: 'purple'
    },
    {
      type: '해외송금 한도',
      current: '$5,000',
      max: '$10,000',
      icon: 'ri-global-line',
      color: 'orange'
    }
  ];

  const handleEditLimit = (limitType) => {
    setSelectedLimit(limitType);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <i className="ri-wallet-line text-green-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">한도 관리</h2>
      </div>

      {/* 한도 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {limits.map((limit, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-${limit.color}-100 rounded-lg flex items-center justify-center`}>
                  <i className={`${limit.icon} text-${limit.color}-600`}></i>
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
                  <div className={`h-2 bg-${limit.color}-500 rounded-full`} style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 한도 변경 내역 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-history-line text-indigo-600 mr-2"></i>
          최근 한도 변경 내역
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-exchange-line text-blue-600 text-sm"></i>
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
          
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="ri-bank-card-line text-purple-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">카드 결제한도 변경</p>
                <p className="text-xs text-gray-500">200만원 → 300만원</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.10</p>
              <p className="text-xs text-green-600">승인완료</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="ri-global-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">해외송금 한도 신청</p>
                <p className="text-xs text-gray-500">$3,000 → $5,000</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-800">2024.01.05</p>
              <p className="text-xs text-orange-600">심사중</p>
            </div>
          </div>
        </div>
      </div>

      {/* 한도 관리 안내 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-information-line text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">한도 관리 안내</h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• 한도 증액 신청 시 심사가 진행되며, 영업일 기준 2-3일 소요됩니다.</li>
              <li>• 해외송금 한도는 별도의 서류 제출이 필요할 수 있습니다.</li>
              <li>• 한도 감액은 즉시 적용되며, 증액은 승인 후 적용됩니다.</li>
              <li>• 보안 등급이 높을수록 더 높은 한도 설정이 가능합니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 한도 수정 모달 */}
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
                ></textarea>
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

// DocumentTab Component
function DocumentTab() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  const documents = [
    {
      type: '신분증',
      name: '주민등록증_조원빈.pdf',
      uploadDate: '2024.01.15',
      status: '승인완료',
      icon: 'ri-id-card-line',
      color: 'green'
    },
    {
      type: '소득증명서',
      name: '근로소득원천징수영수증_2023.pdf',
      uploadDate: '2024.01.10',
      status: '승인완료',
      icon: 'ri-file-text-line',
      color: 'blue'
    },
    {
      type: '재직증명서',
      name: '재직증명서_테크컴퍼니.pdf',
      uploadDate: '2024.01.08',
      status: '심사중',
      icon: 'ri-building-line',
      color: 'orange'
    },
    {
      type: '통장사본',
      name: '통장사본_하나은행.pdf',
      uploadDate: '2024.01.05',
      status: '승인완료',
      icon: 'ri-bank-line',
      color: 'purple'
    }
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
          <i className="ri-file-text-line text-indigo-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">증빙 서류</h2>
      </div>

      {/* 서류 제출 현황 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-green-600 text-xl"></i>
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

      {/* 제출된 서류 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="ri-folder-line text-blue-600 mr-2"></i>
            제출된 서류
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {documents.map((doc, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 bg-${doc.color}-100 rounded-lg flex items-center justify-center`}>
                    <i className={`${doc.icon} text-${doc.color}-600`}></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{doc.type}</h4>
                    <p className="text-sm text-gray-600">{doc.name}</p>
                    <p className="text-xs text-gray-500">업로드: {doc.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === '승인완료'
                      ? 'bg-green-100 text-green-800'
                      : doc.status === '심사중'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doc.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    <i className="ri-download-line"></i>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 서류 제출 체크리스트 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-task-line text-purple-600 mr-2"></i>
          서류 제출 체크리스트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocs.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  doc.submitted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <i className={doc.submitted ? 'ri-check-line' : 'ri-time-line'} style={{ fontSize: '12px' }}></i>
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

      {/* 서류 업로드 안내 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-information-line text-amber-600 text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">서류 업로드 안내</h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• 파일 형식: PDF, JPG, PNG (파일 크기 10MB 이하)</li>
              <li>• 글씨가 선명하고 네 모서리가 모두 보이도록 촬영해주세요</li>
              <li>• 신분증의 경우 주민등록번호 뒷자리는 가려주세요</li>
              <li>• 서류 심사는 영업일 기준 1-2일 소요됩니다</li>
              <li>• 서류에 문제가 있을 경우 재제출을 요청드릴 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedDocType} 업로드</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-2"></i>
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

// TaxTab Component
function TaxTab() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [showCalculator, setShowCalculator] = useState(false);

  const taxData = [
    {
      type: '소득세',
      amount: '1,250,000',
      status: '납부완료',
      dueDate: '2024.05.31',
      icon: 'ri-money-dollar-circle-line',
      color: 'green'
    },
    {
      type: '지방소득세',
      amount: '125,000',
      status: '납부완료',
      dueDate: '2024.05.31',
      icon: 'ri-building-line',
      color: 'blue'
    },
    {
      type: '주민세',
      amount: '100,000',
      status: '납부예정',
      dueDate: '2024.08.31',
      icon: 'ri-home-line',
      color: 'orange'
    },
    {
      type: '재산세',
      amount: '450,000',
      status: '납부완료',
      dueDate: '2024.07.16',
      icon: 'ri-building-2-line',
      color: 'purple'
    }
  ];

  const publicBills = [
    {
      type: '전기요금',
      amount: '85,400',
      month: '2024년 1월',
      status: '납부완료',
      icon: 'ri-flashlight-line',
      color: 'yellow'
    },
    {
      type: '가스요금',
      amount: '127,500',
      month: '2024년 1월',
      status: '납부완료',
      icon: 'ri-fire-line',
      color: 'red'
    },
    {
      type: '수도요금',
      amount: '42,300',
      month: '2024년 1월',
      status: '납부완료',
      icon: 'ri-drop-line',
      color: 'blue'
    },
    {
      type: '통신요금',
      amount: '89,000',
      month: '2024년 1월',
      status: '미납부',
      icon: 'ri-smartphone-line',
      color: 'purple'
    }
  ];

  const deductions = [
    { category: '건강보험료', amount: '180,000', rate: '15%' },
    { category: '국민연금', amount: '540,000', rate: '30%' },
    { category: '신용카드', amount: '1,200,000', rate: '10%' },
    { category: '교육비', amount: '450,000', rate: '20%' },
    { category: '의료비', amount: '320,000', rate: '18%' },
    { category: '기부금', amount: '200,000', rate: '12%' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="ri-calculator-line text-orange-600"></i>
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

      {/* 연간 세금 요약 */}
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
            <i className="ri-tax-line text-green-600 mr-2"></i>
            세금 납부 현황
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {taxData.map((tax, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 bg-${tax.color}-100 rounded-lg flex items-center justify-center`}>
                    <i className={`${tax.icon} text-${tax.color}-600`}></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{tax.type}</h4>
                    <p className="text-sm text-gray-600">납부기한: {tax.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">₩{tax.amount}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tax.status === '납부완료'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {tax.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 공과금 납부 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="ri-bill-line text-blue-600 mr-2"></i>
            공과금 납부 현황
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {publicBills.map((bill, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-${bill.color}-100 rounded-lg flex items-center justify-center`}>
                    <i className={`${bill.icon} text-${bill.color}-600 text-sm`}></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{bill.type}</h4>
                    <p className="text-xs text-gray-500">{bill.month}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">₩{bill.amount}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bill.status === '납부완료'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 소득공제 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="ri-discount-percent-line text-purple-600 mr-2"></i>
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
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: deduction.rate }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 세금 계산기 모달 */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">간단 세금 계산기</h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
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

// Sidebar Component
function Sidebar({ customerName, customerPhone }) {
  console.log()
  return (
    <aside className="w-80 bg-gray-50 border-l border-gray-200 p-6">
      <div className="space-y-6">
        {/* 회원 확인 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-user-line text-gray-600 mr-2"></i>
            My
          </h3>
          <div className="space-y-2">
            <div className="text-right">
                <div className="text-sm opacity-90">안녕하세요</div>
                <div className="font-semibold">{customerName} 님</div>
            </div>
          </div>
        </div>
        {/* 요약 섹션 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-pie-chart-line text-blue-600 mr-2"></i>
            요약
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">이체한도</span>
              <span className="text-sm font-medium">1,000만원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">핀번호 등록</span>
              {customerPhone !== null ? (<span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">완료</span>) : (<span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">미등록</span>)}
              {/* <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">완료</span> */}
            </div>
          </div>
        </div>

        {/* 보안 주의 섹션 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-shield-check-line text-orange-600 mr-2"></i>
            보안 주의
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">핀번호/비밀번호 관리</div>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              정기적인 비밀번호 변경을 권장합니다
            </div>
          </div>
        </div>

        {/* 문의/도움말 섹션 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className="ri-customer-service-line text-teal-600 mr-2"></i>
            문의/도움말
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <i className="ri-mail-line text-gray-400"></i>
              <div>
                <div className="text-xs text-gray-500">이메일</div>
                <div className="text-sm">support@E-UMbank.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <i className="ri-phone-line text-gray-400"></i>
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
            <i className="ri-time-line text-purple-600 mr-2"></i>
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

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Pacifico, serif" }}>NeoBank</h3>
            <p className="text-gray-300 text-sm">
              안전하고 편리한 디지털 뱅킹 서비스로 여러분의 금융 생활을 지원합니다.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">계좌 개설</a></li>
              <li><a href="#" className="hover:text-white transition-colors">카드 신청</a></li>
              <li><a href="#" className="hover:text-white transition-colors">대출 상담</a></li>
              <li><a href="#" className="hover:text-white transition-colors">투자 상품</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">고객지원</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">고객센터</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">연락처</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <i className="ri-phone-line"></i>
                <span>1588-1234</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="ri-mail-line"></i>
                <span>support@neobank.com</span>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-gray-700 my-6" />
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div>
            © 2024 NeoBank. All rights reserved. | 사업자등록번호: 123-45-67890
          </div>
          <div className="mt-4 md:mt-0">
            <a href="https://readdy.ai/?origin=logo" className="hover:text-white transition-colors">
              Powered by Readdy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MyPage() {

  const [customerProfile, setCustomerProfile] = useState({});
  const [customerName, setCustomerName] = useState('이름없음');
  const [customerPhone, setCustomerPhone] = useState('로딩 중...');
  const [activeTab, setActiveTab] = useState('overview');

  // ★ 범용 탭 전환 함수 정의
  const goToTab = (tabName) => {
      setActiveTab(tabName);
  };
  // const renderTabContent = () => {
  //   switch (activeTab) {
  //     case 'overview':
  //       return <OverviewTab />;
  //     case 'profile':
  //       return <ProfileTab />;
  //     case 'security':
  //       return <SecurityTab />;
  //     case 'limit':
  //       return <LimitTab />;
  //     case 'document':
  //       return <DocumentTab />;
  //     case 'tax':
  //       return <TaxTab />;
  //     default:
  //       return <OverviewTab />;
  //   }
  // };
  // 2. API 호출 및 상태 업데이트
  useEffect(() => {
    testmypage()
        .then(res => {
            const customerData = res.data; 
            
            setCustomerProfile(customerData); // DTO 객체 전체를 customerProfile 상태에 저장

            // ⭐ 1. DTO 필드명과 일치하는 cNameKr이 있으면 사용 (우선순위 1)
            // ⭐ 2. 없으면 Lower CamelCase인 cnameKr 사용 (우선순위 2)
            const fetchedName = customerData?.cnameKr;
            
            if (fetchedName) {
                setCustomerName(fetchedName); 
            } else {
                console.error("DTO에서 cnameKr 필드를 찾을 수 없거나 값이 비어있습니다.");
                setCustomerName('데이터 오류'); 
            }

            const fetchedPhone = customerData?.cpinnumber; 
            if (fetchedPhone) {
                setCustomerPhone(fetchedPhone); 
                console.log(customerData.cpinnumber);
            } else {
                console.warn("DTO에서 cTelNo 필드를 찾을 수 없거나 값이 비어있습니다.");
                // 값이 없으면 빈 문자열 또는 대시로 설정
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
            case 'profile':
                // 3. ProfileTab에 customerProfile 데이터를 props로 전달
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
                return <OverviewTab />;
        }
    };
  

  return (
      <CheckPinProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
          {/* <Header /> */}
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
          {/* <Footer /> */}
        </div>
      </CheckPinProvider>
  );
}

export default MyPage;