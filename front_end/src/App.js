import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import BankHome from './pages/main';
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useState } from "react";
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";

// 계좌 개설 단계별 화면
import Step1Consent from "./pages/account/Step1Consent";
import Step2IdVerify from "./pages/account/Step2IdVerify";
import Step3Info from "./pages/account/Step3Info";
import Step4Product from "./pages/account/Step4Product";
import Step5Done from "./pages/account/Step5Done";

// 에금 적금
import DepositSavingProductList from "./pages/depositSaving/commom/DepositSavingProductList";
import TermsAgreement from "./pages/depositSaving/commom/TermAgreements";
import DepositSubscription from "./pages/depositSaving/page/DepositSubscription";
import SavingsSubscription from "./pages/depositSaving/page/SavingsSubscription";

// 앞단에서 로그인 유무 판단하여 페이지 보호하기
import ProtectedRoute from "./pages/account/component/ProtectedRoute";


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
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 계좌 개설: 각 단계 독립 경로 */}
        <Route path="/account/open" element={<ProtectedRoute><Navigate to="/account/open/step1" replace /></ProtectedRoute>} />
        <Route path="/account/open/step1" element={<ProtectedRoute><Step1Consent /></ProtectedRoute>} />
        <Route path="/account/open/step2" element={<ProtectedRoute><Step2IdVerify /></ProtectedRoute>} />
        <Route path="/account/open/step3" element={<ProtectedRoute><Step3Info /></ProtectedRoute>} />
        <Route path="/account/open/step4" element={<ProtectedRoute><Step4Product /></ProtectedRoute>} />
        <Route path="/account/open/step5" element={<ProtectedRoute><Step5Done /></ProtectedRoute>} />

        {/* ✅ 외환 라우팅 */}
        <Route path="/foreign" element={<Navigate to="/foreign/rate" replace />} />
        <Route path="/foreign/rate" element={<ForeignRatePage />} />
        <Route path="/foreign/products" element={<ForeignProductsPage />} />

        {/* 예금/적금 메인 라우팅 */}
        <Route path="/depositSavingProductList/open" element={<DepositSavingProductList />} />

        {/* 예금 */}
        <Route path="/deposit/open/deposit-1" element={<TermsAgreement productType={'예금'} />} />
        <Route path="/deposit/open/deposit-2" element={<TermsAgreement productType={'예금'} />} />
        <Route path="/deposit/open/deposit-3" element={<TermsAgreement productType={'예금'} />} />
        {/* 적금 */}
        <Route path="/savings/open/savings-1" element={<TermsAgreement productType={'적금'} />} />
        <Route path="/savings/open/savings-2" element={<TermsAgreement productType={'적금'} />} />
        <Route path="/savings/open/savings-3" element={<TermsAgreement productType={'적금'} />} />

        {/* 예금/적금 가입 */}
        <Route path="/savings/save" element={<DepositSubscription />} />
        <Route path="/deposit/save" element={<SavingsSubscription />} />
      </Routes >

      <Footer />
    </div >
  );
}

export default AppWrapper;