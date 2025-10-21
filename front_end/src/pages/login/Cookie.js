import React, { useEffect } from 'react';
import api from "../../api/axios";
import { useNavigate } from 'react-router-dom';
import naverlogo from "../../resources/img/네이버로고.png";

export default function Cookie() {

    const h = React.createElement;

    const navigate = useNavigate();

    useEffect(() => {
        const cookieToBody = async () => {
            try{
                const { data }  = await api.post("/api/auth/exchange");

                localStorage.setItem("access", data.accessToken);
                localStorage.setItem("refresh", data.refreshToken);

                const agreed = await checkAgree();

                if(agreed) {
                    alert("네이버 로그인 성공했습니다.");
                    // navigate("/");
                    window.location.href = "/";
                } else {
                    navigate("/socialAgree");
                }
                
            } catch(ex) {
                alert("소셜 로그인 실패");
                navigate("/login");
            }
        };

         const checkAgree = async () => {
            try{
                const res = await api.get("/api/secure/agree/check");
                return res.data.c_agree_terms === "Y" && res.data.c_agree_privacy === "Y";
            } catch(ex) {
                console.error("약관 동의 여부 조회 실패", ex);
                return false;
            }
        };

        cookieToBody();
    }, [navigate]);

    return h("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" }, [
        h("div", { className: "container mx-auto px-4 py-8", key: "wrap" }, [
        h("div", { className: "text-center mb-8", key: "hdr" }, [
            h(
            "h1",
            {
                className: "text-3xl font-bold text-gray-800 mb-2",
                style: { fontFamily: "Pacifico, serif" },
            },
            "logo"
            ),
            h("h2", { className: "text-2xl font-semibold text-blue-600 mb-2" }, "로그인"),
            h("p", { className: "text-gray-600" }, "아이디와 비밀번호를 입력해주세요"),
        ]),
        h("div", { className: "max-w-md mx-auto", key: "card" }, [
            h("div", { className: "bg-white rounded-xl shadow-lg p-6 sm:p-8" }, [
            h("div", { className: "space-y-5" }, [
                 h("div", { key: "id", className: "flex flex-col" }, [
                h("label", { className: "text-gray-700 text-sm mb-1" }, "아이디"),
                h(
                "div",
                {
                    className:
                    "w-full rounded-md border border-gray-300 text-gray-500 px-3 py-2 cursor-default select-none",
                },
                "eumbank_user"
                ),
            ]),

            // 비밀번호
            h("div", { key: "pw", className: "flex flex-col" }, [
                h("label", { className: "text-gray-700 text-sm mb-1" }, "비밀번호"),
                h(
                "div",
                {
                    className:
                    "w-full rounded-md border border-gray-300 ext-gray-500 px-3 py-2 cursor-default select-none tracking-widest",
                },
                "********"
                ),
            ]),
                h(
                "button",
                {
                    type: "submit",
                    className:
                    "w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60",
                },
                "로그인"
                ),
                // ✅ 네이버 로그인 버튼 추가
                h(
                "button",
                {
                    type: "button",
                    className:
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#03C75A] px-4 py-3 font-medium text-white hover:bg-[#02b250] focus:outline-none focus:ring-2 focus:ring-green-500 mt-2",
                },
                //"네이버 로그인"
                [
                    h("img", {
                    src: naverlogo,
                    alt: "Naver logo",
                    className: "w-5 h-5",
                    }),
                    h("span", { className: "text-medium text-white" }, "네이버 로그인")
                ]
                ),
            ]),
            h("div", { className: "text-center mt-6" }, [
                h("p", { className: "text-sm text-gray-600" }, [
                "아직 계정이 없으신가요? ",
                h("a", { href: "/signup", className: "text-blue-600 hover:underline" }, "회원가입"),
                ]),
            ]),
            ]),
        ]),
        ]),
  ]);
};
