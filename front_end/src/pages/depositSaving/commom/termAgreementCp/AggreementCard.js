import { useRef, useEffect } from 'react';

/**
 * 약관 내용을 보여주는 모달 컴포넌트
 */
const AggreementCard = ({ open, title, onClose, onReadComplete, clauseId, children }) => {
    const boxRef = useRef(null);

    // 스크롤 이벤트를 감지하여 끝에 도달하면 onReadComplete 콜백을 실행
    useEffect(() => {
        if (!open) return;
        const element = boxRef.current;
        if (!element) return;

        const handleScroll = () => {
            // 스크롤이 맨 아래에 도달했는지 확인 (2px 여유)
            const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
            if (isAtBottom) {
                onReadComplete?.(clauseId);
            }
        };

        // 스크롤바가 없는 경우를 위한 초기 체크
        const checkScrollable = () => {
            if (element.scrollHeight <= element.clientHeight) {
                onReadComplete?.(clauseId);
            }
        }

        element.addEventListener("scroll", handleScroll);
        checkScrollable(); // 처음 열렸을 때도 체크

        return () => element.removeEventListener("scroll", handleScroll);
    }, [open, onReadComplete, clauseId]);

    if (!open) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h4>{title}</h4>
                    <button onClick={onClose} className="close-button">닫기</button>
                </div>
                <div ref={boxRef} className="modal-body">
                    <pre>{children}</pre>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default AggreementCard;