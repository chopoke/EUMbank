import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { generateSignedPdf, createSignatureData } from '../../utils/pdfUtils';
import { pdfmodalStyles } from '../../css/pdfmodalStyles';

const PdfSignatureModal = ({ onClose, onSave, href }) => {
    const signatureCanvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [finalPdfData, setFinalPdfData] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [error, setError] = useState(null);

    const pdfDocuments = [
        { name: '이용 약관', path: `${href}/terms.pdf` },
        { name: '상품 가입서', path: `${href}/sample.pdf` }
    ];

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
        setError(null);

        try {
            console.log('서명 처리 시작...');

            const pdfPaths = pdfDocuments.map(doc => doc.path);
            console.log('처리할 PDF 목록:', pdfPaths);

            const canvas = signatureCanvasRef.current.getCanvas();
            if (!canvas) {
                throw new Error('서명 캔버스를 가져올 수 없습니다.');
            }

            console.log('PDF 병합 시작...');
            const signedPdfBlob = await generateSignedPdf(canvas, pdfPaths);

            if (!signedPdfBlob) {
                throw new Error('PDF 생성에 실패했습니다.');
            }

            console.log('서명 데이터 생성 중...');
            const signatureData = createSignatureData(signedPdfBlob, pdfPaths[0]);

            console.log('최종 데이터:', signatureData);
            setFinalPdfData(signatureData);

            const url = URL.createObjectURL(signedPdfBlob);
            setPreviewUrl(url);

            console.log('미리보기 준비 완료');

        } catch (error) {
            console.error('미리보기 생성 중 오류 발생:', error);
            setError(error.message);
            alert('처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSignature = () => {
        console.log('========== 최종 확인 버튼 클릭 ==========');
        console.log('finalPdfData 전체:', finalPdfData);

        if (!finalPdfData) {
            console.error('finalPdfData가 없습니다.');
            alert('서명 데이터가 없습니다. 다시 시도해주세요.');
            return;
        }

        if (!finalPdfData.signedPdfBlob) {
            console.error('signedPdfBlob이 없습니다:', finalPdfData);
            alert('PDF 파일이 생성되지 않았습니다. 다시 시도해주세요.');
            return;
        }

        console.log('전달할 데이터:', {
            blobSize: finalPdfData.signedPdfBlob.size,
            signatureDate: finalPdfData.signatureDate,
            templatePdfPath: finalPdfData.templatePdfPath
        });

        if (onSave) {
            console.log('onSave 함수 호출');
            try {
                onSave(finalPdfData);
                console.log('onSave 함수 호출 성공');
                alert('서명이 최종 확인되었습니다.');
                onClose();
            } catch (error) {
                console.error('onSave 실행 중 오류:', error);
                alert('저장 중 오류가 발생했습니다: ' + error.message);
            }
        } else {
            console.error('onSave 함수가 정의되지 않았습니다.');
            alert('저장 함수가 없습니다.');
        }
    };

    const handleRedoSignature = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFinalPdfData(null);
        setError(null);
    };

    const handleClearSignature = () => {
        signatureCanvasRef.current.clear();
        setError(null);
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < pdfDocuments.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const isLastPage = currentPage === pdfDocuments.length - 1;

    return (
        <div style={pdfmodalStyles.overlay} onClick={onClose}>
            <div style={pdfmodalStyles.content} onClick={(e) => e.stopPropagation()}>
                <div style={pdfmodalStyles.header}>
                    <h3>{previewUrl ? '병합된 서명 문서 미리보기' : '상품 약관 확인 및 전자 서명'}</h3>
                    <button onClick={onClose} style={pdfmodalStyles.closeButton}>&times;</button>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        margin: '10px 20px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* 디버그 정보 */}
                {previewUrl && finalPdfData && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        borderRadius: '4px',
                        margin: '10px 20px',
                        fontSize: '12px'
                    }}>
                        ✓ PDF 크기: {(finalPdfData.signedPdfBlob.size / 1024).toFixed(2)} KB<br/>
                        ✓ 서명 시간: {new Date(finalPdfData.signatureDate).toLocaleString()}
                    </div>
                )}

                {/* 페이지 표시 */}
                {!previewUrl && (
                    <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        fontWeight: 'bold'
                    }}>
                        {pdfDocuments[currentPage].name} ({currentPage + 1} / {pdfDocuments.length})
                    </div>
                )}

                {/* PDF 뷰어 */}
                <div style={pdfmodalStyles.pdfViewer}>
                    <iframe
                        src={previewUrl || pdfDocuments[currentPage].path}
                        style={pdfmodalStyles.iframe}
                        title={previewUrl ? "병합된 서명 문서" : pdfDocuments[currentPage].name}
                    />
                </div>

                {/* 페이지 네비게이션 버튼 */}
                {!previewUrl && pdfDocuments.length > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        borderTop: '1px solid #ddd'
                    }}>
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 0}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: currentPage === 0 ? '#e0e0e0' : '#007bff',
                                color: currentPage === 0 ? '#888' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={isLastPage}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: isLastPage ? '#e0e0e0' : '#007bff',
                                color: isLastPage ? '#888' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isLastPage ? 'not-allowed' : 'pointer'
                            }}
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* 서명 캔버스 - 마지막 페이지에서만 표시 */}
                {!previewUrl && isLastPage && (
                    <>
                        <div style={pdfmodalStyles.signatureTitle}>
                            모든 약관을 확인하셨습니다. 아래 영역에 서명해주세요:
                        </div>
                        <SignatureCanvas
                            ref={signatureCanvasRef}
                            style={pdfmodalStyles.signatureCanvas}
                        />
                    </>
                )}

                {/* 안내 메시지 - 마지막 페이지가 아닐 때 */}
                {!previewUrl && !isLastPage && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        모든 약관을 확인한 후 서명할 수 있습니다.
                    </div>
                )}

                {/* 버튼 컨테이너 */}
                <div style={pdfmodalStyles.buttonContainer}>
                    {previewUrl ? (
                        <>
                            <button
                                onClick={handleRedoSignature}
                                style={{
                                    ...pdfmodalStyles.button,
                                    backgroundColor: '#6c757d',
                                    color: 'white'
                                }}
                            >
                                🔄 다시 서명
                            </button>
                            <button
                                onClick={handleConfirmSignature}
                                style={{
                                    ...pdfmodalStyles.button,
                                    backgroundColor: finalPdfData?.signedPdfBlob ? '#28a745' : '#ccc',
                                    color: 'white',
                                    cursor: finalPdfData?.signedPdfBlob ? 'pointer' : 'not-allowed'
                                }}
                                disabled={!finalPdfData || !finalPdfData.signedPdfBlob}
                            >
                                ✓ 최종 확인
                            </button>
                        </>
                    ) : (
                        isLastPage && (
                            <>
                                <button
                                    onClick={handleClearSignature}
                                    style={{
                                        ...pdfmodalStyles.button,
                                        backgroundColor: '#f0f0f0',
                                        color: '#333'
                                    }}
                                    disabled={isLoading}
                                >
                                    🗑️ 지우기
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
                                    {isLoading ? '⏳ 병합 및 생성 중...' : '📝 서명 완료 및 미리보기'}
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfSignatureModal;