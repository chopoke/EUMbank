import { useState } from "react";
import PersonalInfoStep from "./PersonalInfoStep";
import CompletionStep from "./CompletionStep";
import api from "../../api/axios";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const totalSteps = 2; // 1: 폼, 2: 완료

  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const handleNext = async () => {
    if (currentStep === 1) {
      if (
        !formData.name ||
        !formData.phone ||
        !formData.email ||
        !formData.username ||
        !formData.password
      ) {
        alert("필수 항목을 입력하세요.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      const payload = {
        c_user_id: formData.username,
        c_password: formData.password,
        c_name_kr: formData.name,
        c_email: formData.email,
        c_phone_mobile: formData.phone,
      };

      try {
        await api.post("/api/auth/signup", payload);
        setCurrentStep(2);
      } catch (ex) {
        console.log("signup error:", ex?.response?.status, ex?.response?.data);
        const d = ex?.response?.data;
        const msg =
          d?.errors?.join("\n") ||
          d?.detail ||
          d?.message ||
          ex?.message ||
          "회원가입 실패. 입력값을 확인하세요.";
        alert(msg);
      }
      return;
    }

    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: "Pacifico, serif" }}
          >
            logo
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-2 sm:mb-4">회원가입</h2>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            안전하고 신뢰할 수 있는 금융 서비스를 위해 정확한 정보를 입력해주세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max px-4 sm:px-0">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                <div className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                  {step === 1 && "개인정보"}
                  {step === 2 && "가입완료"}
                </div>
                {step < 2 && (
                  <div
                    className={`w-12 sm:w-20 h-1 ml-2 sm:ml-4 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            {renderStep()}

            {currentStep < 2 && (
              <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  이전 단계
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                >
                  {currentStep === 2 ? "가입 완료" : "다음 단계"}
                </button>
              </div>
            )}
          </div>

          {currentStep === 1 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
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
