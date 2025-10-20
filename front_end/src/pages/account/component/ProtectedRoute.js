// src/pages/account/component/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // 라이브러리 import

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access');

  if (!token) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/login" replace />;
  }

  try {
    // 토큰을 디코드하여 payload의 만료 시간(exp)을 가져옵니다.
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // 현재 시간을 초 단위로 변환


  } catch (error) {
    // 토큰 형식이 잘못된 경우 등 디코드 실패 시
    console.error("Invalid token:", error);
    return <Navigate to="/login" replace />;
  }


  // 토큰이 존재하고, 만료되지 않았으면 페이지를 보여줍니다.
  return children;
}

export default ProtectedRoute;