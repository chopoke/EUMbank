import { Link } from "react-router-dom";

export default function CompletionStep() {
  return (
    <div className="text-center py-6 sm:py-8">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="ri-check-line text-2xl sm:text-3xl text-green-600"></i>
      </div>
      
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">회원가입이 완료되었습니다!</h3>
      
      <p className="text-gray-600 mb-6 px-4">
        입력해주신 정보를 바탕으로 계정 승인을 진행하겠습니다.
        <br className="hidden sm:block" />
        승인 완료 시 등록하신 이메일로 안내드리겠습니다.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
        <h4 className="text-sm font-medium text-blue-800 mb-2">다음 단계</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 신분증 확인 및 본인인증 (1-2일 소요)</li>
          <li>• 계정 승인 완료 시 이메일 발송</li>
          <li>• 승인 후 모든 금융 서비스 이용 가능</li>
        </ul>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Link to='/'><button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer">
          로그인 페이지로
        </button></Link>
        <button className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap cursor-pointer">
          고객센터 문의
        </button>
      </div>
    </div>
  );
}
