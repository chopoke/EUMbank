import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../resources/css/main.css';
import mainlogo from '../resources/img/eumonly.png'

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

export function Footer({ isLoggedIn, user, onLogout }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        // 부모로부터 받은 onLogout 함수를 호출합니다.
        onLogout();
        // App.js의 onLogout에서 이미 navigate('/')를 처리하므로 여기서는 호출만 합니다.
    };

    return (
    <footer className="main-footer">
      {/* mx-auto max-w-screen-xl px-6 py-10 text-sm text-gray-600 */}
      <div className="content-container py-10 footer-content">
        {/* grid grid-cols-1 md:grid-cols-4 gap-6 */}
        <div className="footer-grid">
          <div className="footer-col">
            {/* font-medium text-gray-900 mb-2 */}
            <div className="footer-title">NeoBank</div>
            <p>사업자등록번호 123-45-67890</p>
            <p>대표 ㈜네오뱅크</p>
          </div>
          <div className="footer-col">
            <div className="footer-title">약관</div>
            <ul className="footer-list">
              <li><a href="#tos" className="hover-underline">전자금융거래약관</a></li>
              <li><a href="#privacy" className="hover-underline">개인정보 처리방침</a></li>
              <li><a href="#disclosure" className="hover-underline">경영공시</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-title">고객지원</div>
            <ul className="footer-list">
              <li><a href="#faq" className="hover-underline">FAQ</a></li>
              <li><a href="#branch" className="hover-underline">지점/ATM 찾기</a></li>
              <li><a href="#contact" className="hover:underline">문의하기</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-title">인증</div>
            <p>ISMS · 개인정보보호 인증</p>
            {/* mt-2 text-gray-500 */}
            <p className="copyright">© 2025 NeoBank</p>
          </div>
        </div>
      </div>
    </footer>
    );
}