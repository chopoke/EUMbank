// src/components/FloatingChatBot/FloatingChatButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import ChatBotModal from './ChatBotModal';
import '../css/FloatingChatBot.css';
import sym from '../../../resources/img/eumonly.png'

const FloatingChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const buttonRef = useRef(null);

    // 드래그 시작
    const handleMouseDown = (e) => {
        if (isOpen) return; // 챗봇이 열려있으면 드래그 불가

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // 드래그 중
    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // 화면 경계 체크
        const maxX = window.innerWidth - 70;
        const maxY = window.innerHeight - 70;

        setPosition({
            x: Math.max(10, Math.min(newX, maxX)),
            y: Math.max(10, Math.min(newY, maxY))
        });
    };

    // 드래그 종료
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 전역 이벤트 리스너
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    // 클릭 핸들러 (드래그와 구분)
    const handleClick = () => {
        if (!isDragging) {
            setIsOpen(!isOpen);
            setHasNewMessage(false);
        }
    };

    // 화면 크기 변경 시 위치 조정
    useEffect(() => {
        const handleResize = () => {
            const maxX = window.innerWidth - 70;
            const maxY = window.innerHeight - 70;

            setPosition(prev => ({
                x: Math.min(prev.x, maxX),
                y: Math.min(prev.y, maxY)
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* 플로팅 버튼 */}
            <div
                ref={buttonRef}
                className={`floating-chat-button ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                title="eum_bank 챗봇"
            >
                {isOpen ? (
                    <span className="close-icon">✕</span>
                ) : (
                    <>
                        <span className="chat-icon"><img src={sym} className="sym" /></span>
                        {hasNewMessage && <span className="notification-badge"></span>}
                    </>
                )}
            </div>

            {/* 챗봇 모달 */}
            {isOpen && (
                <ChatBotModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    buttonPosition={position}
                />
            )}
        </>
    );
};

export default FloatingChatButton;