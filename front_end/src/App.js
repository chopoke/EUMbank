<<<<<<< HEAD
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
=======
import {  Route, Routes, useNavigate, Navigate } from "react-router-dom";
>>>>>>> b83e7af213d3f3085bd1478cee9a28b7a77362ee
import BankHome from './pages/main';
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useState } from "react";
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";

<<<<<<< HEAD
// 단계별 화면
import Step1Consent from "./pages/account/Step1Consent";
import Step2IdVerify from "./pages/account/Step2IdVerify";
import Step3Info from "./pages/account/Step3Info";
import Step4Product from "./pages/account/Step4Product";
import Step5Done from "./pages/account/Step5Done";

// 앞단에서 로그인 유무 판단하여 페이지 보호하기
//import ProtectedRoute from "./pages/account/component/ProtectedRoute";


// App 컴포넌트를 BrowserRouter로 감싸주는 Wrapper
// 이렇게 하면 App 컴포넌트 내에서 useNavigate를 정상적으로 사용할 수 있습니다.
=======
>>>>>>> b83e7af213d3f3085bd1478cee9a28b7a77362ee
function AppWrapper() {
  return (
    <App />
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 로그인 성공 시 호출될 콜백 함수
  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);   // 로그인 상태를 true로 변경
    setUser(userData);     // 사용자 정보 저장
    navigate('/');         // 메인 페이지로 이동
  };

  // 로그아웃 시 호출될 콜백 함수
  const handleLogout = () => {
    setIsLoggedIn(false); // 로그아웃 상태를 false로 변경
    setUser(null);
    navigate('/');      // 메인 페이지로 이동
  };

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<BankHome user={user} />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignUp />} />

<<<<<<< HEAD
        {/* 계좌 개설: 각 단계 독립 경로 */}
        <Route path="/account/open" element={
          //<ProtectedRoute>
          <Navigate to="/account/open/step1" replace />
          //</ProtectedRoute>
        } />

        <Route path="/account/open/step1" element={<Step1Consent />} />
        <Route path="/account/open/step2" element={<Step2IdVerify />} />
        <Route path="/account/open/step3" element={<Step3Info />} />
        <Route path="/account/open/step4" element={<Step4Product />} />
        <Route path="/account/open/step5" element={<Step5Done />} />


=======
        {/* ✅ 외환 라우팅 */}
        <Route path="/foreign" element={<Navigate to="/foreign/rate" replace />} />
        <Route path="/foreign/rate" element={<ForeignRatePage />} />
        <Route path="/foreign/products" element={<ForeignProductsPage />} />
>>>>>>> b83e7af213d3f3085bd1478cee9a28b7a77362ee
      </Routes>

      <Footer />
    </div>
  );
}

export default AppWrapper;