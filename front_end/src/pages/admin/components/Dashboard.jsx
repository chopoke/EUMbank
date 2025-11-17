import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function Dashboard() {
  const [spotStats, setSpotStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpotStatistics = async () => {
      try {
        const response = await api.get('/api/admin/spot/statistics');
        setSpotStats(response.data);
      } catch (error) {
        console.error('현물 통계 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpotStatistics();
  }, []);

  const stats = [
    { title: 'Total Users', value: '1,200', icon: 'ri-user-line', color: 'text-blue-600' },
    { title: 'Active Loans', value: '350', icon: 'ri-file-list-line', color: 'text-green-600' },
    { title: 'Inquiry Resolution Rate', value: '80%', icon: 'ri-checkbox-circle-line', color: 'text-teal-600' },
    // 현물 통계 추가
    ...(spotStats ? [
      { 
        title: '현물 지갑 수', 
        value: spotStats.totalWalletCount?.toLocaleString() || '0', 
        icon: 'ri-wallet-line', 
        color: 'text-yellow-600' 
      },
      { 
        title: '금 보유량', 
        value: `${(spotStats.totalGoldBalance || 0).toLocaleString()}g`, 
        icon: 'ri-money-dollar-circle-line', 
        color: 'text-yellow-600' 
      },
      { 
        title: '은 보유량', 
        value: `${(spotStats.totalSilverBalance || 0).toLocaleString()}g`, 
        icon: 'ri-money-dollar-circle-line', 
        color: 'text-gray-600' 
      },
      { 
        title: '현물 총 자산', 
        value: `₩${(spotStats.totalSpotAssets || 0).toLocaleString()}`, 
        icon: 'ri-line-chart-line', 
        color: 'text-green-600' 
      }
    ] : [])
  ];

  const recentLoans = [
    { name: 'Jane Cooper', amount: '$26,000', date: '2024-01-15', status: 'Active' },
    { name: 'Cody Fisher', amount: '$16,000', date: '2024-01-12', status: 'Active' },
    { name: 'Dianne Russell', amount: '$6,000', date: '2024-01-01', status: 'Active' }
  ];

  const recentInquiries = [
    { subject: 'Loan Application', status: 'Pending' },
    { subject: 'Account Closure', status: 'Pending' },
    { subject: 'Credit Issue', status: 'Pending' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                <i className={`${stat.icon} text-2xl`}></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Loans</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <span>Name</span>
                <span>Amount</span>
                <span>Loan Date</span>
                <span>Status</span>
              </div>
              {recentLoans.map((loan, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 text-sm py-2">
                  <span className="text-gray-900">{loan.name}</span>
                  <span className="text-gray-900">{loan.amount}</span>
                  <span className="text-gray-600">{loan.date}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium w-fit">
                    {loan.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View All
              </button>
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Inquiries</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <span>Subject</span>
                <span>Status</span>
              </div>
              {recentInquiries.map((inquiry, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 text-sm py-2">
                  <span className="text-gray-900">{inquiry.subject}</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium w-fit">
                    {inquiry.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
