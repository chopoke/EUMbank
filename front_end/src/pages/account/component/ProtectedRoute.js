// src/pages/account/component/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../../../api/axios";

const WHITELIST = new Set([
  "/social/cookie", // 소셜 콜백 처리 페이지는 AT 없어도 입장 허용
  "/social/agree",
]);

  // 토큰이 존재하고, 만료되지 않았으면 페이지를 보여줍니다.
export default function ProtectedRoute({ children }) {
  const token = getAccessToken();
  const { pathname } = useLocation();

  if (token) return children;
  if (WHITELIST.has(pathname)) return children;

  return <Navigate to="/login" replace />;
}