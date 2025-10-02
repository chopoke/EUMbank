export default function BankInfoStep({ formData, updateFormData }) {
  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const purposes = [
    { value: 'salary', label: '급여수령용' },
    { value: 'saving', label: '저축용' },
    { value: 'investment', label: '투자용' },
    { value: 'business', label: '사업용' },
    { value: 'other', label: '기타' }
  ];

  const incomeRanges = [
    { value: '1000', label: '100만원 미만' },
    { value: '2000', label: '100만원 ~ 200만원' },
    { value: '3000', label: '200만원 ~ 300만원' },
    { value: '4000', label: '300만원 ~ 400만원' },
    { value: '5000', label: '400만원 ~ 500만원' },
    { value: '5000+', label: '500만원 이상' }
  ];

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">은행 서비스 이용 정보</h3>
      
      <div className="space-y-4">
        {/* 계좌 개설 목적 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            계좌 개설 목적 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.accountPurpose}
              onChange={(e) => handleInputChange('accountPurpose', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
              required
            >
              <option value="">목적을 선택해주세요</option>
              {purposes.map((purpose) => (
                <option key={purpose.value} value={purpose.value}>
                  {purpose.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* 직업 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              직업 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="예: 회사원, 자영업자, 학생"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              회사명/학교명
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="회사명 또는 학교명을 입력하세요"
            />
          </div>
        </div>

        {/* 월 소득 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            월 소득 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.monthlyIncome}
              onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
              required
            >
              <option value="">소득 범위를 선택해주세요</option>
              {incomeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* 금융 서비스 이용 경험 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            금융 서비스 이용 경험
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="banking-experience"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="banking-experience" className="ml-2 text-sm text-gray-700 cursor-pointer">
                인터넷뱅킹 이용 경험이 있습니다
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="investment-experience"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="investment-experience" className="ml-2 text-sm text-gray-700 cursor-pointer">
                투자 상품 이용 경험이 있습니다
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="loan-experience"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="loan-experience" className="ml-2 text-sm text-gray-700 cursor-pointer">
                대출 상품 이용 경험이 있습니다
              </label>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추가 정보 (선택사항)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            rows={3}
            placeholder="은행 서비스 이용과 관련하여 추가로 알려주고 싶은 사항이 있다면 입력해주세요"
          />
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-blue-600"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800 mb-1">정보 제공 안내</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                제공해주신 정보는 금융 서비스 제공 및 상품 추천을 위해 사용되며, 
                관련 법령에 따라 안전하게 보호됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
