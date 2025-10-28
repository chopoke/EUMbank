
import { useState } from 'react';

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState([
    { 
      id: 1, 
      subject: '대출 신청 문의', 
      name: '김철수', 
      email: 'kim@example.com', 
      date: '2024-01-15', 
      status: 'Pending',
      content: '주택담보대출 신청 절차에 대해 문의드립니다.',
      response: ''
    },
    { 
      id: 2, 
      subject: '계좌 해지 요청', 
      name: '이영희', 
      email: 'lee@example.com', 
      date: '2024-01-14', 
      status: 'Resolved',
      content: '정기예금 계좌 해지를 원합니다.',
      response: '계좌 해지 절차를 안내해드렸습니다.'
    },
    { 
      id: 3, 
      subject: '신용 문제 상담', 
      name: '박민수', 
      email: 'park@example.com', 
      date: '2024-01-13', 
      status: 'In Progress',
      content: '신용등급 관련 문의사항이 있습니다.',
      response: ''
    }
  ]);

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInquiries = inquiries.filter(inquiry => 
    statusFilter === 'All' || inquiry.status === statusFilter
  );

  const updateInquiryStatus = (id, newStatus, responseText = '') => {
    setInquiries(inquiries.map(inquiry => 
      inquiry.id === id 
        ? { ...inquiry, status: newStatus, response: responseText }
        : inquiry
    ));
    setSelectedInquiry(null);
    setResponse('');
  };

  const handleResponseSubmit = () => {
    if (selectedInquiry && response.trim()) {
      updateInquiryStatus(selectedInquiry.id, 'Resolved', response);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return '대기중';
      case 'In Progress':
        return '처리중';
      case 'Resolved':
        return '완료';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">문의 관리</h2>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="All">전체 상태</option>
            <option value="Pending">대기중</option>
            <option value="In Progress">처리중</option>
            <option value="Resolved">완료</option>
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">제목</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">날짜</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-900 font-medium">{inquiry.subject}</td>
                    <td className="py-4 px-4 text-gray-600">{inquiry.name}</td>
                    <td className="py-4 px-4 text-gray-600">{inquiry.email}</td>
                    <td className="py-4 px-4 text-gray-600">{inquiry.date}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {getStatusText(inquiry.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="상세보기"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {inquiry.status === 'Pending' && (
                          <button
                            onClick={() => updateInquiryStatus(inquiry.id, 'In Progress')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="처리중으로 변경"
                          >
                            <i className="ri-time-line"></i>
                          </button>
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">문의 상세</h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">제목</label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInquiry.status)}`}>
                    {getStatusText(selectedInquiry.status)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.email}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">문의 내용</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{selectedInquiry.content}</p>
                </div>
              </div>
              
              {selectedInquiry.response && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">답변</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-gray-900">{selectedInquiry.response}</p>
                  </div>
                </div>
              )}
              
              {selectedInquiry.status !== 'Resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">답변 작성</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="답변을 입력하세요..."
                  ></textarea>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleResponseSubmit}
                      disabled={!response.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      답변 완료
                    </button>
                    <button
                      onClick={() => updateInquiryStatus(selectedInquiry.id, 'In Progress')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      처리중으로 변경
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
              <i className="ri-question-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 문의</p>
              <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
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
                {inquiries.filter(i => i.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <i className="ri-loader-line text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">처리중</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'In Progress').length}
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
              <p className="text-sm font-medium text-gray-600">완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'Resolved').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
