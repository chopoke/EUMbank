/**
 * Firebase Messaging Service Worker
 * 
 * 백그라운드 푸시 알림 처리
 * 
 * @author EUMbank Team
 * @since 2025-10-29
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCzyMkGRCYbGf7AJIebKlM17HRo9wjVE9s",
  authDomain: "eumbank-86fbd.firebaseapp.com",
  projectId: "eumbank-86fbd",
  storageBucket: "eumbank-86fbd.firebasestorage.app",
  messagingSenderId: "120155006967",
  appId: "1:120155006967:web:5a929da0b9e823d7baf0f2",
  measurementId: "G-BTYXRMF7F5"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[Service Worker] Firebase Messaging 초기화 완료');

/**
 * 백그라운드 메시지 수신 핸들러
 * 앱이 백그라운드 상태일 때 알림을 수신하고 표시합니다.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '[이음은행]';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 도착했습니다.',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.messageId || 'notification',
    data: {
      ...payload.data,
      url: payload.data?.click_action || '/'
    },
    requireInteraction: false,
    silent: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * 알림 클릭 이벤트 핸들러
 * 사용자가 알림을 클릭하면 지정된 URL로 이동합니다.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event.notification.tag);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }

      // 열려있는 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Service Worker 설치 이벤트
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 설치 완료');
  self.skipWaiting();
});

/**
 * Service Worker 활성화 이벤트
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 활성화 완료');
  event.waitUntil(clients.claim());
});
