import React, { useRef, useEffect, useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

const PdfSignatureModal = ({ onClose, onSave, href }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ 미리보기 상태를 관리할 state 추가
    const [previewUrl, setPreviewUrl] = useState(null);
    const [finalPdfData, setFinalPdfData] = useState(null);

    useEffect(() => {
        // 컴포넌트가 언마운트될 때 생성된 URL 해제하여 메모리 누수 방지
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        // ✅ canvas가 실제로 존재하는지 확인하는 가드(Guard) 추가
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            //ctx.fillStyle = 'white';
            //ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [previewUrl]);

    const getEventCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

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
        
        // 배경을 다시 흰색으로 채우기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        setIsEmpty(true);
    };

    // ✅ '서명 완료' 버튼 클릭 시, 미리보기 생성 로직으로 변경
    const handleGeneratePreview = async () => {
        if (isEmpty) {
            alert('서명을 먼저 해주세요.');
            return;
        }
        setIsLoading(true);

        try {
            const templatePdfPath = href ? `${href}/sample.pdf` : '/deposit/sample.pdf';
            const existingPdfBytes = await fetch(templatePdfPath).then(res => res.arrayBuffer());
            const signatureImageBytes = await new Promise(resolve => {
                canvasRef.current.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(new Uint8Array(reader.result));
                    reader.readAsArrayBuffer(blob);
                }, 'image/png');
            });

            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            const pages = pdfDoc.getPages();

            if (pages.length > 0) {
                const firstPage = pages[0];
                firstPage.drawImage(signatureImage, {
                    x: firstPage.getWidth() / 2 - (-90),
                    y: 60,
                    width: 150,
                    height: 75,
                });
            }

            const finalPdfBytes = await pdfDoc.save();
            const signedPdfBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            
            // ✅ 부모로 전달할 최종 데이터 저장
            const signatureData = {
                signedPdfBlob: signedPdfBlob,
                signatureDate: new Date().toLocaleDateString('ko-KR'),
                templatePdfPath: templatePdfPath,
                timestamp: Date.now()
            };
            setFinalPdfData(signatureData);

            // ✅ 생성된 PDF Blob으로 미리보기 URL 생성
            const url = URL.createObjectURL(signedPdfBlob);
            setPreviewUrl(url);

        } catch (error) {
            console.error('미리보기 생성 중 오류 발생:', error);
            alert('처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ '최종 확인' 버튼 클릭 시, 부모 컴포넌트로 데이터 전달 및 모달 닫기
    const handleConfirmSignature = () => {
        if (onSave && finalPdfData) {
            onSave(finalPdfData);
        }
        alert('서명이 최종 확인되었습니다.');
        onClose();
    };

    // ✅ '다시 서명' 버튼 클릭 시, 미리보기 모드 해제
    const handleRedoSignature = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFinalPdfData(null);
        setIsEmpty(true); // 캔버스 비움 상태로 초기화
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
                    <h3>{previewUrl ? '서명 미리보기' : '상품 약관 확인 및 전자 서명'}</h3>
                    <button onClick={onClose} style={modalStyles.closeButton}>&times;</button>
                </div>

                {/* PDF 뷰어 */}
                <div style={modalStyles.pdfViewer}>
                    <iframe
                        // ✅ 미리보기 URL이 있으면 그것을, 없으면 원본 PDF를 보여줌
                        src={previewUrl || (href ? `${href}/sample.pdf` : '/deposit/sample.pdf')}
                        style={modalStyles.iframe}
                        title={previewUrl ? "서명 미리보기" : "약관 문서"}
                    />
                </div>

                {/* ✅ 미리보기 상태가 아닐 때만 서명 캔버스를 보여줌 */}
                {!previewUrl && (
                    <>
                        <div style={modalStyles.signatureTitle}>아래 영역에 서명해주세요:</div>
                        <canvas
                            ref={canvasRef}
                            style={modalStyles.signatureCanvas}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </>
                )}

                {/* ✅ 버튼 컨테이너: 미리보기 상태에 따라 다른 버튼들을 보여줌 */}
                <div style={modalStyles.buttonContainer}>
                    {previewUrl ? (
                        <>
                            <button onClick={handleRedoSignature} style={{ ...modalStyles.button, backgroundColor: '#f0f0f0' }}>
                                다시 서명
                            </button>
                            <button onClick={handleConfirmSignature} style={{ ...modalStyles.button, backgroundColor: '#007bff', color: 'white' }}>
                                최종 확인
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleClearSignature} style={{ ...modalStyles.button, backgroundColor: '#f0f0f0' }} disabled={isLoading}>
                                지우기
                            </button>
                            <button onClick={handleGeneratePreview} style={{ ...modalStyles.button, backgroundColor: isLoading ? '#ccc' : '#007bff', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer' }} disabled={isLoading}>
                                {isLoading ? '생성 중...' : '서명 완료 및 미리보기'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfSignatureModal;