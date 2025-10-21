import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../resources/css/main.css';
import mainacc from '../resources/img/acc_fin.png'
import { goToAccountOpenPage } from "./account/utils/navigations";


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

// 목업 데이터 (생략)
const mockSummary = {


  profile: { name: "현빈" },
  accounts: [
    { id: "acc-1", name: "입출금통장", balance: 18203450, currency: "KRW" },
    { id: "acc-2", name: "자유적금", balance: 3200000, currency: "KRW" },
  ],
  recentTx: [
    { id: "tx1", date: "2025-09-20", desc: "편의점", amount: -4500 },
    { id: "tx2", date: "2025-09-19", desc: "급여", amount: 2800000 },
    { id: "tx3", date: "2025-09-18", desc: "교통카드", amount: -1250 },
  ],
  cards: [{ id: "card-1", due: "10/25", amount: 452000 }],
  loans: [{ id: "loan-1", nextDue: "10/15", amount: 320000 }],
  fx: [
    { pair: "USD/KRW", rate: 1385.20, updatedAt: "09:30" },
    { pair: "JPY/KRW", rate: 9.18, updatedAt: "09:30" },
    { pair: "EUR/KRW", rate: 1501.45, updatedAt: "09:30" },
  ],
  notices: [
    { id: "n1", type: "security", title: "스미싱 경보: 은행 사칭 문자 주의", link: "#" },
    { id: "n2", type: "maintenance", title: "9/30(일) 01:00~03:00 시스템 점검", link: "#" },
  ],
};

function formatWon(n) {
  try {
    return n.toLocaleString("ko-KR");
  } catch {
    return String(n);
  }
}

const Hero = ({ isLoggedIn, name }) => {
  const navigate = useNavigate();

  return (
    // relative overflow-hidden
    <section className="hero-section">
      {/* mx-auto max-w-screen-xl px-6 py-12 md:py-14 */}
      <div className="content-container py-12 md:py-14">
        {!isLoggedIn ? (
          // grid grid-cols-12 gap-8 items-center
          <div className="hero-grid">
            {/* col-span-12 md:col-span-7 space-y-4 */}
            <div className="hero-text-area">
              {/* text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 */}
              <h1 className="hero-title">
                3분만에 비대면 계좌개설
              </h1>
              {/* text-gray-600 */}
              <p className="hero-subtitle">수수료 우대, 간편한 인증으로 시작하세요.</p>
              {/* flex flex-wrap gap-3 pt-2 */}
              <div className="hero-actions">
                {/* rounded-full bg-blue-700 text-white px-6 py-3 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 */}
                <button className="primary-button-lg" onClick={() => goToAccountOpenPage(navigate)}>지금 개설하기</button>
                {/* rounded-full border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 */}
                <button className="secondary-button-lg">금리 보기</button>
              </div>
            </div>
            {/* col-span-12 md:col-span-5 */}
            <div className="hero-image-col">
              {/* aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center */}
              <div className="hero-image-placeholder">
                {/* <Icon path={paths.bank} /> */}
                <img src={mainacc} className="mainacc" />
              </div>
            </div>
          </div>
        ) : (
          // grid grid-cols-12 gap-8 items-center
          <div className="hero-grid">
            {/* col-span-12 md:col-span-7 space-y-4 */}
            <div className="hero-text-area">
              {/* text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 */}
              <h2 className="hero-logged-in-title">{name}님, 좋은 하루 되세요</h2>
              {/* text-gray-600 */}
              <p className="hero-subtitle">자주 쓰는 이체 대상에 빠르게 송금하세요.</p>
              {/* flex flex-wrap gap-2 */}
              <div className="quick-transfer-tags">
                {["김가나", "이다라", "박마바"].map((n) => (
                  // rounded-full border px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600
                  <button key={n} className="quick-transfer-tag-button">{n} 바로이체</button>
                ))}
              </div>
            </div>
            {/* col-span-12 md:col-span-5 */}
            <div className="hero-transfer-col">
              {/* rounded-2xl border bg-white p-4 shadow */}
              <div className="quick-transfer-card">
                {/* flex items-center justify-between */}
                <div className="card-header-icon">
                  <div className="font-medium">빠른 이체</div>
                  <Icon path={paths.send} />
                </div>
                {/* mt-3 grid grid-cols-2 gap-3 */}
                <div className="quick-transfer-form-grid">
                  {/* w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 */}
                  <select className="transfer-input">
                    <option>입출금통장</option>
                    <option>자유적금</option>
                  </select>
                  {/* w-full rounded-lg border px-3 py-2 text-sm */}
                  <input className="transfer-input" placeholder="보낼 금액" />
                </div>
                {/* mt-3 w-full rounded-lg bg-blue-700 text-white py-2 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 */}
                <button className="quick-transfer-button">이체</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();

  const items = [
    { id: "transfer", label: "계좌이체", icon: paths.send, href: "/transfer"  },
    { id: "bill", label: "공과금", icon: paths.bill, href: "/" },
    { id: "asset", label: "자산관리", icon: paths.chart, href: "/" },
    { id: "loan", label: "대출", icon: paths.loan, href: "/loan/products" },
    { id: "fx", label: "외화", icon: paths.fx, href: "/foreign/rate" },
    { id: "spot", label: "현물", icon: paths.card, href: "/" },
    { id: "deposit", label: "예적금가입", icon: paths.bank, href: "/depositSavingProductList/open" },
    { id: "mypage", label: "마이페이지", icon: paths.arrowR, href: "/mypage" },
  ];

  const handleActionClick = (href) => {
    if (href) {
      navigate(href);
    } else {
      alert("이 기능은 현재 준비 중입니다.");
    }
  };

  return (
    <section aria-labelledby="quick-actions" className="quick-actions-section">
      <div className="content-container py-8">
        <h3 id="quick-actions" className="sr-only">빠른 업무</h3>
        <div className="quick-actions-grid">
          {items.map((it) => (
            <button
              key={it.id}
              className="quick-actions-item"
              onClick={() => handleActionClick(it.href)}
            >
              <div className="quick-actions-content">
                <span className="quick-actions-icon"><Icon path={it.icon} /></span>
                <span className="quick-actions-label">{it.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const AccountSnapshot = ({ summary }) => {
  const total = useMemo(() => summary.accounts.reduce((a, b) => a + b.balance, 0), [summary.accounts]);
  return (
    <section className="account-snapshot-section">
      {/* mx-auto max-w-screen-xl px-6 py-10 */}
      <div className="content-container py-10">
        {/* grid grid-cols-12 gap-6 */}
        <div className="snapshot-grid">
          {/* col-span-12 lg:col-span-8 */}
          <div className="snapshot-main-col">
            {/* rounded-2xl border bg-white p-5 shadow-sm */}
            <div className="snapshot-card main-card">
              {/* flex items-center justify-between */}
              <div className="card-header">
                <div>
                  {/* text-lg font-semibold text-gray-900 */}
                  <h4 className="card-title">자산 스냅샷</h4>
                  {/* text-sm text-gray-500 */}
                  <p className="card-subtitle">총자산 <b className="card-subtitle-highlight">₩{formatWon(total)}</b></p>
                </div>
                {/* text-sm text-blue-700 hover:underline */}
                <button className="text-link">계좌관리</button>
              </div>
              {/* 계좌 탭(간단 표시) */}
              {/* mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 */}
              <div className="account-list-grid">
                {summary.accounts.map((acc) => (
                  // rounded-xl border p-4
                  <div key={acc.id} className="account-item">
                    {/* text-sm text-gray-500 */}
                    <div className="account-name">{acc.name}</div>
                    {/* mt-1 text-xl font-semibold */}
                    <div className="account-balance">₩{formatWon(acc.balance)}</div>
                    {/* mt-3 inline-flex items-center gap-2 text-sm text-blue-700 hover:underline */}
                    <button className="text-link with-icon">
                      상세보기 <Icon path={paths.arrowR} />
                    </button>
                  </div>
                ))}
              </div>
              {/* 최근 거래 */}
              {/* mt-6 */}
              <div className="recent-transactions">
                {/* flex items-center justify-between mb-2 */}
                <div className="card-header small">
                  {/* font-medium */}
                  <h5 className="card-title-small">최근 입출내역</h5>
                  {/* text-sm text-blue-700 hover:underline */}
                  <a href="#tx" className="text-link">더보기</a>
                </div>
                {/* divide-y text-sm */}
                <ul className="transaction-list">
                  {summary.recentTx.map((t) => (
                    // flex items-center justify-between py-2
                    <li key={t.id} className="transaction-item">
                      {/* flex items-center gap-3 */}
                      <div className="transaction-detail">
                        {/* text-gray-500 w-24 */}
                        <span className="transaction-date">{t.date}</span>
                        {/* text-gray-800 */}
                        <span className="transaction-desc">{t.desc}</span>
                      </div>
                      <span className={"transaction-amount " + (t.amount < 0 ? "negative" : "positive")}>
                        {t.amount < 0 ? "-" : "+"}₩{formatWon(Math.abs(t.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* col-span-12 lg:col-span-4 space-y-6 */}
          <div className="snapshot-side-col">
            {/* rounded-2xl border bg-white p-5 shadow-sm */}
            <div className="snapshot-card side-card">
              {/* flex items-center justify-between mb-2 */}
              <div className="card-header-icon small">
                <div className="font-medium">카드 결제 예정</div>
                <Icon path={paths.card} />
              </div>
              {/* text-2xl font-semibold */}
              <div className="side-card-value">₩{formatWon(summary.cards[0].amount)}</div>
              {/* text-sm text-gray-500 */}
              <div className="card-subtitle">결제일 {summary.cards[0].due}</div>
            </div>
            {/* rounded-2xl border bg-white p-5 shadow-sm */}
            <div className="snapshot-card side-card">
              {/* flex items-center justify-between mb-2 */}
              <div className="card-header-icon small">
                <div className="font-medium">대출 상환 예정</div>
                <Icon path={paths.loan} />
              </div>
              {/* text-2xl font-semibold */}
              <div className="side-card-value">₩{formatWon(summary.loans[0].amount)}</div>
              {/* text-sm text-gray-500 */}
              <div className="card-subtitle">상환일 {summary.loans[0].nextDue}</div>
            </div>
            {/* rounded-2xl border bg-white p-5 shadow-sm */}
            <div className="snapshot-card side-card">
              {/* flex items-center justify-between mb-3 */}
              <div className="card-header-icon small">
                <div className="font-medium">이번달 지출 인사이트</div>
                <Icon path={paths.chart} />
              </div>
              {/* text-sm text-gray-600 */}
              <div className="insight-text">카테고리 Top3: 식비 · 교통 · 쇼핑</div>
              {/* mt-2 h-16 w-full rounded bg-gray-100 */}
              <div className="insight-chart-placeholder" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RateFxTicker = ({ fx }) => (
  // aria-labelledby="rate-fx" className="border-y bg-white"
  <section aria-labelledby="rate-fx" className="fx-ticker-section">
    {/* mx-auto max-w-screen-xl px-6 py-4 */}
    <div className="content-container py-4">
      {/* flex items-center justify-between */}
      <div className="fx-ticker-header">
        {/* font-medium text-gray-900 */}
        <h6 id="rate-fx" className="fx-ticker-title">오늘의 환율</h6>
        {/* text-sm text-blue-700 hover:underline */}
        <a href="#fxmore" className="text-link">더보기</a>
      </div>
      {/* mt-3 grid grid-cols-3 gap-4 text-sm */}
      <div className="fx-list-grid">
        {fx.map((r) => (
          // rounded-xl border p-3 flex items-center justify-between
          <div key={r.pair} className="fx-rate-item">
            {/* text-gray-700 */}
            <span className="fx-pair">{r.pair}</span>
            {/* font-semibold */}
            <span className="fx-rate">{r.rate}</span>
            {/* text-gray-400 */}
            <span className="fx-time">{r.updatedAt} 기준</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SecurityBanner = ({ notices }) => (
  // aria-labelledby="security" className="bg-amber-50 border-y border-amber-200"
  <section aria-labelledby="security" className="security-banner-section">
    {/* mx-auto max-w-screen-xl px-6 py-4 */}
    <div className="content-container py-4">
      <h6 id="security" className="sr-only">보안 및 공지</h6>
      {/* flex flex-col gap-2 */}
      <div className="notice-list-flex">
        {notices.map((n) => (
          // flex items-center gap-2 text-sm
          <a key={n.id} href={n.link} className="notice-item">
            {/* inline-flex items-center justify-center rounded-full bg-amber-200 text-amber-900 w-6 h-6 */}
            <span className={`notice-icon ${n.type}`}>
              {n.type === "security" ? "!" : "i"}
            </span>
            {/* text-amber-900 hover:underline */}
            <span className="notice-title">{n.title}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

// 펀드 중심/자산관리 중심 전환 플래그
function FundSpotlight() {
  return (
    <section id="fund" className="fund-spotlight-section">
      {/* mx-auto max-w-screen-xl px-6 py-10 */}
      <div className="content-container py-10">
        {/* flex items-center justify-between */}
        <div className="section-header">
          <h4 className="card-title">예/적금 스포트라이트</h4>
          <a href="#" className="text-link">모든 예/적금 보기</a>
        </div>
        {/* mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 */}
        <div className="fund-grid">
          {[1, 2, 3].map((i) => (
            // rounded-2xl border p-4
            <div key={i} className="fund-item">
              {/* text-sm text-gray-500 */}
              <div className="fund-type">액티브 주식형</div>
              {/* mt-1 text-lg font-semibold */}
              <div className="fund-name">Neo 성장주 적금 {i}호</div>
              {/* mt-2 text-sm text-gray-600 */}
              <div className="fund-return">1년 수익률 <b className="fund-return-positive">+8.4%</b></div>
              {/* mt-3 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline */}
              <button className="text-link with-icon small">상세보기 <Icon path={paths.arrowR} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WealthHubSummary() {
  // bg-gray-50
  return (
    <section id="wealth" className="wealth-hub-section">
      {/* mx-auto max-w-screen-xl px-6 py-10 */}
      <div className="content-container py-10">
        <h4 className="card-title">자산관리 허브</h4>
        {/* mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 */}
        <div className="wealth-grid">
          {/* rounded-2xl border bg-white p-5 */}
          <div className="wealth-card">
            {/* text-sm text-gray-500 */}
            <div className="card-subtitle">포트폴리오 요약</div>
            {/* mt-1 text-2xl font-semibold */}
            <div className="wealth-value">₩48,230,000</div>
            {/* text-sm text-gray-600 */}
            <div className="wealth-change">전일 대비 <span className="wealth-change-positive">+0.6%</span></div>
          </div>
          {/* rounded-2xl border bg-white p-5 */}
          <div className="wealth-card">
            <div className="card-subtitle">목표 달성도</div>
            {/* mt-2 h-3 w-full rounded bg-gray-100 */}
            <div className="progress-bar-bg">
              {/* h-3 w-2/3 rounded bg-blue-600 */}
              <div className="progress-bar-fill" style={{ width: '66%' }} aria-label="66%"></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">내집 마련 66%</div>
          </div>
          {/* rounded-2xl border bg-white p-5 */}
          <div className="wealth-card">
            <div className="card-subtitle">리밸런싱 제안</div>
            {/* mt-2 list-disc pl-5 text-sm text-gray-700 */}
            <ul className="rebalance-list">
              <li>국내채권 +10% 확대</li>
              <li>현금성 -5% 축소</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}



// export default function BankHome() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const summary = mockSummary;
//   const focus = "wealth"; // 'fund' or 'wealth'
//   const navigate = useNavigate();
//   // 5. isLoggedIn 상태가 변경될 때마다 이 코드가 실행됩니다.
//   useEffect(() => {
//     // 만약 isLoggedIn이 true가 되면 /login 페이지로 이동합니다.
//     if (isLoggedIn) {
//       navigate('/login');
//     }
//   }, [isLoggedIn, navigate]);
//   return (
//     // min-h-dvh bg-white text-gray-900
//     <div className="bank-home-page">
//       {/* sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-700 text-white px-3 py-2 rounded */}
//       <a href="#main" className="skip-nav-link">본문 바로가기</a>
//       <Header isLoggedIn={isLoggedIn} onLogin={() => setIsLoggedIn(true)} />
//       <main id="main">
//         <Hero isLoggedIn={isLoggedIn} name={summary.profile.name} />
//         <QuickActions />
//         {isLoggedIn && <AccountSnapshot summary={summary} />}

//         {focus === "fund" && <FundSpotlight />}
//         {focus === "wealth" && <WealthHubSummary />}
//         <RateFxTicker fx={summary.fx} />
//         <SecurityBanner notices={summary.notices} />
//       </main>
//       <Footer />
//     </div>
//   );
// }
export default function BankHome({ user }) {
  const summary = mockSummary;

  const isLoggedIn = !!user;

  return (
    <div className="bank-home-page">
      <a href="#main" className="skip-nav-link">본문 바로가기</a>
      <main id="main">
        <Hero name={user?.name || user?.id || user?.loginId} />
        <QuickActions />

        <AccountSnapshot summary={summary} />
        <FundSpotlight />
        <WealthHubSummary />
        <RateFxTicker fx={summary.fx} />
        <SecurityBanner notices={summary.notices} />

      </main>
    </div>
  );
}