// src/pages/admin/components/StatusChangeModal.jsx
import { getStatusStyle, getStatusText, getStatusIcon } from '../utils/statusUtils';

export default function StatusChangeModal({ show, deposit, newStatus, onConfirm, onClose }) {
    if (!show || !deposit) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${getStatusStyle(newStatus)}`}>
                        <i className={`${getStatusIcon(newStatus)} text-3xl`}></i>
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">
                    상태 변경 확인
                </h3>
                <p className="text-gray-600 text-center mb-6">
                    <strong>{deposit.productName}</strong> 상품의 상태를<br />
                    <span className={`px-2 py-1 rounded ${getStatusStyle(deposit.status)}`}>
                        {getStatusText(deposit.status)}
                    </span>
                    {' → '}
                    <span className={`px-2 py-1 rounded ${getStatusStyle(newStatus)}`}>
                        {getStatusText(newStatus)}
                    </span>
                    (으)로 변경하시겠습니까?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">계좌번호:</span> {deposit.accountNumber}</p>
                        <p><span className="text-gray-500">금액:</span> {deposit.amount?.toLocaleString()}원</p>
                        <p><span className="text-gray-500">금리:</span> {deposit.rate}%</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        변경
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
}