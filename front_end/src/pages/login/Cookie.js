import React, { useEffect } from "react";
import api, { setAccessToken } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import naverlogo from "../../resources/img/네이버로고.png";

let booting = null;

export default function Cookie() {
  const h = React.createElement;
  const navigate = useNavigate();
  

  useEffect(() => {
    if (!booting) {
      booting = (async () => {
        try {
          const { data } = await api.post("/api/auth/refresh");
          setAccessToken(data.accessToken);
          window.dispatchEvent(new Event("auth:changed"));
          const agreed = await checkAgree();
          navigate(agreed ? "/" : "/social/agree", { replace: true });
        } catch (e) {
          const s = e?.response?.status;
          const c = e?.response?.data?.code;
          if (s === 423 || c === "ACCOUNT_STATUS_BLOCKED") {
            alert("계정 상태로 로그인할 수 없습니다. 관리자에게 문의하세요.");
          } else {
            alert("소셜 로그인 실패");
          }
          navigate("/login", { replace: true });
        } finally {
          booting = null;
        }
      })();
    }
  }, [navigate]);
    

  async function checkAgree() {
    try {
      const res = await api.get("/api/social/agree/check");
      return res.data.c_agree_terms === "Y" && res.data.c_agree_privacy === "Y";
    } catch {
      return false;
    }
  }

  return h("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" }, [
    h("div", { className: "container mx-auto px-4 py-8", key: "wrap" }, [
      h("div", { className: "text-center mb-8", key: "hdr" }, [
        h(
          "h1",
          { className: "text-3xl font-bold text-gray-800 mb-2", style: { fontFamily: "Pacifico, serif" } },
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
              h("div", { className: "w-full rounded-md border border-gray-300 text-gray-500 px-3 py-2 cursor-default select-none" }, "eumbank_user"),
            ]),
            h("div", { key: "pw", className: "flex flex-col" }, [
              h("label", { className: "text-gray-700 text-sm mb-1" }, "비밀번호"),
              h("div", { className: "w-full rounded-md border border-gray-300 ext-gray-500 px-3 py-2 cursor-default select-none tracking-widest" }, "********"),
            ]),
            h("button", { type: "submit", className: "w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" }, "로그인"),
            h("button", { type: "button", className: "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#03C75A] px-4 py-3 font-medium text-white hover:bg-[#02b250] focus:outline-none focus:ring-2 focus:ring-green-500 mt-2" }, [
              h("img", { src: naverlogo, alt: "Naver logo", className: "w-5 h-5" }),
              h("span", { className: "text-medium text-white" }, "네이버 로그인"),
            ]),
          ]),
          h("div", { className: "text-center mt-6" }, [
            h("p", { className: "text-sm text-gray-600" }, ["아직 계정이 없으신가요? ", h("a", { href: "/signup", className: "text-blue-600 hover:underline" }, "회원가입")]),
          ]),
        ]),
      ]),
    ]),
  ]);
}
