
import { useState } from 'react';

export default function Verification() {
  const [verifications, setVerifications] = useState([
    { 
      id: 1, 
      name: '김철수', 
      email: 'kim@example.com', 
      type: '신분증 인증', 
      date: '2024-01-15', 
      status: 'Pending',
      documents: ['신분증 앞면', '신분증 뒷면'],
      notes: ''
    },
    { 
      id: 2, 
      name: '이영희', 
      email: 'lee@example.com', 
      type: '소득증명서', 
      date: '2024-01-14', 
      status: 'Approved',
      documents: ['소득증명서', '재직증명서'],
      notes: '서류 확인 완료'
    },
    { 
      id: 3, 
      name: '박민수', 
      email: 'park@example.com', 
      type: '주소증명서', 
      date: '2024-01-13', 
      status: 'Rejected',
      documents: ['주민등록등본'],
      notes: '서류가 불분명하여 재제출 요청'
    }
  ]);

  const [selectedVerification, setSelectedVerification] = useState(null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredVerifications = verifications.filter(verification => 
    statusFilter === 'All' || verification.status === statusFilter
  );

  const updateVerificationStatus = (id, newStatus, noteText = '') => {
    setVerifications(verifications.map(verification => 
      verification.id === id 
        ? { ...verification, status: newStatus, notes: noteText }
        : verification
    ));
    setSelectedVerification(null);
    setNotes('');
  };

  const handleApprove = () => {
    if (selectedVerification) {
      updateVerificationStatus(selectedVerification.id, 'Approved', notes);
    }
  };

  const handleReject = () => {
    if (selectedVerification && notes.trim()) {
      updateVerificationStatus(selectedVerification.id, 'Rejected', notes);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return '대기중';
      case 'Approved':
        return '승인';
      case 'Rejected':
        return '거부';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">인증 관리</h2>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="All">전체 상태</option>
            <option value="Pending">대기중</option>
            <option value="Approved">승인</option>
            <option value="Rejected">거부</option>
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">인증 유형</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">신청일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-900 font-medium">{verification.name}</td>
                    <td className="py-4 px-4 text-gray-600">{verification.email}</td>
                    <td className="py-4 px-4 text-gray-600">{verification.type}</td>
                    <td className="py-4 px-4 text-gray-600">{verification.date}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                        {getStatusText(verification.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVerification(verification);
                            setNotes(verification.notes || '');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="상세보기"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {verification.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateVerificationStatus(verification.id, 'Approved')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="승인"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVerification(verification);
                                setNotes('');
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="거부"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">인증 상세</h3>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <p className="mt-1 text-gray-900">{selectedVerification.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVerification.status)}`}>
                    {getStatusText(selectedVerification.status)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <p className="mt-1 text-gray-900">{selectedVerification.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">인증 유형</label>
                  <p className="mt-1 text-gray-900">{selectedVerification.type}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">제출 서류</label>
                <div className="mt-1 space-y-2">
                  {selectedVerification.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{doc}</span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <i className="ri-download-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedVerification.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">처리 메모</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{selectedVerification.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedVerification.status === 'Pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">처리 메모</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="처리 사유나 메모를 입력하세요..."
                  ></textarea>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!notes.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      거부
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <i className="ri-shield-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 인증</p>
              <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <i className="ri-time-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기중</p>
              <p className="text-2xl font-bold text-gray-900">
                {verifications.filter(v => v.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <i className="ri-check-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인</p>
              <p className="text-2xl font-bold text-gray-900">
                {verifications.filter(v => v.status === 'Approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <i className="ri-close-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">거부</p>
              <p className="text-2xl font-bold text-gray-900">
                {verifications.filter(v => v.status === 'Rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
