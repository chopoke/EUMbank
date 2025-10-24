import React, { useRef, useEffect, useState } from 'react';

const PdfSignatureModal = ({ onClose, onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // 캔버스 크기 설정
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // 선 스타일 설정
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        setIsDrawing(true);
        setIsEmpty(false);

        ctx.beginPath();
        ctx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        ctx.lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleCompleteSignature = () => {
        if (isEmpty) {
            alert('서명을 먼저 해주세요.');
            return;
        }

        // 서명 이미지를 데이터 URL로 저장 (필요시)
        const canvas = canvasRef.current;
        const signatureData = canvas.toDataURL('image/png');
        console.log('서명 데이터:', signatureData);

        onSave();
    };

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            width: '90%',
            maxWidth: '800px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #ccc',
            paddingBottom: '10px',
            marginBottom: '10px',
        },
        closeButton: {
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
        },
        pdfViewer: {
            flex: 1,
            border: '1px solid #e0e0e0',
            marginBottom: '10px',
            backgroundColor: '#f8f8f8',
            borderRadius: '4px',
            overflow: 'hidden',
        },
        iframe: {
            width: '100%',
            height: '100%',
            border: 'none',
        },
        signatureTitle: {
            marginBottom: '8px',
            fontWeight: '500',
            fontSize: '14px',
        },
        signatureCanvas: {
            border: '1px dashed #aaa',
            borderRadius: '4px',
            width: '100%',
            height: '150px',
            cursor: 'crosshair',
            backgroundColor: 'white',
            touchAction: 'none',
        },
        buttonContainer: {
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
        },
        button: {
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3>상품 약관 확인 및 전자 서명</h3>
                    <button onClick={onClose} style={modalStyles.closeButton}>&times;</button>
                </div>

                {/* PDF 뷰어 */}
                <div style={modalStyles.pdfViewer}>
                    <iframe
                        src="/sample.pdf"
                        style={modalStyles.iframe}
                        title="약관 문서"
                    />
                </div>

                {/* 서명 캔버스 */}
                <div style={modalStyles.signatureTitle}>
                    아래 영역에 서명해주세요:
                </div>
                <canvas
                    ref={canvasRef}
                    style={modalStyles.signatureCanvas}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />

                {/* 버튼 */}
                <div style={modalStyles.buttonContainer}>
                    <button
                        onClick={handleClearSignature}
                        style={{ ...modalStyles.button, backgroundColor: '#f0f0f0' }}
                    >
                        다시 서명
                    </button>
                    <button
                        onClick={handleCompleteSignature}
                        style={{ ...modalStyles.button, backgroundColor: '#007bff', color: 'white' }}
                    >
                        서명 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfSignatureModal;