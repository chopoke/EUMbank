import {  Route, Routes, useNavigate, Navigate } from "react-router-dom";
import BankHome from './pages/main';
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useState } from "react";
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";

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

        {/* ✅ 외환 라우팅 */}
        <Route path="/foreign" element={<Navigate to="/foreign/rate" replace />} />
        <Route path="/foreign/rate" element={<ForeignRatePage />} />
        <Route path="/foreign/products" element={<ForeignProductsPage />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default AppWrapper;