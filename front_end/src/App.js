// src/App.js
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import BankHome from "./pages/main";
import { Header } from './common/header';
import { Footer } from './common/footer';
import { useEffect, useState } from "react";
import { getAccessToken, setAccessToken } from "./api/axios";
import ProtectedRoute from "./pages/account/component/ProtectedRoute";

// 앞단에서 로그인 유무 판단하여 페이지 보호하기
import { AccountListPage } from "./pages/account/AccountListPage";
import { AccountHistoryPage } from "./pages/account/AccountHistoryPage";

//로그인 및 회원가입
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import Cookie from "./pages/login/Cookie";
import SocialAgree from "./pages/signup/SocialAgree";
import NaverLink from "./pages/login/NaverLink";
import { refreshOnce, logout as apiLogout, fetchMe } from "./api/authApi";

import MyPage from "./pages/mypage/my_costomer2";
import Test from './pages/test';
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";
import ForeignOpenPage from "./pages/foreign/ForeignOpenPage";
import ForeignExchangePage from "./pages/foreign/ForeignExchangePage";
import api from "./api/axios";

// 이체 관련 페이지들
import TransferPage from "./pages/transfer/TransferPage";
import TransferComplete from "./pages/transfer/TransferComplete";
import TransferReserveComplete from "./pages/transfer/TransferReserveComplete";
import BulkTransferDashboard from "./pages/transfer/BulkTransferDashboard";
import BulkTransferComplete from "./pages/transfer/BulkTransferComplete";

// 주택담보대출
import LoanProductList from "./pages/loan/products/LoanProductList"

// 대출상품상세
import LoanProductDetail from "./pages/loan/products/LoanProductDetail"

// 예적금
import { depositSavingRouteElements } from "./pages/depositSaving/router/depositSavingRouter";

// 계좌개설
import { accountElements } from "./pages/account/router/accountRouter";
import AdminPage from "./pages/admin/page";

function AppWrapper() {
  return <App />;
}

function App() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 최초 1회: RT로 AT 복구
  useEffect(() => {
    const isSocial = window.location.pathname.startsWith("/social/");
    if (isSocial) {
      setIsLoggedIn(!!getAccessToken());
      setReady(true);
      return;
    }
    (async () => {
      const ok = await refreshOnce();   // RT -> AT
      if (ok) {
        try {
          const { fetchMe } = await import("./api/authApi");
          const me = await fetchMe();
          setUser(me);
          setIsLoggedIn(true);
        } catch {}
      }
      setReady(true);
    })();
  }, []);

  // 로그인/로그아웃 이벤트로 헤더 갱신
  useEffect(() => {
    const onAuthChanged = async () => {
      const loggedIn = !!getAccessToken();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        try { setUser(await fetchMe()); } catch {}
      } else {
        setUser(null);
      }
    };
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    setAccessToken(null);
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
  };

  if (!ready) return <div>Loading...</div>;

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<BankHome user={user} />} />
        {/* <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/social/cookie" element={<Cookie />} />
        <Route path="/social/agree" element={<SocialAgree />} />
        <Route path="/social/link" element={<NaverLink />} />

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

        {/* 주택담보대출 상품 목록 */}
        <Route path="/loan/products" element={<LoanProductList />} />
        {/* 상품 상세 */}
        <Route path="/loan/products/:code" element={<LoanProductDetail />} />

        {/* 계좌 개설: 각 단계 독립 경로 */}
        {accountElements}

        {/* ✅ 예금/적금 */}
        {depositSavingRouteElements}

        {/* ✅ 외환 라우팅 */}
        <Route path="/foreign" element={<Navigate to="/foreign/rate" replace />} />
        <Route path="/foreign/rate" element={<ForeignRatePage />} />
        <Route path="/foreign/products" element={<ForeignProductsPage />} />
        <Route
          path="/foreign/exchange"
          element={
            <ProtectedRoute>
              <ForeignExchangePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/foreign/open-account"
          element={
            <ProtectedRoute>
              <ForeignOpenPage />
            </ProtectedRoute>
          }
        />
        <Route path="/foreign/open" element={<Navigate to="/foreign/open-account" replace />} />




        {/* 이체 관련 라우팅 */}
        <Route path="/transfer" element={
          <ProtectedRoute>
            <TransferPage />
          </ProtectedRoute>
        } />
        <Route path="/transfer/complete" element={
          <ProtectedRoute>
            <TransferComplete />
          </ProtectedRoute>
        } />
        <Route path="/transfer/reserve/complete" element={
          <ProtectedRoute>
            <TransferReserveComplete />
          </ProtectedRoute>
        } />
        <Route path="/transfer/bulk" element={
          <ProtectedRoute>
            <BulkTransferDashboard />
          </ProtectedRoute>
        } />
        <Route path="/transfer/bulk/complete" element={
          <ProtectedRoute>
            <BulkTransferComplete />
          </ProtectedRoute>
        } />

        {/* 마이페이지 진입 */}
        <Route path="/mypage" element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        } />

        {/* 관리자페이지 진입 */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />

        {/* 마이페이지 진입 */}
        <Route path="/test" element={<Test />} />
      </Routes >
      <Footer />
    </div>
  );
}

export default AppWrapper;