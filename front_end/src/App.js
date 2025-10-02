import {  Route, Routes, useNavigate } from "react-router-dom";
import BankHome from './pages/main';
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useState } from "react";

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
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default AppWrapper;