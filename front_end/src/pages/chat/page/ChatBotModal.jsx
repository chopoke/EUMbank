// src/components/FloatingChatBot/ChatBotModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { chatGpt } from '../api/chatApi';
import { getSessionId, generateSessionId, saveSessionId } from '../utils/sessionUtils';
import '../css/FloatingChatBot.css';

const ChatBotModal = ({ isOpen, onClose, buttonPosition }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(getSessionId());
    const messagesEndRef = useRef(null);
    const modalRef = useRef(null);

    // 모달 위치 계산 (버튼 근처에 표시)
    const getModalPosition = () => {
        const modalHeight = 600;

        // 화면 오른쪽 하단에 위치
        if (buttonPosition.x > window.innerWidth / 2) {
            return {
                right: `${window.innerWidth - buttonPosition.x + 10}px`,
                bottom: `${window.innerHeight - buttonPosition.y + 10}px`,
            };
        } else {
            return {
                left: `${buttonPosition.x + 80}px`,
                bottom: `${window.innerHeight - buttonPosition.y - modalHeight}px`,
            };
        }
    };

    // 초기 환영 메시지
    useEffect(() => {
        const welcomeMessage = {
            role: 'assistant',
            content: '안녕하세요! 🏦 이음은행 상담 챗봇입니다.\n예금, 적금 상품에 대해 무엇이든 물어보세요!',
            timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
    }, []);

    // 스크롤 자동 하단 이동
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 시간 포맷팅
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 메시지 전송
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const history = messages
                .filter(msg => msg.role !== 'system')
                .map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));

            const response = await chatGpt({
                message: userMessage.content,
                history: history,
                sessionId: sessionId,
            });

            const assistantMessage = {
                role: 'assistant',
                content: response.reply,
                timestamp: response.timestamp,
                status: response.status,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
                timestamp: new Date().toISOString(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Enter 키 처리
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 추천 질문 클릭
    const handleSuggestedQuestion = (question) => {
        setInputValue(question);
        setTimeout(() => handleSendMessage(), 100);
    };

    // 대화 초기화
    const handleClearChat = () => {
        const newSessionId = generateSessionId();
        saveSessionId(newSessionId);
        setSessionId(newSessionId);

        const welcomeMessage = {
            role: 'assistant',
            content: '대화가 초기화되었습니다. 다시 질문해주세요! 😊',
            timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
    };

    // 모달 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                // 플로팅 버튼 클릭은 제외
                const floatingButton = document.querySelector('.floating-chat-button');
                if (floatingButton && !floatingButton.contains(event.target)) {
                    // onClose(); // 외부 클릭 시 닫기 (선택사항)
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    return (
        <div
            ref={modalRef}
            className="chatbot-modal"
            style={getModalPosition()}
        >
            {/* 헤더 */}
            <div className="chatbot-modal-header">
                <div className="header-content">
                    <div className="header-title">
                        <span className="bank-logo">🏦</span>
                        <div>
                            <h3>이음은행 상담봇</h3>
                            <p className="header-subtitle">예금·적금 상품 문의</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            className="clear-btn"
                            onClick={handleClearChat}
                            title="대화 초기화"
                        >
                            🗑️
                        </button>
                        <button
                            className="close-btn"
                            onClick={onClose}
                            title="닫기"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className="chatbot-modal-messages">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message-item ${message.role === 'user' ? 'user' : 'assistant'} ${message.isError ? 'error' : ''}`}
                    >
                        <div className="message-avatar">
                            {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                            <div className="message-bubble">
                                {message.content}
                            </div>
                            <div className="message-time">
                                {formatTime(message.timestamp)}
                            </div>
                        </div>
                    </div>
                ))}

                {/* 타이핑 인디케이터 */}
                {isLoading && (
                    <div className="message-item assistant">
                        <div className="message-avatar">🤖</div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* 추천 질문 */}
            {messages.length === 1 && !isLoading && (
                <div className="suggested-questions-modal">
                    <p className="suggested-title">💡 추천 질문:</p>
                    <div className="suggested-buttons-modal">
                        <button onClick={() => handleSuggestedQuestion('예금 상품 추천해주세요')}>
                            📊 예금 상품
                        </button>
                        <button onClick={() => handleSuggestedQuestion('적금 상품 알려주세요')}>
                            💰 적금 상품
                        </button>
                        <button onClick={() => handleSuggestedQuestion('금리가 가장 높은 상품은?')}>
                            📈 고금리
                        </button>
                        <button onClick={() => handleSuggestedQuestion('예금과 적금의 차이가 뭔가요?')}>
                            ❓ 차이점
                        </button>
                    </div>
                </div>
            )}

            {/* 입력 창 */}
            <div className="chatbot-modal-input">
                <div className="input-wrapper">
                    <textarea
                        className="chat-input"
                        placeholder="메시지를 입력하세요..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        rows="1"
                    />
                    <button
                        className="send-button"
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                    >
                        {isLoading ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBotModal;