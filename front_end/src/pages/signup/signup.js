import { useState } from 'react';
import PersonalInfoStep from './PersonalInfoStep';
import BankInfoStep from './BankInfoStep';
import IdentityVerificationStep from './IdentityVerificationStep';
import CompletionStep from './CompletionStep';

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // 개인정보
    name: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    detailAddress: '',
    
    // 계정정보
    username: '',
    password: '',
    confirmPassword: '',
    
    // 은행정보
    accountPurpose: '',
    jobTitle: '',
    companyName: '',
    monthlyIncome: '',
    
    // 신분증 확인
    idCardFront: null,
    idCardBack: null,
    
    // 약관동의
    terms: {
      service: false,
      privacy: false,
      marketing: false,
    }
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <BankInfoStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <IdentityVerificationStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Pacifico, serif" }}>
            logo
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-2 sm:mb-4">회원가입</h2>
          <p className="text-sm sm:text-base text-gray-600 px-4">안전하고 신뢰할 수 있는 금융 서비스를 위해 정확한 정보를 입력해주세요</p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max px-4 sm:px-0">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                <div className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                  {step === 1 && '개인정보'}
                  {step === 2 && '은행정보'}
                  {step === 3 && '신분증 확인'}
                  {step === 4 && '가입완료'}
                </div>
                {step < 4 && (
                  <div className={`w-12 sm:w-20 h-1 ml-2 sm:ml-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 단계별 컨텐츠 */}
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            {renderStep()}
            
            {/* 네비게이션 버튼 */}
            {currentStep < 4 && (
              <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  이전 단계
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                >
                  {currentStep === 3 ? '가입 완료' : '다음 단계'}
                </button>
              </div>
            )}

            {/* 소셜 가입 - 첫 번째 단계에서만 표시 */}
            {currentStep === 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">또는 간편하게 가입하세요</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-kakao-talk-fill text-xl text-yellow-500 mr-2"></i>
                    <span className="text-sm font-medium text-gray-700">카카오 가입</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-google-fill text-xl text-red-500 mr-2"></i>
                    <span className="text-sm font-medium text-gray-700">구글 가입</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-apple-fill text-xl text-gray-800 mr-2"></i>
                    <span className="text-sm font-medium text-gray-700">애플 가입</span>
                  </button>
                </div>
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    소셜 가입 시에도 본인 확인 절차가 필요합니다
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 로그인 페이지 링크 - 첫 번째 단계에서만 표시 */}
          {currentStep === 1 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <a href="/login" className="text-blue-600 hover:underline cursor-pointer">
                  로그인하기
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
