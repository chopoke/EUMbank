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
import { DepositHistoryPage } from "./pages/account/DepositHistoryPage";
import { InstallmentHistoryPage } from "./pages/account/InstallmentHistoryPage";

//로그인 및 회원가입
import LoginPage from "./pages/login/login";
import SignUp from "./pages/signup/signup";
import Cookie from "./pages/login/Cookie";
import SocialAgree from "./pages/signup/SocialAgree";
import NaverLink from "./pages/login/NaverLink";
import { refreshOnce, logout as apiLogout, fetchMe } from "./api/authApi";

import MyPage from "./pages/mypage/my_costomer2";
import Test from './pages/test';
import Agree from './common/footer/agree';
import Privacy from './common/footer/privacy';
import Disclosure from './common/footer/disclosure';
import ForeignProductsPage from "./pages/foreign/ForeignProductsPage";
import ForeignRatePage from "./pages/foreign/ForeignRatePage";
import ForeignOpenPage from "./pages/foreign/ForeignOpenPage";
import ForeignExchangePage from "./pages/foreign/ForeignExchangePage";

// 이체 관련 페이지들
import TransferPage from "./pages/transfer/TransferPage";
import TransferComplete from "./pages/transfer/TransferComplete";
import TransferReserveComplete from "./pages/transfer/TransferReserveComplete";
import BulkTransferDashboard from "./pages/transfer/BulkTransferDashboard";
import BulkTransferComplete from "./pages/transfer/BulkTransferComplete";
import AutoTransferComplete from "./pages/transfer/AutoTransferComplete";
import TransferManagePage from "./pages/transfer/TransferManagePage";

// 주택담보대출
import LoanProductList from "./pages/loan/products/LoanProductList"
// 대출상품상세
import LoanProductDetail from "./pages/loan/products/LoanProductDetail"

// 예적금
import { depositSavingRouteElements } from "./pages/depositSaving/router/depositSavingRouter";
// 계좌개설
import { accountElements } from "./pages/account/router/accountRouter";

// 대출신청 스텝
import ApplyAgree from "./pages/loan/apply/ApplyAgree";
import ApplySubmitPage from "./pages/loan/apply/ApplySubmitPage";
import ApplySignPage from "./pages/loan/apply/ApplySignPage";
import ApplyFormPage from "./pages/loan/apply/ApplyFormPage";
import ApplyDocsPage from "./pages/loan/apply/ApplyDocsPage";
import ApplyCompletePage from "./pages/loan/apply/ApplyCompletePage";

// 자산관리
import AssetAnalysis from "./pages/assetManagement/page/AssetAnalysis";
import AssetDashboard from "./pages/assetManagement/page/AssetDashboard";
import AssetPeerComparison from "./pages/assetManagement/page/AssetPeerComparison";
import AssetRecommendation from "./pages/assetManagement/page/AssetRecommendation";
import AssetReport from "./pages/assetManagement/page/AssetReport";

// 관리자페이지
import AdminPage from "./pages/admin/page";

// 공과금
import BillsLanding from "./pages/bills/BillsLanding";


// 현물(Spot) 페이지들
import SpotTradingPage from "./pages/spot/pages/SpotTradingPage";
import SpotBalancePage from "./pages/spot/pages/SpotBalancePage";
import SpotWalletsPage from "./pages/spot/pages/SpotWalletsPage";
import SpotHistoryPage from "./pages/spot/pages/SpotHistoryPage";
import SpotPriceHistoryPage from "./pages/spot/pages/SpotPriceHistoryPage";

//import {chatBotRouteElements} from "./pages/chat/router/chatBotRoutes";

