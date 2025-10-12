import React, { useEffect } from 'react';
import api from "../../api/axios";
import { useNavigate } from 'react-router-dom';

export default function Cookie() {

    const navigate = useNavigate();

    useEffect(() => {
        const cookieToBody = async () => {
            try{
                const { data }  = await api.post("/api/auth/exchange");

                localStorage.setItem("access", data.accessToken);
                localStorage.setItem("refresh", data.refreshToken);

                navigate("/");
            } catch(ex) {
                alert("소셜 로그인 실패");
                navigate("/login");
            }
        };

        cookieToBody();
    }, [navigate]);

    return (
        <div>
            로그인 처리 중입니다...
        </div>
    );
};
