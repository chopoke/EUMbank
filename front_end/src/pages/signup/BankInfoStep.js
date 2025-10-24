// 파일명은 그대로 BankInfoStep.jsx 를 쓰지만, 내용은 '약관동의'로 교체
export default function BankInfoStep({ formData, updateFormData }) {
  const setTerms = (field, checked) =>
    updateFormData({ terms: { ...formData.terms, [field]: checked } });

  const toggleAll = (checked) =>
    updateFormData({
      terms: {
        service: checked,
        privacy: checked,
        marketing: checked,
      },
    });

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">약관 동의</h3>

      <div className="space-y-3">
        {/* 전체 동의 */}
        <label className="flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={formData.terms.service && formData.terms.privacy && formData.terms.marketing}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <span className="ml-3 text-sm font-medium text-blue-800">전체 동의</span>
        </label>

        {/* 필수 약관 */}
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.terms.service}
            onChange={(e) => setTerms('service', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
          />
          <div className="ml-3">
            <span className="text-sm text-gray-700">
              서비스 이용약관에 동의합니다 <span className="text-red-500">(필수)</span>
            </span>
            <div className="text-xs text-gray-500 mt-1">금융서비스 이용을 위한 필수 약관입니다.</div>
          </div>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.terms.privacy}
            onChange={(e) => setTerms('privacy', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
          />
          <div className="ml-3">
            <span className="text-sm text-gray-700">
              개인정보 처리방침에 동의합니다 <span className="text-red-500">(필수)</span>
            </span>
            <div className="text-xs text-gray-500 mt-1">개인정보 수집 및 이용에 대한 동의입니다.</div>
          </div>
        </label>

        {/* 선택 동의 */}
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.terms.marketing}
            onChange={(e) => setTerms('marketing', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
          />
          <div className="ml-3">
            <span className="text-sm text-gray-700">
              마케팅 정보 수신에 동의합니다 <span className="text-gray-400">(선택)</span>
            </span>
            <div className="text-xs text-gray-500 mt-1">상품 안내 및 혜택 정보를 받아보실 수 있습니다.</div>
          </div>
        </label>
      </div>
    </div>
  );
}
