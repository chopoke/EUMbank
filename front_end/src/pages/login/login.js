import { useState } from 'react';
import mainlogo from '../../resources/img/eumonly.png'

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [loginType, setLoginType] = useState('password');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // 로그인 로직 처리
    console.log('로그인 시도:', formData);
  };

  const handleBiometricLogin = () => {
    // 생체인증 로그인 로직
    console.log('생체인증 로그인 시도');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: "Pacifico, serif" }}>
              logo
            </h1> */}
            <div className="flex justify-center">
              <img src={mainlogo} className="mainlogo" />
            </div>
            <br></br>
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">로그인</h2>
            <p className="text-gray-600">안전한 금융 서비스에 로그인하세요</p>
          </div>

          {/* 로그인 타입 선택 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
            {/* <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginType('password')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  loginType === 'password'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                비밀번호 로그인
              </button>
              <button
                type="button"
                onClick={() => setLoginType('biometric')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  loginType === 'biometric'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                생체인증 로그인
              </button>
            </div> */}


            <form onSubmit={handleLogin} className="space-y-4">
                {/* 아이디 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="아이디를 입력하세요"
                    required
                  />
                </div>

                {/* 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>

                {/* 로그인 유지 */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">로그인 상태 유지</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    비밀번호 찾기
                  </button>
                </div>

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  로그인
                </button>
              </form>
          </div>

          {/* 추가 옵션 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">아직 계정이 없으신가요?</p>
              <a
                href="/signup"
                className="inline-block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                회원가입
              </a>
            </div>

            {/* 소셜 로그인 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">간편 로그인</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-kakao-talk-fill text-xl text-yellow-500"></i>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-google-fill text-xl text-red-500"></i>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-apple-fill text-xl text-gray-800"></i>
                </button>
              </div>
            </div>
          </div>

          {/* 보안 알림 */}
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex">
              <i className="ri-shield-check-line text-yellow-600 mr-3 mt-0.5"></i>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">보안 안내</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  개인정보 보호를 위해 공용 컴퓨터에서는 로그인 상태 유지를 해제해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
