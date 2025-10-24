import { useState, useRef, useCallback } from 'react';

export default function IdentityModal({ type, onClose, onImageCapture }) {
  const [currentSide, setCurrentSide] = useState('front');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsRecording(true);
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      alert('카메라에 접근할 수 없습니다. 파일 업로드를 이용해주세요.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsRecording(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `id-card-${currentSide}.jpg`, { type: 'image/jpeg' });
            onImageCapture(currentSide, file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  }, [currentSide, onImageCapture, stopCamera]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageCapture(currentSide, file);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            {type === 'camera' ? '신분증 촬영' : '신분증 업로드'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-close-line text-xl"></i>
            </div>
          </button>
        </div>

        {/* 신분증 면 선택 */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">촬영할 면을 선택하세요</h4>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentSide('front')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer ${
                currentSide === 'front'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              앞면
            </button>
            <button
              onClick={() => setCurrentSide('back')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer ${
                currentSide === 'back'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              뒷면
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 sm:p-6">
          {type === 'camera' ? (
            <div className="space-y-4">
              {/* 카메라 뷰 */}
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {isRecording ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-camera-line text-xl sm:text-2xl"></i>
                      </div>
                      <p className="text-sm mb-4">카메라를 시작하려면 버튼을 클릭하세요</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                      >
                        카메라 시작
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 카메라 컨트롤 */}
              {isRecording && (
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={captureImage}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-camera-line"></i>
                    </div>
                    촬영하기
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-stop-line"></i>
                    </div>
                    중지
                  </button>
                </div>
              )}

              {/* 숨겨진 캔버스 */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 파일 업로드 영역 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-upload-cloud-line text-xl sm:text-2xl text-gray-400"></i>
                </div>
                <p className="text-sm text-gray-600 mb-4 px-4">
                  신분증 {currentSide === 'front' ? '앞면' : '뒷면'} 이미지를 업로드하세요
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                >
                  파일 선택
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* 안내사항 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">촬영 가이드</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 신분증 전체가 화면에 들어오도록 해주세요</li>
              <li>• 글자가 선명하게 보이도록 촬영해주세요</li>
              <li>• 빛 반사나 그림자가 없도록 주의해주세요</li>
              <li>• 신분증을 수평으로 바르게 놓고 촬영해주세요</li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 whitespace-nowrap cursor-pointer"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