// 쳇봇
import FloatingChatButton from "./pages/chat/page/FloatingChatButton";

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
    const isSocial = window.location.pathname.startsWith("/social/") && window.location.pathname !== "/social/agree";
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
      {/*  쳇봇 */}
      <FloatingChatButton />
      <Routes>
        <Route path="/" element={<BankHome user={user} />} />
        {/* <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/social/cookie" element={<Cookie />} />
        <Route path="/social/agree" element={
          <ProtectedRoute>
            <SocialAgree />
          </ProtectedRoute>} />
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
        {/* 적금계좌 이체내역 */}
        <Route path="/accounts/installment/:i_no" element={<ProtectedRoute>< InstallmentHistoryPage /></ProtectedRoute>} />
        {/* 예금계좌 이체내역 */}
        <Route path="/accounts/deposit/:d_no" element={<ProtectedRoute><DepositHistoryPage/></ProtectedRoute>} />

        {/* 대출 상품 목록 */}
        <Route path="/loan/products" element={<LoanProductList />} />

        {/* 상품 상세 */}
        <Route path="/loan/products/:code" element={<ProtectedRoute><LoanProductDetail /></ProtectedRoute>} />


        {/* 대출 신청 스탭 */}
        <Route path="/loan/apply/:code/agree"  element={<ProtectedRoute><ApplyAgree/></ProtectedRoute>} />
        <Route path="/loan/apply/:code/form"   element={<ProtectedRoute><ApplyFormPage/></ProtectedRoute>} />
        <Route path="/loan/apply/:code/docs"   element={<ProtectedRoute><ApplyDocsPage/></ProtectedRoute>} />
        <Route path="/loan/apply/:code/sign"   element={<ProtectedRoute><ApplySignPage/></ProtectedRoute>} />
        <Route path="/loan/apply/:code/submit" element={<ProtectedRoute><ApplySubmitPage/></ProtectedRoute>} />
        <Route path="/loan/apply/:code/complete/:laId" element={<ProtectedRoute><ApplyCompletePage/></ProtectedRoute> } />


        

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

        <Route path="/transfer/manage" element={
          <ProtectedRoute>
            <TransferManagePage />
          </ProtectedRoute>
        } />
        <Route path="/transfer/auto" element={
          <ProtectedRoute>
            <Navigate to="/transfer" replace />
          </ProtectedRoute>
        } />
        <Route path="/transfer/auto/complete" element={
          <ProtectedRoute>
            <AutoTransferComplete />
          </ProtectedRoute>
        } />

        {/* 공과금페이지 */}
        <Route path="/bills" element={<BillsLanding />} />


        {/* ✅ 현물(Spot) 라우팅 */}
        <Route path="/spot" element={
          <ProtectedRoute>
            <SpotTradingPage />
          </ProtectedRoute>
        } />
        <Route path="/spot/trade" element={
          <ProtectedRoute>
            <SpotTradingPage />
          </ProtectedRoute>
        } />
        <Route path="/spot/balance" element={
          <ProtectedRoute>
            <SpotBalancePage />
          </ProtectedRoute>
        } />
        <Route path="/spot/wallets" element={
          <ProtectedRoute>
            <SpotWalletsPage />
          </ProtectedRoute>
        } />
        <Route path="/spot/history" element={
          <ProtectedRoute>
            <SpotHistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/spot/SpotPriceHistory" element={
          <ProtectedRoute>
            <SpotPriceHistoryPage />
          </ProtectedRoute>
        } />

        {/* 자산관리 */}
        <Route path="/asset" element={<Navigate to="/asset/dashboard" replace />}/>

         {/* 자산 대시보드 (자산 현황) */}
        <Route
          path="/asset/dashboard"
          element={
            <ProtectedRoute>
              <AssetDashboard />
            </ProtectedRoute>
          }
        />

        {/* 자산 분석 */}
        <Route
          path="/asset/analysis"
          element={
            <ProtectedRoute>
              <AssetAnalysis />
            </ProtectedRoute>
          }
        />

        {/* 또래 비교 */}
        <Route
          path="/asset/peer"
          element={
            <ProtectedRoute>
              <AssetPeerComparison />
            </ProtectedRoute>
          }
        />

        {/* 맞춤형 추천 */}
        <Route
          path="/asset/recommend"
          element={
            <ProtectedRoute>
              <AssetRecommendation />
            </ProtectedRoute>
          }
        />

        {/* 월간 리포트 */}
        <Route
          path="/asset/report"
          element={
            <ProtectedRoute>
              <AssetReport />
            </ProtectedRoute>
          }
        />

        {/* 관리자페이지 */}
        <Route path="/admin" element={<AdminPage/>} />


        {/* 마이페이지 진입 */}
        <Route path="/mypage" element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        } />

        {/* 푸터관련페이지 진입 */}
        <Route path='/ftagree' element={<Agree />} />
        <Route path='/ftprivacy' element={<Privacy />} />
        <Route path='/ftdisclosure' element={<Disclosure />} />

      </Routes >
      <Footer />
    </div>
  );
}

export default AppWrapper;