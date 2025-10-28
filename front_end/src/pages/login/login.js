import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../api/authApi";
import api from "../../api/axios";
import naverlogo from "../../resources/img/네이버로고.png";
import maintxt from '../../resources/img/e-um.png'

const h = React.createElement;

const API_BASE = process.env?.REACT_APP_API_URL || "http://localhost:8081";

function Input({ label, name, type, value, onChange, placeholder }) {
  return h("div", null, [
    h("label", { className: "block text-sm font-medium text-gray-700 mb-1", key: "label" }, label),
    h("input", {
      key: "input",
      type: type || "text",
      name,
      value,
      onChange,
      placeholder,
      required: true,
      className:
        "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    }),
  ]);
}

export default function Login() {
  const [f, setF] = useState({ cUserId: "", cPassword: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();                         // 라우팅

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();                                   // 기본 제출 차단
    setLoading(true);
    setMsg("");
    try {
      // 권장 방식: authApi.login -> 서버가 RT 쿠키를 세팅, AT는 메모리에 저장됨
      await apiLogin({ c_user_id: f.cUserId, c_password: f.cPassword });
      window.dispatchEvent(new Event("auth:changed")); // 로그인 상태 갱신 트리거

      // localStorage 사용/RT 저장 금지
      // localStorage.setItem("access", data.accessToken)  // 제거
      // localStorage.setItem("refresh", data.refreshToken) // 제거

      navigate("/");                                      // 성공 시 이동
    } catch (ex) {
      const t =
        ex?.response?.data?.error ||
        ex?.response?.data?.message ||
        ex?.response?.data ||
        "로그인 실패. 아이디/비밀번호를 확인해주세요.";
      setMsg(String(t));
    } finally {
      setLoading(false);
    }
  };

  const naverLogin = (e) => {
    window.location.href = `${API_BASE}/oauth2/authorization/naver`;    // 스프링 시큐리티가 자동 제공
    //window.location.href = `http://localhost:8081/oauth2/authorization/naver`;    // 스프링 시큐리티가 자동 제공
    //window.location.href = `${API_BASE}/oauth2/authorization/google`;
  }

  return h("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" }, [
    h("div", { className: "container mx-auto px-4 py-8", key: "wrap" }, [
      h("div", { className: "text-center mb-8", key: "hdr" }, [
        h(
          "h1",
          {
            className: "text-3xl font-bold text-gray-800 mb-2",
            style: { fontFamily: "Pacifico, serif" },
          },
          <img src={maintxt} className="mx-auto block w-38 h-auto" />
        ),
        h("h2", { className: "text-2xl font-semibold text-blue-600 mb-2" }, "로그인"),
        h("p", { className: "text-gray-600" }, "아이디와 비밀번호를 입력해주세요"),
      ]),
      h("div", { className: "max-w-md mx-auto", key: "card" }, [
        h("div", { className: "bg-white rounded-xl shadow-lg p-6 sm:p-8" }, [
          msg
            ? h(
                "div",
                {
                  className:
                    "mb-5 rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200",
                },
                msg
              )
            : null,
          h("form", { onSubmit: submit, className: "space-y-5" }, [
            h(Input, {
              key: "id",
              label: "아이디",
              name: "cUserId",
              value: f.cUserId,
              onChange,
              placeholder: "eumbank_user",
            }),
            h(Input, {
              key: "pw",
              label: "비밀번호",
              name: "cPassword",
              type: "password",
              value: f.cPassword,
              onChange,
              placeholder: "********",
            }),
            h(
              "button",
              {
                type: "submit",
                disabled: loading,
                className:
                  "w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60",
              },
              loading ? "처리중..." : "로그인"
            ),
             // 네이버 로그인 버튼 추가
            h(
              "button",
              {
                type: "button",
                onClick: naverLogin, // 백엔드 네이버 OAuth URL로 이동
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
}
