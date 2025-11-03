import React, { useState, useEffect } from 'react';
import { getUnreadCount } from '../fcmApi';
import NotificationModal from './NotificationModal';

/**
 * 알림 종 아이콘 컴포넌트
 */
const NotificationBell = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 미읽음 알림 개수 조회 (30초마다 자동 갱신)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('미읽음 알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div style={{ position: 'relative' }}>
      {/* 종 아이콘 버튼 */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* 읽지 않은 알림 개수 뱃지 */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* 모달 */}
      {isModalOpen && (
        <NotificationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default NotificationBell;

