// src/pages/bills/components/PinVerifyModal.jsx
import Modal from "../../account/component/pinConponent/Modal";
import { PinPadModal } from "../../account/component/pinConponent/PinPadModal";

/**
 * 공통 PIN 확인 모달
 * - open: 열림 여부
 * - title: 모달 헤더 제목
 * - description: 안내 문구
 * - length: PIN 자릿수 (기본 6)
 * - loading: API 진행 중일 때 true
 * - onConfirm(pin): PIN 완성되었을 때 호출 (Promise 반환 가능)
 * - onClose(): 닫기
 */
export default function PinVerifyModal({
  open,
  title = "결제 PIN 번호 확인",
  description = "보안을 위해 결제 PIN 번호를 한 번 더 확인합니다.",
  length = 6,
  loading = false,
  onConfirm,
  onClose,
}) {
  const handleSubmit = async (pin) => {
    // PinPadModal 안에서 Promise.resolve(onSubmit(...))을 호출하므로
    // 여기서 에러를 throw/reject 하면 PinPadModal이 digits를 초기화함
    await onConfirm(pin);
  };

  return (
    <Modal open={open} close={onClose} header={title}>
      <div className="space-y-4">
        {description && (
          <p className="text-sm text-gray-600 mb-2">
            {description}
          </p>
        )}

        <PinPadModal
          length={length}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />

        {loading && (
          <p className="text-xs text-gray-500 text-center mt-2">
            처리 중입니다…
          </p>
        )}
      </div>
    </Modal>
  );
}
