import { useMemo } from 'react';
import EmailVerifyBox from './EmailVerifyBox';
import { validUsername, validPassword } from './validators';

export default function PersonalInfoStep({ formData, updateFormData, onCheckUsername }) {
  const uOk = useMemo(() => validUsername(formData.username), [formData.username]);
  const pOk = useMemo(() => validPassword(formData.password), [formData.password]);
  const p2Ok = useMemo(
    () => formData.password && formData.password === formData.confirmPassword,
    [formData.password, formData.confirmPassword]
  );

  const handleInputChange = (field, value) => {
    if (field === 'username') updateFormData({ username: value, usernameAvailable: null });
    else updateFormData({ [field]: value });
  };

  const formatPhoneNumber = (value) => {
    // 숫자만 남김
    const digits = value.replace(/\D/g, '');

    // 010-XXXX-XXXX 형태로 포맷팅
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">개인정보 입력</h3>

      <div className="space-y-4 sm:space-y-6">
        {/* 성명 / 휴대폰 */}
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
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => { const formatted = formatPhoneNumber(e.target.value);
                            handleInputChange('phone', formatted)}}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="010-1234-5678"
              maxLength={13}
              required
            />
          </div>
        </div>

        {/* 생년월일 */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              생년월일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birth}
              onChange={(e) => handleInputChange('birth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
        </div>

        {/* 이메일 인증 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <EmailVerifyBox
              value={formData.email}
              onChange={(v) => {
                 handleInputChange('email', v);
                 // 이메일을 바꾸면 인증 상태/코드 초기화
                 updateFormData({ emailVerified: false, emailCode: "" });
               }}
               onVerified={(ok, code) => updateFormData({ emailVerified: ok, emailCode: code })}
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
                onBlur={() => { if (uOk && formData.username) onCheckUsername?.(formData.username); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="영문, 숫자 조합 6~20자"
                required
              />
              {formData.username && (
                <div className="mt-1 text-xs">
                  {!uOk && <p className="text-red-500">영문과 숫자를 모두 포함하여 6~20자로 입력하세요.</p>}
                  {uOk && formData.usernameAvailable === true && (
                    <p className="text-green-600">사용 가능한 아이디입니다.</p>
                  )}
                  {uOk && formData.usernameAvailable === false && (
                    <p className="text-red-500">이미 사용 중인 아이디입니다.</p>
                  )}
                </div>
              )}
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
              {formData.password && (
                <p className={`mt-1 text-xs ${pOk ? 'text-green-600' : 'text-red-500'}`}>
                  {pOk ? '사용 가능한 비밀번호입니다.' : '8~32자, 영문/숫자/특수문자 중 2가지 이상 포함하세요.'}
                </p>
              )}
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
              {formData.confirmPassword && (
                <p className={`mt-1 text-xs ${p2Ok ? 'text-green-600' : 'text-red-500'}`}>
                  {p2Ok ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}