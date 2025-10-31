import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';

/**
 * Firebase 앱 초기화
 */
const firebaseConfig = {
  apiKey: "AIzaSyCzyMkGRCYbGf7AJIebKlM17HRo9wjVE9s",
  authDomain: "eumbank-86fbd.firebaseapp.com",
  projectId: "eumbank-86fbd",
  storageBucket: "eumbank-86fbd.firebasestorage.app",
  messagingSenderId: "120155006967",
  appId: "1:120155006967:web:5a929da0b9e823d7baf0f2",
  measurementId: "G-BTYXRMF7F5"
};

const app = initializeApp(firebaseConfig);

/**
 * VAPID 키
 */
export const VAPID_KEY = "BCh8qv2ozl-7h91fR4GPeWxeD0hvtKii6HVX30SOdOk-znQRXXAHWfcUcK_FCfix5b1W16UDB_hsc8CXkria96A";

/**
 * Firebase Messaging 인스턴스
 */
export const messaging = getMessaging(app);

/**
 * 알림 권한 요청 및 FCM 토큰 발급
 */
export const requestPermissionAndGetToken = async () => {
  try {
    console.log('🚀 [firebaseInit] 알림 권한 요청 시작...');
    
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('⚠️ 알림 권한이 거부되었습니다.');
      return null;
    }
    
    console.log('✅ 알림 권한 허용됨');
    
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker 등록 완료');
      
      // 토큰 발급
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (!token) {
        console.error('❌ FCM 토큰 발급 실패');
        return null;
      }
      
      console.log('✅ FCM 토큰 발급 성공:', token.substring(0, 50) + '...');
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('❌ FCM 토큰 발급 실패:', error);
    return null;
  }
};

/**
 * FCM 토큰 삭제
 */
export const deleteFcmToken = async () => {
  try {
    await deleteToken(messaging);
    console.log('✅ FCM 토큰 삭제 완료');
  } catch (error) {
    console.error('❌ FCM 토큰 삭제 실패:', error);
  }
};

