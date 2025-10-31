import React, { useRef, useEffect, useState } from 'react';
import  SignatureCanvas from './SignatureCanvas';
import { generateSignedPdf, createSignatureData } from '../../utils/pdfUtils';
import { pdfmodalStyles } from '../../css/pdfmodalStyles';

const PdfSignatureModal = ({ onClose, onSave, href }) => {
    const signatureCanvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [finalPdfData, setFinalPdfData] = useState(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleGeneratePreview = async () => {
        if (signatureCanvasRef.current.isEmpty()) {
            alert('서명을 먼저 해주세요.');
            return;
        }
        setIsLoading(true);

        try {
            const templatePdfPath = `${href}/sample.pdf`;
            const canvas = signatureCanvasRef.current.getCanvas();
            
            const signedPdfBlob = await generateSignedPdf(canvas, templatePdfPath);
            const signatureData = createSignatureData(signedPdfBlob, templatePdfPath);
            
            setFinalPdfData(signatureData);

            const url = URL.createObjectURL(signedPdfBlob);
            setPreviewUrl(url);

        } catch (error) {
            console.error('미리보기 생성 중 오류 발생:', error);
            alert('처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSignature = () => {
        if (onSave && finalPdfData) {
            onSave(finalPdfData);
        }
        alert('서명이 최종 확인되었습니다.');
        onClose();
    };

    const handleRedoSignature = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFinalPdfData(null);
    };

    const handleClearSignature = () => {
        signatureCanvasRef.current.clear();
    };

    return (
        <div style={pdfmodalStyles.overlay} onClick={onClose}>
            <div style={pdfmodalStyles.content} onClick={(e) => e.stopPropagation()}>
                <div style={pdfmodalStyles.header}>
                    <h3>{previewUrl ? '서명 미리보기' : '상품 약관 확인 및 전자 서명'}</h3>
                    <button onClick={onClose} style={pdfmodalStyles.closeButton}>&times;</button>
                </div>

                {/* PDF 뷰어 */}
                <div style={pdfmodalStyles.pdfViewer}>
                    <iframe
                        src={previewUrl || (href ? `${href}/sample.pdf` : '/deposit/sample.pdf')}
                        style={pdfmodalStyles.iframe}
                        title={previewUrl ? "서명 미리보기" : "약관 문서"}
                    />
                </div>

                {/* 서명 캔버스 */}
                {!previewUrl && (
                    <>
                        <div style={pdfmodalStyles.signatureTitle}>아래 영역에 서명해주세요:</div>
                        <SignatureCanvas
                            ref={signatureCanvasRef}
                            style={pdfmodalStyles.signatureCanvas}
                        />
                    </>
                )}

                {/* 버튼 컨테이너 */}
                <div style={pdfmodalStyles.buttonContainer}>
                    {previewUrl ? (
                        <>
                            <button 
                                onClick={handleRedoSignature} 
                                style={{ ...pdfmodalStyles.button, backgroundColor: '#f0f0f0' }}
                            >
                                다시 서명
                            </button>
                            <button 
                                onClick={handleConfirmSignature} 
                                style={{ ...pdfmodalStyles.button, backgroundColor: '#007bff', color: 'white' }}
                            >
                                최종 확인
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={handleClearSignature} 
                                style={{ ...pdfmodalStyles.button, backgroundColor: '#f0f0f0' }} 
                                disabled={isLoading}
                            >
                                지우기
                            </button>
                            <button 
                                onClick={handleGeneratePreview} 
                                style={{ 
                                    ...pdfmodalStyles.button, 
                                    backgroundColor: isLoading ? '#ccc' : '#007bff', 
                                    color: 'white', 
                                    cursor: isLoading ? 'not-allowed' : 'pointer' 
                                }} 
                                disabled={isLoading}
                            >
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