// src/pages/admin/components/MyProductsManagement.jsx
import { useState, useEffect } from 'react';
import {
    getMyDeposits,
    changeDepositStatus,
    deleteDeposit
} from '../api/depositManagementApi';

import {
    getMyInstallments,
    changeInstallmentStatus,
    deleteInstallment
} from '../api/installmentManagementApi';

import StatusChangeModal from './StatusChangeModal';
import { getStatusStyle, getStatusText, getAvailableStatusChanges } from '../utils/statusUtils';

export default function MyProductsManagement({ activeType }) {
    const [myDeposits, setMyDeposits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    // 고객 번호 (실제로는 로그인한 사용자 정보에서 가져와야 함)
    const cNo = 3; // TODO: 실제 로그인 정보로 교체

    // 데이터 로드
    useEffect(() => {
        loadData();
    }, [activeType]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeType === '예금') {
                const data = await getMyDeposits(cNo);
                setMyDeposits(data);
            } else {
                const data = await getMyInstallments(cNo);
                setMyDeposits(data);
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 체크박스 전체 선택/해제
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(myDeposits.map(d => d.id));
        } else {
            setSelectedItems([]);
        }
    };

    // 개별 체크박스 선택
    const handleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    // 상태 변경 모달 열기
    const openStatusChangeModal = (deposit, status) => {
        if (status === deposit.status) return; // 같은 상태면 무시
        setSelectedDeposit(deposit);
        setNewStatus(status);
        setShowStatusChangeModal(true);
    };

    // 단일 상태 변경
    const handleStatusChange = async () => {
        if (!selectedDeposit) return;

        try {
            if (activeType === '예금') {
                await changeDepositStatus(selectedDeposit.id, newStatus);
            } else {
                await changeInstallmentStatus(selectedDeposit.id, newStatus);
            }

            // 로컬 상태 업데이트
            setMyDeposits(myDeposits.map(d =>
                d.id === selectedDeposit.id ? { ...d, status: newStatus } : d
            ));

            alert('상태가 변경되었습니다.');
        } catch (error) {
            console.error('상태 변경 실패:', error);
            alert('상태 변경에 실패했습니다.');
        } finally {
            setShowStatusChangeModal(false);
            setSelectedDeposit(null);
        }
    };

    // 일괄 상태 변경
    const handleBulkStatusChange = async (status) => {
        if (selectedItems.length === 0) {
            alert('변경할 상품을 선택해주세요.');
            return;
        }

        if (!window.confirm(`선택한 ${selectedItems.length}개 상품의 상태를 "${getStatusText(status)}"(으)로 변경하시겠습니까?`)) {
            return;
        }

        try {
            // 선택된 항목들의 상태 변경
            const promises = selectedItems.map(id => {
                if (activeType === '예금') {
                    return changeDepositStatus(id, status);
                } else {
                    return changeInstallmentStatus(id, status);
                }
            });

            await Promise.all(promises);

            // 로컬 상태 업데이트
            setMyDeposits(myDeposits.map(d =>
                selectedItems.includes(d.id) ? { ...d, status } : d
            ));

            setSelectedItems([]);
            alert('상태가 변경되었습니다.');
        } catch (error) {
            console.error('일괄 상태 변경 실패:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    // 일괄 삭제
    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            alert('삭제할 상품을 선택해주세요.');
            return;
        }

        if (!window.confirm(`선택한 ${selectedItems.length}개 상품을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const promises = selectedItems.map(id => {
                if (activeType === '예금') {
                    return deleteDeposit(id);
                } else {
                    return deleteInstallment(id);
                }
            });

            await Promise.all(promises);

            setMyDeposits(myDeposits.filter(d => !selectedItems.includes(d.id)));
            setSelectedItems([]);
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 단일 삭제
    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            if (activeType === '예금') {
                await deleteDeposit(id);
            } else {
                await deleteInstallment(id);
            }

            setMyDeposits(myDeposits.filter(d => d.id !== id));
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            {/* 일괄 작업 버튼 */}
            {selectedItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <i className="ri-checkbox-multiple-line text-blue-600 text-xl"></i>
                            <span className="text-blue-900 font-medium">{selectedItems.length}개 상품 선택됨</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleBulkStatusChange('ACTIVE')}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                <i className="ri-checkbox-circle-line mr-1"></i>
                                정상으로 변경
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('DORMANT')}
                                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                            >
                                <i className="ri-moon-line mr-1"></i>
                                휴면으로 변경
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('SUSPENDED')}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                <i className="ri-pause-circle-line mr-1"></i>
                                정지로 변경
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('TERMINATED')}
                                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            >
                                <i className="ri-close-circle-line mr-1"></i>
                                해지로 변경
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                                <i className="ri-delete-bin-line mr-1"></i>
                                삭제
                            </button>
                            <button
                                onClick={() => setSelectedItems([])}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                선택 해제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">전체</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{myDeposits.length}건</p>
                        </div>
                        <div className={`p-3 rounded-full ${activeType === '예금' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <i className={`ri-bank-line text-2xl ${activeType === '예금' ? 'text-red-600' : 'text-blue-600'}`}></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">정상</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {myDeposits.filter(d => d.status === 'ACTIVE').length}건
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">휴면</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {myDeposits.filter(d => d.status === 'DORMANT').length}건
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-100">
                            <i className="ri-moon-line text-2xl text-yellow-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">정지</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {myDeposits.filter(d => d.status === 'SUSPENDED').length}건
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-red-100">
                            <i className="ri-pause-circle-line text-2xl text-red-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* 가입 상품 테이블 */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">
                                    <input
                                        type="checkbox"
                                        checked={myDeposits.length > 0 && selectedItems.length === myDeposits.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">상품명</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">계좌번호</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">금액</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">금리</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">가입일</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">만기일</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">상태 변경</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {myDeposits.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <i className="ri-inbox-line text-4xl text-gray-400"></i>
                                            <p>가입한 {activeType} 상품이 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                myDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(deposit.id)}
                                                onChange={() => handleSelectItem(deposit.id)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 font-medium">{deposit.productName}</td>
                                        <td className="py-4 px-4 text-gray-600 font-mono text-sm">{deposit.accountNumber}</td>
                                        <td className="py-4 px-4 text-gray-900 font-semibold">{deposit.amount?.toLocaleString()}원</td>
                                        <td className="py-4 px-4">
                                            <span className="text-blue-600 font-semibold">{deposit.rate}%</span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">{deposit.startDate}</td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">{deposit.maturityDate}</td>
                                        <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(deposit.status)}`}>
                                                    {getStatusText(deposit.status)}
                                                </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <select
                                                value={deposit.status}
                                                onChange={(e) => openStatusChangeModal(deposit, e.target.value)}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value={deposit.status}>{getStatusText(deposit.status)}</option>
                                                {getAvailableStatusChanges(deposit.status).map(status => (
                                                    <option key={status} value={status}>
                                                        {getStatusText(status)}(으)로 변경
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => handleDelete(deposit.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="삭제"
                                            >
                                                <i className="ri-delete-bin-line text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 상태 변경 모달 */}
            <StatusChangeModal
                show={showStatusChangeModal}
                deposit={selectedDeposit}
                newStatus={newStatus}
                onConfirm={handleStatusChange}
                onClose={() => setShowStatusChangeModal(false)}
            />
        </>
    );
}