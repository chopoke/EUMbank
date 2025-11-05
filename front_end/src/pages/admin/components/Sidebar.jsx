
export default function Sidebar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드(전체)', icon: 'ri-dashboard-line' },
    { id: 'loan', label: '대출 관리', icon: 'ri-bank-line' },
    { id: 'deposit', label: '예/적금 관리', icon: 'ri-safe-line' },
    { id: 'user', label: '회원관리', icon: 'ri-user-line' },
    // { id: 'inquiry', label: 'Inquiry Management', icon: 'ri-question-line' },
    { id: 'verification', label: '인증관리', icon: 'ri-shield-check-line' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
              activeMenu === item.id ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            <i className={`${item.icon} text-xl mr-3`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
