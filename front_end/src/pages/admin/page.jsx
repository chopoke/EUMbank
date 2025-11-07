
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LoanManagement from './components/LoanManagement';
import DepositManagement from './components/depositsaving/DepositManagement';
import UserManagement from './components/UserManagement';
import InquiryManagement from './components/InquiryManagement';
import Verification from './components/Verification';

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'loan':
        return <LoanManagement />;
      case 'deposit':
        return <DepositManagement />;
      case 'user':
        return <UserManagement />;
      case 'inquiry':
        return <InquiryManagement />;
      case 'verification':
        return <Verification />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="mx-auto w-[1280px] flex h-screen bg-gray-50">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header /> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
