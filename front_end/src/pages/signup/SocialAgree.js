import { useState } from "react";
import TermsStep from "./TermsStep";            // New
import api from "../../api/axios";
import maintxt from '../../resources/img/e-um.png'

export default function SocialAgree() {
  const [formData, setFormData] = useState({
    // 약관동의
    terms: {
      agreeTerms: false,      // 서비스 이용약관 (필수)
      agreePrivacy: false,    // 개인정보처리방침 (필수)
      agreeMarketing: false,  // 마케팅 수신동의 (선택)
    },
  });

  const updateFormData = (data) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const handleNext = async () => {

    // 2단계: 약관 필수 동의 확인 + 실제 회원가입 API 호출
      const { agreeTerms, agreePrivacy, agreeMarketing, hasReadTerms, hasReadPrivacy } = formData.terms;

      if (!hasReadTerms || !hasReadPrivacy) {
        alert("필수 약관 원문을 끝까지 읽어주세요.");
        return;
      }
      if (!agreeTerms || !agreePrivacy) {
        alert("필수 약관에 동의해야 회원가입이 가능합니다.");
        return;
      }

      const payload = {
        c_agree_terms: agreeTerms ? "Y" : "N",
        c_agree_privacy: agreePrivacy ? "Y" : "N",
        c_agree_marketing: agreeMarketing ? "Y" : "N",
      };

      try {
        await api.patch("/api/social/agree", payload);
        alert("네이버 로그인 성공했습니다.");
        window.location.href = "/";
        // navigate("/");
      } catch (ex) {
        console.log("agree error:", ex?.response?.status, ex?.response?.data);
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

  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <img src={maintxt} className="mx-auto block w-38 h-auto" />
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-2 sm:mb-4">
            소셜로그인
          </h2>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            안전하고 신뢰할 수 있는 금융 서비스를 위해 정확한 정보를 입력해주세요
          </p>
        </div>


        {/* Body */}
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <TermsStep
                terms={formData.terms}
                updateFormData={(termsPatch) =>
                    updateFormData({ terms: { ...formData.terms, ...termsPatch } })
                }
            />

            <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 space-y-3 sm:space-y-0"></div>
                <div className="flex justify-end w-full">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                    >
                        로그인 완료
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
