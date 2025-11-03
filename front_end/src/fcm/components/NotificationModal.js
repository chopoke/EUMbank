import React, { useState, useEffect } from 'react';
import { requestPermissionAndGetToken, deleteFcmToken } from '../firebaseInit';
import { subscribeToken, unsubscribeToken, getNotifications, markAllAsRead } from '../fcmApi';

/**
 * 알림 모달 컴포넌트
 */
const NotificationModal = ({ isOpen, onClose }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  // 초기 상태 설정
  useEffect(() => {
    if (!isOpen) return;

    const fcmToken = localStorage.getItem('fcm_token');
    const hasPermission = Notification.permission === 'granted';
    
    if (fcmToken && hasPermission) {
      setIsSubscribed(true);
    }
  }, [isOpen]);

  // 알림 목록 조회
  useEffect(() => {
    if (!isOpen) return;

    const loadNotifications = async () => {
      try {
        const response = await getNotifications(0, 10);
        setNotifications(response.content || []);
        setHasNext(response.hasNext || false);
      } catch (error) {
        console.error('알림 목록 조회 실패:', error);
      }
    };

    loadNotifications();
  }, [isOpen]);

  // 모달 열릴 때 모두 읽음 처리
  useEffect(() => {
    if (!isOpen) return;

    const markRead = async () => {
      try {
        await markAllAsRead();
        console.log('모든 알림을 읽음으로 표시했습니다.');
      } catch (error) {
        console.error('읽음 처리 실패:', error);
      }
    };

    markRead();
  }, [isOpen]);

  // 구독 토글 핸들러
  const handleToggleChange = async (e) => {
    const newStatus = e.target.checked;
    setIsSubscribed(newStatus);

    if (newStatus === true) {
      // 구독 시작
      const token = await requestPermissionAndGetToken();
      if (token) {
        try {
          await subscribeToken(token, navigator.userAgent);
          localStorage.setItem('fcm_token', token);
          console.log('✅ 알림 구독 완료');
        } catch (error) {
          console.error('알림 구독 실패:', error);
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } else {
      // 구독 해제
      const token = localStorage.getItem('fcm_token');
      if (token) {
        try {
          await unsubscribeToken(token);
          await deleteFcmToken();
          localStorage.removeItem('fcm_token');
          console.log('✅ 알림 구독 해제 완료');
        } catch (error) {
          console.error('알림 구독 해제 실패:', error);
        }
      }
    }
  };

  // 더보기 버튼 클릭
  const handleLoadMore = async () => {
    if (loading || !hasNext) return;

    setLoading(true);
    try {
      const response = await getNotifications(page + 1, 10);
      setNotifications(prev => [...prev, ...(response.content || [])]);
      setPage(prev => prev + 1);
      setHasNext(response.hasNext || false);
    } catch (error) {
      console.error('추가 알림 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999
        }}
      />

      {/* 모달 */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          width: '380px',
          maxHeight: '600px',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            알림
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>
            ×
          </button>
        </div>

        {/* 알림 ON/OFF 스위치 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            알림 수신
          </span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div
              onClick={(e) => {
                e.preventDefault();
                handleToggleChange({ target: { checked: !isSubscribed } });
              }}
              style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                backgroundColor: isSubscribed ? '#2563eb' : '#d1d5db',
                borderRadius: '12px',
                transition: 'background-color 0.2s',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isSubscribed ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.2s'
                }}
              />
            </div>
          </label>
        </div>

        {/* 알림 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
          {notifications.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
              새로운 알림이 없습니다.
            </p>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notifications.map((notification) => (
                  <li
                    key={notification.messageId}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: notification.isRead === 'on' ? '#f9fafb' : '#eff6ff',
                      marginBottom: '8px',
                      transition: 'background-color 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = notification.isRead === 'on' ? '#f9fafb' : '#eff6ff')
                    }
                  >
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: notification.isRead === 'on' ? '#374151' : '#1d4ed8' }}>
                        {notification.title}
                      </h5>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: notification.isRead === 'on' ? '#6b7280' : '#2563eb', lineHeight: 1.4 }}>
                        {notification.body}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* 더보기 버튼 */}
              {hasNext && (
                <div style={{ textAlign: 'center', paddingTop: '12px' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: '1px solid #2563eb',
                      color: '#2563eb',
                      fontSize: '13px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    {loading ? '로딩 중...' : '+ 더보기'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationModal;

