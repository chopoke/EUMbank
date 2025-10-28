
import { useState } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', joinDate: '2024-01-15', status: 'Active', verificationStatus: 'Verified' },
    { id: 2, name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', joinDate: '2024-01-12', status: 'Active', verificationStatus: 'Pending' },
    { id: 3, name: '박민수', email: 'park@example.com', phone: '010-3456-7890', joinDate: '2024-01-10', status: 'Inactive', verificationStatus: 'Verified' },
    { id: 4, name: '최지은', email: 'choi@example.com', phone: '010-4567-8901', joinDate: '2024-01-08', status: 'Active', verificationStatus: 'Rejected' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleUserStatus = (id) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    ));
  };

  const updateVerificationStatus = (id, newStatus) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, verificationStatus: newStatus }
        : user
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="회원 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="All">전체 상태</option>
              <option value="Active">활성</option>
              <option value="Inactive">비활성</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">전화번호</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">가입일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">인증상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-900 font-medium">{user.name}</td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-4 px-4 text-gray-600">{user.joinDate}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.verificationStatus === 'Verified' 
                          ? 'bg-green-100 text-green-800' 
                          : user.verificationStatus === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.verificationStatus === 'Verified' ? '인증완료' : 
                         user.verificationStatus === 'Pending' ? '대기중' : '거부됨'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="상태 변경"
                        >
                          <i className="ri-toggle-line"></i>
                        </button>
                        {user.verificationStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateVerificationStatus(user.id, 'Verified')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="인증 승인"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => updateVerificationStatus(user.id, 'Rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="인증 거부"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <i className="ri-eye-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <i className="ri-user-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 회원</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <i className="ri-user-check-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 회원</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <i className="ri-time-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">인증 대기</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.verificationStatus === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
              <i className="ri-shield-check-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">인증 완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.verificationStatus === 'Verified').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
