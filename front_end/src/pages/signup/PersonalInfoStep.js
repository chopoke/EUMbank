import { useState } from 'react';

export default function PersonalInfoStep({ formData, updateFormData }) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleTermsChange = (field, checked) => {
    updateFormData({
      terms: {
        ...formData.terms,
        [field]: checked
      }
    });
  };

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">개인정보 입력</h3>
      
      <div className="space-y-4 sm:space-y-6">
        {/* 개인정보 입력 폼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="홍길동"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              생년월일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="010-1234-5678"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="example@email.com"
              required
            />
          </div>
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="서울특별시 강남구 테헤란로 123"
              required
            />
            <input
              type="text"
              value={formData.detailAddress}
              onChange={(e) => handleInputChange('detailAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="상세주소 (선택사항)"
            />
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-base font-medium text-gray-800 mb-4">계정 정보</h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="영문, 숫자 조합 6~20자"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="영문, 숫자, 특수문자 조합 8자 이상"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
            </div>
          </div>
        </div>

        {/* 약관 동의 */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-base font-medium text-gray-800 mb-4">약관 동의</h4>
          
          <div className="space-y-3">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms.service}
                onChange={(e) => handleTermsChange('service', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                required
              />
              <div className="ml-3">
                <span className="text-sm text-gray-700">
                  서비스 이용약관에 동의합니다 <span className="text-red-500">(필수)</span>
                </span>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">금융서비스 이용을 위한 필수 약관입니다.</span>
                  <button 
                    type="button" 
                    className="ml-2 text-blue-600 text-sm hover:underline cursor-pointer"
                    onClick={() => setShowServiceModal(true)}
                  >
                    전문보기
                  </button>
                </div>
              </div>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms.privacy}
                onChange={(e) => handleTermsChange('privacy', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                required
              />
              <div className="ml-3">
                <span className="text-sm text-gray-700">
                  개인정보 처리방침에 동의합니다 <span className="text-red-500">(필수)</span>
                </span>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">개인정보 수집 및 이용에 대한 동의입니다.</span>
                  <button 
                    type="button" 
                    className="ml-2 text-blue-600 text-sm hover:underline cursor-pointer"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    전문보기
                  </button>
                </div>
              </div>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms.marketing}
                onChange={(e) => handleTermsChange('marketing', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
              />
              <div className="ml-3">
                <span className="text-sm text-gray-700">
                  마케팅 정보 수신에 동의합니다 <span className="text-gray-400">(선택)</span>
                </span>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">상품 안내 및 혜택 정보를 받아보실 수 있습니다.</span>
                  <button 
                    type="button" 
                    className="ml-2 text-blue-600 text-sm hover:underline cursor-pointer"
                    onClick={() => setShowMarketingModal(true)}
                  >
                    전문보기
                  </button>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 서비스 이용약관 모달 */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">서비스 이용약관</h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-close-line text-xl"></i>
                </div>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-semibold text-gray-800 mb-3">제1조 (목적)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  이 약관은 TestBank(이하 "회사")가 제공하는 금융서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제2조 (정의)</h4>
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• "서비스"라 함은 회사가 제공하는 모든 금융서비스를 의미합니다.</li>
                  <li>• "이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
                  <li>• "회원"이라 함은 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제3조 (약관의 효력 및 변경)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제4조 (서비스의 제공 및 변경)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  회사는 다음과 같은 업무를 수행합니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 예금, 적금, 대출 등 각종 금융상품 제공</li>
                  <li>• 계좌이체, 송금 등 결제서비스 제공</li>
                  <li>• 금융정보 제공 및 상담서비스</li>
                  <li>• 기타 회사가 정하는 업무</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제5조 (회원가입)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  서비스 이용을 위해서는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제6조 (회원의 의무)</h4>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 회원은 관계법령, 이 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 합니다.</li>
                  <li>• 회원은 회사의 사전 승낙 없이는 서비스를 이용하여 영업활동을 할 수 없습니다.</li>
                  <li>• 회원은 서비스의 이용권한, 기타 이용계약상의 지위를 타인에게 양도, 증여할 수 없습니다.</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제7조 (개인정보보호)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  회사는 관계법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제8조 (회사의 의무)</h4>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하기 위해서 노력합니다.</li>
                  <li>• 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안 시스템을 구축합니다.</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제9조 (서비스 이용제한)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  회사는 회원이 다음 각 호에 해당하는 행위를 하였을 경우 사전통지 없이 서비스 이용을 제한하거나 회원자격을 정지 또는 상실시킬 수 있습니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 가입 신청 시에 허위 내용을 등록한 경우</li>
                  <li>• 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우</li>
                  <li>• 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                </ul>

                <p className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                  본 서비스 이용약관은 2024년 1월 1일부터 적용됩니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">개인정보 처리방침</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-close-line text-xl"></i>
                </div>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-semibold text-gray-800 mb-3">제1조 (개인정보의 처리목적)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 금융서비스 제공 및 계약의 체결·이행</li>
                  <li>• 본인 확인 및 신원 인증</li>
                  <li>• 금융거래 정보의 제공 및 관리</li>
                  <li>• 법령상 의무 이행</li>
                  <li>• 고객 상담 및 불만 처리</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제2조 (개인정보의 처리 및 보유기간)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 계약 또는 청약철회 등에 관한 기록: 5년</li>
                  <li>• 대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                  <li>• 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                  <li>• 신용정보의 수집·처리 및 이용 등에 관한 기록: 3년</li>
                  <li>• 본인확인에 관한 기록: 6개월</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제3조 (개인정보의 제3자 제공)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제4조 (개인정보처리의 위탁)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg mb-6">
                  <p className="text-sm text-gray-700 font-medium mb-2">위탁업체: 전산시스템 운영 전문업체</p>
                  <p className="text-sm text-gray-600">위탁업무: 전산시스템 운영 및 유지보수</p>
                </div>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제5조 (정보주체의 권리·의무 및 행사방법)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  정보주체는 개인정보 처리자에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 개인정보 처리현황 통지 요구</li>
                  <li>• 개인정보 열람 요구</li>
                  <li>• 개인정보 정정·삭제 요구</li>
                  <li>• 개인정보 처리정지 요구</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제6조 (개인정보의 파기)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제7조 (개인정보의 안전성 확보조치)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  본 금융기관은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                  <li>• 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치</li>
                  <li>• 물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">제8조 (개인정보보호책임자)</h4>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700 mb-2"><strong>개인정보보호책임자</strong></p>
                  <p className="text-sm text-gray-600 mb-1">성명: 김보안</p>
                  <p className="text-sm text-gray-600 mb-1">직책: 정보보호팀장</p>
                  <p className="text-sm text-gray-600 mb-1">연락처: 02-1234-5678</p>
                  <p className="text-sm text-gray-600">이메일: privacy@example.com</p>
                </div>

                <p className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                  본 개인정보처리방침은 2024년 1월 1일부터 적용됩니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마케팅 정보 수신 동의 모달 */}
      {showMarketingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">마케팅 정보 수신 동의</h3>
              <button
                onClick={() => setShowMarketingModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-close-line text-xl"></i>
                </div>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-semibold text-gray-800 mb-3">마케팅 정보 수신 동의 안내</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  TestBank는 고객님께 더 나은 금융서비스와 혜택을 제공하기 위해 마케팅 정보를 발송하고자 합니다. 본 동의는 선택사항이며, 동의하지 않으셔도 기본적인 금융서비스 이용에는 제한이 없습니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">수집·이용 목적</h4>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 신상품 및 서비스 안내</li>
                  <li>• 이벤트 및 프로모션 정보 제공</li>
                  <li>• 금리 우대 혜택 및 특별 상품 안내</li>
                  <li>• 맞춤형 금융상품 추천</li>
                  <li>• 고객 만족도 조사 및 설문</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">수집·이용 항목</h4>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 성명, 연락처(휴대폰번호, 이메일주소)</li>
                  <li>• 생년월일, 성별</li>
                  <li>• 거래정보(상품 가입현황, 거래패턴 등)</li>
                  <li>• 관심 분야 및 선호도 정보</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">보유·이용 기간</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  동의일로부터 회원 탈퇴 시 또는 마케팅 수신 동의 철회 시까지 보유·이용합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
                </p>

                <h4 className="text-base font-semibold text-gray-800 mb-3">발송 방법</h4>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• SMS/MMS</li>
                  <li>• 이메일(E-mail)</li>
                  <li>• 앱 푸시 알림</li>
                  <li>• 우편물(DM)</li>
                  <li>• 전화(텔레마케팅)</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-3">동의 철회 방법</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  마케팅 정보 수신에 대한 동의는 언제든지 철회하실 수 있습니다.
                </p>
                <ul className="text-sm text-gray-700 mb-6 space-y-2 pl-4">
                  <li>• 고객센터 전화: 1588-0000</li>
                  <li>• 인터넷뱅킹/모바일뱅킹 &gt; 환경설정 &gt; 마케팅 수신설정</li>
                  <li>• 영업점 방문</li>
                  <li>• 수신 거부 문자 발송: "수신거부"를 1588-0000으로 발송</li>
                </ul>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">혜택 안내</h4>
                  <p className="text-sm text-gray-700 mb-2">마케팅 정보 수신 동의 시 다음과 같은 혜택을 받으실 수 있습니다:</p>
                  <ul className="text-sm text-gray-600 space-y-1 pl-4">
                    <li>• 신규 상품 출시 시 우선 안내</li>
                    <li>• 특별 금리 혜택 및 수수료 면제 이벤트</li>
                    <li>• 생일 축하 이벤트 및 기념일 혜택</li>
                    <li>• VIP 고객 전용 서비스 안내</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                  본 마케팅 정보 수신 동의서는 2024년 1월 1일부터 적용됩니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowMarketingModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
