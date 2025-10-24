import { Link } from 'react-router-dom';

function mypage_costomer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* 헤더 */}
      {/* <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-bank-line text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Pacifico, serif" }}>NeoBank</h1>
            </div>
          </div>
          <Link
            to="/mypage"
            className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            마이페이지
          </Link>
        </div>
      </header> */}

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            안전하고 편리한 디지털 뱅킹
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            NeoBank와 함께 더 스마트한 금융 생활을 시작하세요.
            간편한 계좌 관리부터 투자까지, 모든 금융 서비스를 한 곳에서.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-check-line text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">안전한 보안</h3>
            <p className="text-gray-600">최고 수준의 보안 시스템으로 고객의 자산을 안전하게 보호합니다.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-smartphone-line text-2xl text-green-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">모바일 뱅킹</h3>
            <p className="text-gray-600">언제 어디서나 간편하게 이용할 수 있는 모바일 뱅킹 서비스를 제공합니다.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-customer-service-line text-2xl text-purple-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">24시간 고객지원</h3>
            <p className="text-gray-600">전문 상담사가 24시간 고객의 문의사항을 신속하게 해결해드립니다.</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/mypage"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:from-blue-700 hover:to-teal-600 transition-all shadow-lg whitespace-nowrap"
          >
            <span>마이페이지에서 계좌 관리하기</span>
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default mypage_costomer;