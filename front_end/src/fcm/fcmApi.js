import api from '../api/axios';

/**
 * FCM 토큰 구독
 */
export const subscribeToken = async (fcmToken, deviceInfo) => {
  const response = await api.post('/api/fcm/subscribe', {
    fcmToken,
    deviceInfo: deviceInfo || navigator.userAgent
  });
  return response.data;
};

/**
 * FCM 토큰 구독 해제
 */
export const unsubscribeToken = async (fcmToken) => {
  const response = await api.post('/api/fcm/unsubscribe', { fcmToken });
  return response.data;
};

/**
 * 알림 목록 조회
 */
export const getNotifications = async (page = 0, size = 10) => {
  const response = await api.get(`/api/notifications?page=${page}&size=${size}`);
  return response.data;
};

/**
 * 미읽음 알림 개수 조회
 */
export const getUnreadCount = async () => {
  const response = await api.get('/api/notifications/unread-count');
  return response.data.count;
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllAsRead = async () => {
  const response = await api.post('/api/notifications/read-all');
  return response.data;
};

