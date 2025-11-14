import React, { useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../resources/css/main.css';
import mainlogo from '../resources/img/eumonly.png'
import myp from '../resources/img/mypage.png'
import api from '../api/axios';
import NotificationBell from '../fcm/components/NotificationBell';

// 데모용 아이콘 (간단한 SVG)
const Icon = ({ path, label }) => (
  // Tailwind의 inline-flex, items-center, gap-2를 대체
  <span className="icon-wrapper" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label && <span className="sr-only">{label}</span>}
  </span>
);

const paths = {
  bell: "M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z",
  search: "M21 21l-4.35-4.35M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
  arrowR: "M5 12h14M13 5l7 7-7 7",
  bank: "M3 10l9-7 9 7H3Zm2 3h2v7H5v-7Zm6 0h2v7h-2v-7Zm6 0h2v7h-2v-7Z",
  card: "M3 7h18v10H3V7Zm0 3h18",
  loan: "M12 3v4m-9 6h18M5 21h14a2 2 0 0 0 2-2v-6H3v6a2 2 0 0 0 2 2Z",
  send: "M21 3L3 10l7 2 2 7 9-16Z",
  bill: "M6 2h12v20H6z M9 7h6 M9 11h6 M9 15h4",
  fx: "M4 8h8M4 12h8M4 16h8M15 8h5M15 12h5M15 16h5",
  chart: "M4 20h16M7 16v-6M12 20V8M17 20v-10",
  shield: "M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z",
};

export function Header({ isLoggedIn, user, onLogout }) {
    const navigate = useNavigate();
    const displayName = user?.c_user_id||"고객";
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");
    const handleLogoutClick = () => {
        // 부모로부터 받은 onLogout 함수를 호출합니다.
        onLogout();
        // App.js의 onLogout에서 이미 navigate('/')를 처리하므로 여기서는 호출만 합니다.
    };

    useEffect(() => {
      if (isLoggedIn && !user) {
        api.get("/api/me").catch(() => {});
      }
    }, [isLoggedIn, user]);

    return (
        <header className="main-header">
      {/* Top Utility Bar */}
      {/* hidden md:flex h-10 items-center justify-between px-6 text-sm text-gray-600 */}
      {/* <div className="utility-bar">
        flex items-center gap-4
        <div className="utility-menu">
          <a href="#notice" className="hover-underline">공지</a>
          <a href="#a11y" className="hover-underline">접근성</a>
          <a href="#help" className="hover-underline">고객센터</a>
        </div>
        <div className="utility-menu">
          <button className="hover-underline" aria-label="언어 전환">KO/EN</button>
          <button className="notification-button" aria-label="알림">
            <Icon path={paths.bell} />
            absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full px-1
            <span className="notification-count">3</span>
          </button>
        </div>
      </div> */}
      {/* Main Nav */}
      {/* h-16 flex items-center justify-between px-6 */}
      <div className="main-nav-bar">
        {/* flex items-center gap-8 */}
        <div className="main-nav-left">
          {/* font-semibold text-xl text-blue-700 tracking-tight */}
          <img src={mainlogo} className="mainlogo"/>
          {/* <FlowingInfinityIcon size={50} /> */}
          <Link to="/" className="logo">이음은행</Link>
          {/* hidden lg:flex items-center gap-6 text-sm text-gray-700 */}
          <nav className="main-nav-links">
            <Link to="/accounts" className="nav-link">개인</Link>
            <div className="nav-link group relative">상품
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-26 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 z-10">
                <div className="bg-white rounded-lg shadow-xl py-2">
                  <Link to="/loan/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">대출 상품</Link>
                  <Link to="/depositSavingProductList/open" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">예금/적금</Link>
                  {/* <Link to="/products/card" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100">카드</Link> */}
                </div>
              </div>
            </div>

            <Link to="/wealth" className="nav-link nav-link-active">자산관리</Link>
            <Link to="/foreign/rate" className="nav-link">외환/환율</Link>
            {/* 마이페이지 or 관리자페이지 이동 */}
            {/* <Link to={isAdmin ? "/admin" : "/mypage"} className="nav-link">
              <img src={myp} className="mypage w-5" />
            </Link> */}
            {/* <Link to="/events" className="nav-link">이벤트</Link> */}
            {/* FCM 알림 종모양 아이콘 */}
            {isLoggedIn && <NotificationBell />}
          </nav>
        </div>
        {/* flex items-center gap-3 */}
        <div className="main-nav-right">
          {/* relative hidden md:block */}
          {/* <label className="search-label"> */}
            {/* peer w-64 rounded-full border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 */}
            {/* <input className="search-input" placeholder="메뉴나 기능 검색" /> */}
            {/* absolute left-3 top-2.5 text-gray-500 */}
            {/* <span className="search-icon"><Icon path={paths.search} /></span> */}
          {/* </label> */}
          {isLoggedIn && isAdmin && (
            <button
              className="login-button"
              onClick={() => window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/admin/enter`}
            >
              관리자
            </button>
          )}
          {!isLoggedIn ? (
            <>
              <Link to='/signup'><button className="login-button">회원가입</button></Link>
              <Link to="/login"><button className="login-button">로그인</button></Link>
            </>
          ) : (
            <>
              <div className="logged-in-status">
                <span className="user-chip flex items-center" aria-label="로그인 사용자">
                  {/* 마이페이지 or 관리자페이지 이동 */}
                  <Link to={isAdmin ? "/admin" : "/mypage"} className="nav-link">
                    <img src={myp} className="mypage w-5" />
                  </Link>
                  <span className='ml-1'>{displayName}님 접속중</span>
                </span>
                {/* <span className="hidden-sm">안전한 접속중</span> */}
                <span className="security-tag">
                  <Icon path={paths.shield} />
                  <span className="text-gray-700">보안</span>
                </span>
              </div>
              <button className="login-button" onClick={handleLogoutClick}>로그아웃</button>
            </>
          )}
        </div>
      </div>
    </header>
        // <header style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        //     <Link to="/" style={{ textDecoration: 'none', color: '#111827', fontWeight: 'bold', fontSize: '1.5rem' }}>
        //         MyBank
        //     </Link>
        //     <nav>
        //         {isLoggedIn && user ? (
        //             // 로그인 상태일 때
        //             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        //                 <span style={{ color: '#374151' }}>{user?.name || user?.id || user?.loginId}님, 환영합니다!</span>
        //                 <button onClick={handleLogoutClick} style={{ cursor: 'pointer', background: 'none', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
        //                     로그아웃
        //                 </button>
        //             </div>
        //         ) : (
        //             // 로그아웃 상태일 때
        //             <div style={{ display: 'flex', gap: '1rem' }}>
        //                 <Link to="/login" style={{ textDecoration: 'none', color: '#fff', backgroundColor: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>로그인</Link>
        //                 <Link to="/signup" style={{ textDecoration: 'none', color: '#fff', backgroundColor: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>회원가입</Link>
        //             </div>
        //         )}
        //     </nav>
        // </header >
    );
}