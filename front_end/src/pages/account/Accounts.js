import React, { useEffect, useState } from "react";
import api from "../api/axios";

const h = React.createElement;

function Row({ a }){
  return h("li", { className: "px-4 py-3 rounded-md border border-gray-200 flex items-center justify-between" }, [
    h("div", { className: "text-sm" }, [
      h("div", { className: "font-medium text-gray-900" }, a.aAccountNo),
      h("div", { className: "text-gray-600" }, `${a.aAccountType} · ${a.aCurrency}`)
    ]),
    h("div", { className: "text-right" }, [
      h("div", { className: "text-gray-800 font-semibold" }, `${a.aBalance ?? 0}`),
      h("div", { className: "text-xs text-gray-500" }, `aId: ${a.aId}`)
    ])
  ]);
}

export default function Accounts(){
  const [list, setList] = useState([]);
  const [f, setF] = useState({
    aId: "", aAccountNo: "", aAccountType: "DEMAND", aAccountPwd: "", aCurrency: "KRW"
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const load = async () => {
    try {
      const { data } = await api.get("/api/accounts/my");
      setList(data || []);
    } catch (ex) {
      setMsg("계좌 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      await api.post("/api/accounts", f);
      setF({ aId: "", aAccountNo: "", aAccountType: "DEMAND", aAccountPwd: "", aCurrency: "KRW" });
      await load();
      setMsg("계좌가 생성되었습니다.");
    } catch (ex) {
      const t = ex?.response?.data?.message || ex?.response?.data || "계좌 생성 실패";
      setMsg(String(t));
    } finally { setLoading(false); }
  };

  return h("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" }, [
    h("div", { className: "container mx-auto px-4 py-8", key: "wrap" }, [
      h("div", { className: "text-center mb-8", key: "hdr" }, [
        h("h1", { className: "text-3xl font-bold text-gray-800 mb-2", style: { fontFamily: "Pacifico, serif" } }, "logo"),
        h("h2", { className: "text-2xl font-semibold text-blue-600 mb-2" }, "내 계좌"),
        h("p", { className: "text-gray-600" }, "계좌 목록 확인 및 새 계좌 개설")
      ]),

      h("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", key: "grid" }, [
        // 목록
        h("div", { className: "bg-white rounded-xl shadow-lg p-6 sm:p-8", key: "list" }, [
          h("h3", { className: "text-lg font-semibold mb-4" }, "보유 계좌"),
          list.length === 0
            ? h("p", { className: "text-gray-600" }, "계좌가 없습니다.")
            : h("ul", { className: "space-y-3" }, list.map((a) => h(Row, { a, key: a.aNo || a.aAccountNo })))
        ]),
        // 생성
        h("div", { className: "bg-white rounded-xl shadow-lg p-6 sm:p-8", key: "create" }, [
          h("h3", { className: "text-lg font-semibold mb-4" }, "계좌 개설"),
          msg ? h("div", { className: "mb-4 rounded-lg px-4 py-3 text-sm bg-blue-50 text-blue-700 border border-blue-200" }, msg) : null,
          h("form", { onSubmit: create, className: "space-y-4" }, [
            h("div", null, [
              h("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "계좌ID (업무용)"),
              h("input", {
                type: "text", name: "aId", value: f.aId, onChange,
                placeholder: "예) ACC-001",
                className: "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              })
            ]),
            h("div", null, [
              h("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "계좌번호"),
              h("input", {
                type: "text", name: "aAccountNo", value: f.aAccountNo, onChange,
                placeholder: "예) 110-123-456789",
                className: "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              })
            ]),
            h("div", null, [
              h("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "계좌유형"),
              h("select", {
                name: "aAccountType", value: f.aAccountType, onChange,
                className: "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }, [
                h("option", { value: "DEMAND" }, "DEMAND"),
                h("option", { value: "SAVINGS" }, "SAVINGS")
              ])
            ]),
            h("div", null, [
              h("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "통화"),
              h("select", {
                name: "aCurrency", value: f.aCurrency, onChange,
                className: "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }, [
                h("option", { value: "KRW" }, "KRW"),
                h("option", { value: "USD" }, "USD")
              ])
            ]),
            h("div", null, [
              h("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "계좌 비밀번호"),
              h("input", {
                type: "password", name: "aAccountPwd", value: f.aAccountPwd, onChange,
                placeholder: "계좌 비밀번호",
                className: "w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              })
            ]),
            h("button", {
              type: "submit",
              disabled: loading,
              className: "w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            }, loading ? "처리중..." : "개설하기")
          ])
        ])
      ])
    ])
  ]);
}
