import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import BankHome from './pages/main';
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useEffect, useState } from "react";
import Cookie from "./pages/login/Cookie";
import SocialAgree from "./pages/signup/SocialAgree";
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";
// 계좌 개설 단계별 화면
import Step1Consent from "./pages/account/Step1Consent";
import Step2IdVerify from "./pages/account/Step2IdVerify";
import Step3Info from "./pages/account/Step3Info";
import Step4Product from "./pages/account/Step4Product";
import Step5Done from "./pages/account/Step5Done";
import api from "./api/axios";

// 앞단에서 로그인 유무 판단하여 페이지 보호하기
import ProtectedRoute from "./pages/account/component/ProtectedRoute";
import { AccountListPage } from "./pages/account/AccountListPage";
import { AccountHistoryPage } from "./pages/account/AccountHistoryPage";


// App 컴포넌트를 BrowserRouter로 감싸주는 Wrapper
// 이렇게 하면 App 컴포넌트 내에서 useNavigate를 정상적으로 사용할 수 있습니다.
function AppWrapper() {
  return (
    <App />
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 새로고침 로그인 유지
  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  // // 로그인 성공 시 호출될 콜백 함수
  // const handleLoginSuccess = (userData) => {
  //   localStorage.setItem("accessToken", userData.accessToken);
  //   localStorage.setItem("user", JSON.stringify(userData.profile ?? {}));
  //   setIsLoggedIn(true);   // 로그인 상태를 true로 변경
  //   setUser(userData);     // 사용자 정보 저장
  //   navigate('/');         // 메인 페이지로 이동
  // };

  // 로그아웃 시 호출될 콜백 함수
  const handleLogout = async () => {
    try{
      const rt = localStorage.getItem("refresh");
      if (rt) await api.post("/api/auth/logout", {refreshToken: rt });
    } catch(e){
      
    }
    localStorage.removeItem("access");
    localStorage.removeItem("refresh"); // 완전한 로그아웃과 보안을 위해 같이 삭제
    setIsLoggedIn(false); // 로그아웃 상태를 false로 변경
    setUser(null);
    navigate('/');      // 메인 페이지로 이동
  };

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<BankHome user={user} />} />
        {/* <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /> */}
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/cookie" element={<Cookie />} />
        <Route path="/socialAgree" element={<SocialAgree />} />
        
        {/* 계좌 목록 */}
        <Route path="/accounts" element={
          <ProtectedRoute>
            <AccountListPage />
            </ProtectedRoute>} />
        {/* 이체 내역 */}
        <Route path="/accounts/:a_no" element={
          <ProtectedRoute>
            <AccountHistoryPage />
            </ProtectedRoute>} />

        {/* 계좌 개설: 각 단계 독립 경로 */}
        <Route path="/account/open" element={
           <ProtectedRoute>
            <Navigate to="/account/open/step1" replace />
           </ProtectedRoute>
        } />
        <Route path="/account/open/step1" element={<Step1Consent />} />
        <Route path="/account/open/step2" element={<Step2IdVerify />} />
        <Route path="/account/open/step3" element={<Step3Info />} />
        <Route path="/account/open/step4" element={<Step4Product />} />
        <Route path="/account/open/step5" element={<Step5Done />} />

        {/* ✅ 외환 라우팅 */}
        <Route path="/foreign" element={<Navigate to="/foreign/rate" replace />} />
        <Route path="/foreign/rate" element={<ForeignRatePage />} />
        <Route path="/foreign/products" element={<ForeignProductsPage />} />

      </Routes >

      <Footer />
    </div >
  );
}

export default AppWrapper;