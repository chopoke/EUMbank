import { useState } from 'react';
import IdentityModal from './IdentityModal';

export default function IdentityVerificationStep({ formData, updateFormData }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('camera');
  const [verificationStatus, setVerificationStatus] = useState({
    front: false,
    back: false
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleImageCapture = (side, file) => {
    updateFormData({
      [`idCard${side.charAt(0).toUpperCase() + side.slice(1)}`]: file
    });
    setVerificationStatus(prev => ({
      ...prev,
      [side]: true
    }));
    setShowModal(false);
  };

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">신분증 확인</h3>
      
      <div className="space-y-6">
        {/* 신분증 확인 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className="ri-alert-line text-yellow-600"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">신분증 확인 안내</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• 신분증 앞면과 뒷면을 모두 촬영해주세요</li>
                <li>• 신분증이 선명하게 보이도록 촬영해주세요</li>
                <li>• 빛 반사나 그림자가 없도록 주의해주세요</li>
                <li>• 촬영된 이미지는 본인 확인 후 즉시 삭제됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 신분증 촬영/업로드 */}
        <div className="space-y-4">
          {/* 앞면 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-800">신분증 앞면</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                verificationStatus.front 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {verificationStatus.front ? '완료' : '미완료'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOpenModal('camera')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <i className="ri-camera-line text-lg text-gray-600 mr-2"></i>
                <span className="text-sm font-medium text-gray-700">카메라로 촬영</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal('upload')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <i className="ri-upload-cloud-line text-lg text-gray-600 mr-2"></i>
                <span className="text-sm font-medium text-gray-700">파일 업로드</span>
              </button>
            </div>
          </div>

          {/* 뒷면 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-800">신분증 뒷면</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                verificationStatus.back 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {verificationStatus.back ? '완료' : '미완료'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOpenModal('camera')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <i className="ri-camera-line text-lg text-gray-600 mr-2"></i>
                <span className="text-sm font-medium text-gray-700">카메라로 촬영</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal('upload')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <i className="ri-upload-cloud-line text-lg text-gray-600 mr-2"></i>
                <span className="text-sm font-medium text-gray-700">파일 업로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* 진행 상황 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">진행 상황</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">신분증 앞면</span>
              <div className="flex items-center">
                {verificationStatus.front ? (
                  <i className="ri-check-line text-green-600 mr-1"></i>
                ) : (
                  <i className="ri-close-line text-red-500 mr-1"></i>
                )}
                <span className={verificationStatus.front ? 'text-green-600' : 'text-red-500'}>
                  {verificationStatus.front ? '완료' : '미완료'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">신분증 뒷면</span>
              <div className="flex items-center">
                {verificationStatus.back ? (
                  <i className="ri-check-line text-green-600 mr-1"></i>
                ) : (
                  <i className="ri-close-line text-red-500 mr-1"></i>
                )}
                <span className={verificationStatus.back ? 'text-green-600' : 'text-red-500'}>
                  {verificationStatus.back ? '완료' : '미완료'}
                </span>
              </div>
            </div>
          </div>
          
          {verificationStatus.front && verificationStatus.back && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-check-line text-green-600 mr-2"></i>
                <span className="text-sm text-green-800 font-medium">
                  신분증 확인이 완료되었습니다!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 개인정보 보호 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className="ri-shield-check-line text-blue-600"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800 mb-1">개인정보 보호</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                촬영된 신분증 이미지는 본인 확인 목적으로만 사용되며, 
                확인 완료 후 즉시 안전하게 삭제됩니다. 
                개인정보보호법에 따라 안전하게 처리됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 신분증 촬영/업로드 모달 */}
      {showModal && (
        <IdentityModal
          type={modalType}
          onClose={handleCloseModal}
          onImageCapture={handleImageCapture}
        />
      )}
    </div>
  );
}
