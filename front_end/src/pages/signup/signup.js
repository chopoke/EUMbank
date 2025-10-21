import { useState } from "react";
import PersonalInfoStep from "./PersonalInfoStep";
import TermsStep from "./TermsStep";      // ← KYR 구조 유지 (2단계 = 약관동의)
import CompletionStep from "./CompletionStep";
import { validEmail, validPassword, validPhone, validUsername } from './validators';
import maintxt from '../../resources/img/e-um.png'

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // 개인정보
    name: "",
    phone: "",
    birth: "",
    email: "",
    emailVerified: false,       //  이메일 인증 여부
    emailCode: "",          // 인증코드 6자리

    // 계정정보
    username: "",
    password: "",
    confirmPassword: "",

    // 약관동의
    terms: {
      agreeTerms: false,       // 서비스 이용약관 (필수)
      agreePrivacy: false,     // 개인정보처리방침 (필수)
      agreeMarketing: false,   // 마케팅 수신동의 (선택)
      hasReadTerms: false,     // KYR 쪽에서 원문 끝까지 읽음 체크가 있다면 사용
      hasReadPrivacy: false,
    },
  });

  const totalSteps = 3; // 1: 개인정보, 2: 약관동의, 3: 완료
  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const handleNext = async () => {
    const f = formData;

    // 1단계: 개인정보/계정 + 이메일 인증 검증
    if (currentStep === 1) {
      if (!f.name.trim()) return alert("이름을 입력하세요.");
      if (!validPhone(f.phone)) return alert("휴대폰 번호를 정확히 입력하세요. 예) 010-1234-5678");
      if (!f.birth) return alert("생년월일을 입력하세요.");
      if (!validEmail(f.email)) return alert("이메일을 정확히 입력하세요.");
      if (!f.emailVerified) return alert("이메일 인증을 완료해 주세요.");
      if (!validUsername(f.username)) return alert("아이디는 영문+숫자 조합 6~20자여야 합니다.");
      if (!validPassword(f.password)) return alert("비밀번호는 8~32자, 영문/숫자/특수문자 중 2가지 이상 포함하세요.");
      if (f.password !== f.confirmPassword) return alert("비밀번호 확인이 일치하지 않습니다.");
    }

    // 2단계: 약관 필수 확인(KYR 스타일)
    if (currentStep === 2) {
      const { agreeTerms, agreePrivacy, hasReadTerms, hasReadPrivacy } = f.terms || {};
      if (hasReadTerms === false || hasReadPrivacy === false) {
        return alert("필수 약관 원문을 끝까지 읽어주세요.");
      }
      if (!agreeTerms || !agreePrivacy) {
        return alert("필수 약관에 동의해야 회원가입이 가능합니다.");
      }
      // 실제 회원가입 API 호출이 필요하면 여기서 처리 (KYR 코드가 api.post 쓰면 그대로 사용)
      // try { await api.post('/api/auth/signup', payload) ... } catch (e) { ... }
      // 최종 회원가입 API 호출
      const baseUrl = "";
      try {
       const res = await fetch(`${baseUrl}/api/auth/signup`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           c_user_id: f.username,
           c_password: f.password,
           c_name_kr: f.name,
           c_email: f.email,
           c_phone_mobile: f.phone,
           emailCode: f.emailCode,                 // 6자리 코드
           c_birth_dt: f.birth,
           c_agree_terms: agreeTerms ? "Y" : "N",
           c_agree_privacy: agreePrivacy ? "Y" : "N",
           c_agree_marketing: (f.terms?.agreeMarketing ? "Y" : "N"),
           c_login_type: "EUM",
         }),
       });

       if (!res.ok) {
         if (res.status === 409) return alert("이미 가입된 이메일입니다.");
         const msg = await res.text().catch(()=> "");
         return alert("가입 실패: " + (msg || `HTTP ${res.status}`));
       }
       alert("회원가입이 완료되었습니다.");
     } catch (e) {
       console.error(e);
       return alert("가입 실패: " + (e.message ?? "알 수 없는 오류"));
     }
    }

    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return (
          <TermsStep
            terms={formData.terms}
            updateFormData={(termsPatch) =>
              updateFormData({ terms: { ...formData.terms, ...termsPatch } })
            }
          />
        );
      case 3:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="text-center mb-5">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-800"
            style={{ fontFamily: "Pacifico, serif" }}
          >
            <img src={maintxt} className="mx-auto block w-38 h-auto" />
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-blue-600 mt-1">회원가입</h2>
          <p className="text-sm text-gray-600 mt-1">
            안전하고 신뢰할 수 있는 금융 서비스를 위해 정확한 정보를 입력해주세요
          </p>
        </div>

        {/* 진행 단계 */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step, idx) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700">
                  {step === 1 && '개인정보'}
                  {step === 2 && '약관동의'}
                  {step === 3 && '가입완료'}
                </div>
                {idx < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-3 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8">
            {renderStep()}

            {/* 네비 버튼 */}
            {currentStep < 3 && (
              <div className="flex flex-col sm:flex-row justify-between mt-6 pt-4 border-t border-gray-200 gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium ${
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
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium ${
                    currentStep === 1 && !formData.emailVerified
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={currentStep === 1 && !formData.emailVerified}
                >
                  {currentStep === 2 ? '가입 완료' : '다음 단계'}
                </button>
              </div>
            )}
          </div>

          {/* 로그인 링크 */}
          {currentStep === 1 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <a href="/login" className="text-blue-600 hover:underline">
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
