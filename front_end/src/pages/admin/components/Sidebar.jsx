import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ activeMenu, setActiveMenu }) {
  const navigate = useNavigate();

  // 목적지 매핑
  const ADMIN_URL = "http://localhost:8081";
  const targets = {
    dashboard: `${ADMIN_URL}/admin/dashboard`,
    loan:      `${ADMIN_URL}/admin/loan`,
    user:      `${ADMIN_URL}/admin/user`,
    verification: `${ADMIN_URL}/admin/verification`,
    // deposit은 React로 유지
    deposit:   "/admin",
  };

  const handleClick = (id) => {
    setActiveMenu?.(id);
    if (id === "deposit") {
      // React 내부 라우팅
      navigate(targets.deposit);
    } else {
      // 타임리프로 전체 페이지 이동
      window.location.href = targets[id];
    }
  };

  const menuItems = [
    { id: "dashboard", label: "대시보드(전체)", icon: "ri-dashboard-line" },
    { id: "loan",      label: "대출 관리",      icon: "ri-bank-line" },
    { id: "deposit",   label: "예/적금 관리",   icon: "ri-safe-line" },
    { id: "user",      label: "회원관리",       icon: "ri-user-line" },
    { id: "verification", label: "인증관리",    icon: "ri-shield-check-line" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
              activeMenu === item.id
                ? "bg-blue-50 border-r-4 border-blue-500 text-blue-600"
                : "text-gray-600"
            }`}
          >
            <i className={`${item.icon} text-xl mr-3`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
