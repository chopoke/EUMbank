import React from 'react';
import '../resources/css/main.css';
import { Youtube, Instagram, Facebook  } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    

    return (
    <footer className="main-footer">
      {/* mx-auto max-w-screen-xl px-6 py-10 text-sm text-gray-600 */}
      <div className="content-container py-10 footer-content">
        {/* grid grid-cols-1 md:grid-cols-4 gap-6 */}
        <div className="footer-grid">
          <div className="footer-col">
            {/* font-medium text-gray-900 mb-2 */}
            <div className="footer-title">E-UMBank</div>
            <p>사업자등록번호 123-45-67890</p>
            <p>대표 ㈜이음은행</p>
          </div>
          <div className="footer-col">
            <div className="footer-title">약관</div>
            <ul className="footer-list">
              <li><Link to='/ftagree' className="hover-underline">전자금융거래약관</Link></li>
              <li><Link to='/ftprivacy' lassName="hover-underline">개인정보 처리방침</Link></li>
              <li><Link to='/ftdisclosure' className="hover-underline">경영공시</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-title">고객지원</div>
            <ul className="footer-list">
              {/* <li><a href="#faq" className="hover-underline">FAQ</a></li>
              <li><a href="#branch" className="hover-underline">지점/ATM 찾기</a></li>
              <li><a href="#contact" className="hover:underline">문의하기</a></li> */}
              <li>고객센터 02-000-0000</li>
              <li>평일 AM 09:30 ~ PM 06:30</li>
              <li>휴무 : 토,일요일 및 공휴일</li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-title">인증</div>
            <p>ISMS · 개인정보보호 인증</p>
            {/* mt-2 text-gray-500 */}
            <p className="copyright">© 2025 E-UMBank</p>
            <br></br>
            <div className='flex space-x-4'>
              <a href='https://www.youtube.com/' target='_blank' rel='noopener noreferrer'><Youtube size={26} strokeWidth={1.8} /></a>
              <a href='https://www.instagram.com/' target='_blank' rel='noopener noreferrer'><Instagram /></a>
              <a href='https://www.facebook.com/?locale=ko_KR/' target='_blank' rel='noopener noreferrer'><Facebook /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    );
}