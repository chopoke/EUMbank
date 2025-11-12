import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { setAccessToken } from "../../api/axios";
import maintxt from "../../resources/img/e-um.png";

let linking = null; // 탭/재마운트 중복 방지

export default function NaverLink() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [pending, setPending] = useState(false); // 중복 클릭 방지
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");
  const email = params.get("email");
  const naverId = params.get("naverId");

  // 필수 파라미터 검증. 없으면 로그인으로
  useEffect(() => {
    if (!userId || !email || !naverId) navigate("/login", { replace: true });
  }, [userId, email, naverId, navigate]);

  const handleLinkConfirm = async () => {
    if (pending) return;
    if (linking) return; // 선택: 전역 락
    setPending(true);
    linking = (async () => {
      try {
        const payload = { c_user_id: userId, c_naver_id: naverId };
        const res = await api.patch("/api/social/link", payload);

        if (res.status === 200 && res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          window.dispatchEvent(new Event("auth:changed"));
          alert("계정이 성공적으로 연동되었습니다.");
          // URL 정리
          const url = new URL(window.location.href);
          ["userId", "email", "naverId"].forEach(k => url.searchParams.delete(k));
          window.history.replaceState({}, "", url.pathname);
          navigate("/", { replace: true });
          return;
        }
        alert("연동 중 오류가 발생했습니다. 다시 시도해주세요.");
      } catch (e) {
        const s = e?.response?.status;
        const c = e?.response?.data?.code;
        if (s === 423 || c === "ACCOUNT_STATUS_BLOCKED") {
          alert("계정 상태로 로그인할 수 없습니다. 관리자에게 문의하세요.");
          navigate("/login", { replace: true });
        } else {
          console.error(e);
          alert("서버와의 통신 중 오류가 발생했습니다.");
        }
      } finally {
        setPending(false);
        linking = null;
      }
    })();
  };

  const handleCancelClick = () => setShowWarning(true);
  const handleWarningConfirm = () => navigate("/login", { replace: true });
  const handleWarningCancel = () => setShowWarning(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800" style={{ fontFamily: "Pacifico, serif" }}>
            <img src={maintxt} className="mx-auto block w-38 h-auto" alt="이음 로고" />
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-blue-600 mt-1">NAVER 로그인 연동</h2>
        </div>

        <div className="max-w-2xl mx-auto mb-6 text-center py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-line text-2xl sm:text-3xl text-green-600"></i>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">계정 연동 안내</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 space-y-1">
                {email} 이메일은 <br /> {userId} 아이디로 이음은행에 가입한 이력이 있습니다.
                <br className="hidden sm:block" />
                네이버 로그인을 연동하시겠습니까?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleLinkConfirm}
                disabled={pending}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                예
              </button>
              <button
                onClick={handleCancelClick}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap cursor-pointer"
              >
                아니요
              </button>
            </div>
          </div>

          {showWarning && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
              <div className="bg-white rounded-2xl shadow-lg p-6 w-100 text-center">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  연동하지 않을 경우 <br /> 기존 아이디로만 로그인이 가능합니다.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleWarningConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    예
                  </button>
                  <button
                    onClick={handleWarningCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
