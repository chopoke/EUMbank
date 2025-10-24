import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // 실제로는 localStorage, Redux, Context API 등에서 토큰을 가져옵니다.
    const isAuthenticated = localStorage.getItem('access');

    if (!isAuthenticated) {
        // 인증되지 않았다면 로그인 페이지로 리디렉션
        // replace: true 옵션은 히스토리에 현재 경로를 남기지 않습니다.
        alert('로그인이 필요한 서비스입니다.');
        return <Navigate to="/login" replace />;
    }

    // 인증되었다면 요청한 페이지(children)를 그대로 보여줌
    return children;
};

export default ProtectedRoute;