import { useEffect, useState } from "react";
import NoticeBar from "../../components/NoticeBar";

/* ===================== 서버 주소 ===================== */
// 백엔드 주소/포트
const API_BASE = "http://localhost:8081";

/* 상대/절대 경로 안전하게 합치기 */
const withBase = (url) =>
  /^https?:\/\//i.test(url)
    ? url
    : (API_BASE ? API_BASE.replace(/\/+$/, "") : "") + "/" + url.replace(/^\/+/, "");

/* ===================== 공통 fetch 래퍼 ===================== */
// 로컬스토리지 토큰
const getAccessToken  = () => localStorage.getItem("access");
const getRefreshToken = () => localStorage.getItem("refresh");

/** 모든 fetch에 Authorization 붙이고, 401이면 refresh → 1회 재시도 */
async function apiFetch(url, options = {}) {
  // 상대경로면 API_BASE를 붙이고, 절대경로면 그대로 사용
  const fullUrl = /^https?:\/\//i.test(url) ? url : API_BASE + url.replace(/^\/?/, "/");

  const access = getAccessToken();
  const headers = {
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  const res = await fetch(fullUrl, { credentials: "include", ...options, headers });
  // === 진단 로그 (요청/응답 요약) ===
  try {
    const cloned = res.clone();
    const txt = await cloned.text();
    console.log("[apiFetch]", options.method || "GET", fullUrl, "→", res.status, res.statusText, "\n", txt);
  } catch {}
  if (res.status !== 401 || options._retry) return res;

  // 401 → refresh 시도
  const refresh = getRefreshToken();
  if (!refresh) return res;

  try {
    const r = await fetch(API_BASE + "/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh }),
    });
    if (!r.ok) return res;

    const data = await r.json(); // { access }
    if (!data?.access) return res;

    localStorage.setItem("access", data.access);
    // 원 요청 재시도 (무한루프 방지 플래그)
    return apiFetch(url, { ...options, _retry: true });
  } catch {
    return res;
  }
}

/* ===================== 초기 상태 ===================== */
const init = {
  // 약관
  agreeAll: false,
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
  // 기본 인적사항
  name: "",
  birth: "", // YYYYMMDD
  // 계좌
  currency: "",               // ← 초기에는 비워두기(2단계에서 선택)
  nickname: "",
  pin: "",
  pinNumber: "",      // 거래 PIN
  // 서버에서 채워질 값
  customerId: "",
};

/* ===================== 메인 페이지 ===================== */
export default function ForeignOpenPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(init);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // 1) /api/me 에서 고객번호 채우기
  useEffect(() => {
    (async () => {
      const r = await apiFetch("/api/foreign/open/me");
      if (!r.ok) {
        console.warn("/api/me 실패:", r.status, await r.text().catch(() => ""));
        return;
      }
      const me = await r.json();
      const id =
        me?.customerNo ?? me?.cNo ?? me?.c_no ?? me?.customerId ?? me?.id;
      const num = Number(String(id).replace(/\D+/g, ""));
      if (!Number.isNaN(num)) setForm((f) => ({ ...f, customerId: num }));
    })();
  }, []);

  // 2) 통화 목록 (서버에 있으면 교체)
  const [currencies, setCurrencies] = useState([
    { code: "USD", name: "미국 달러" },
    { code: "EUR", name: "유로" },
    { code: "JPY", name: "일본 엔" },
    { code: "CNY", name: "중국 위안" },
    { code: "GBP", name: "영국 파운드" },
    { code: "AUD", name: "호주 달러" },
    { code: "CAD", name: "캐나다 달러" },
    { code: "CHF", name: "스위스 프랑" },
    { code: "HKD", name: "홍콩 달러" },
    { code: "SGD", name: "싱가포르 달러" },
  ]);

  useEffect(() => {
    apiFetch("/api/foreign/rates")
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data) => {
          const rows = Array.isArray(data) ? data : data?.rows; // ← rows 꺼내기
          if (!Array.isArray(rows)) return;
          // 드롭다운에 맞게 단순화
          const list = rows.map(x => ({
            code: x.code || x.cur || x.curUnit,
            name: x.name || x.curNm || x.cur || "",
          })).filter(v => v.code);
          if (list.length) setCurrencies(list);
        })
        .catch(() => {});
  }, []);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  // 3) 개설
  const onSubmit = async () => {
    if (!form.agreeTerms || !form.agreePrivacy)
      return alert("필수 약관 동의가 필요합니다.");
    if (!form.name) return alert("이름을 입력해 주세요.");
    if (!/^\d{8}$/.test(form.birth))
      return alert("생년월일은 YYYYMMDD 형식으로 입력해 주세요.");
    if (!form.currency) return alert("기본 통화를 선택해 주세요.");
    if (!/^\d{4,}$/.test(form.pin))
      return alert("계좌 비밀번호는 숫자 4자리 이상이어야 합니다.");
    if (!/^\d{4,}$/.test(form.pinNumber))
      return alert("거래 PIN은 숫자 4자리 이상이어야 합니다.");
    if (!form.customerId || Number.isNaN(Number(form.customerId)))
      return alert("고객번호가 없습니다. 로그인 상태를 확인해 주세요.");

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/foreign/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Authorization은 apiFetch가 처리
        body: JSON.stringify({
          agreeTerms: form.agreeTerms ? "Y" : "N",
          agreePrivacy: form.agreePrivacy ? "Y" : "N",
          agreeMarketing: form.agreeMarketing ? "Y" : "N",
          currency: form.currency,
          pin: form.pin,
          pinNumber: Number(form.pinNumber),
          nickname: form.nickname || null,
          customerId: Number(form.customerId),
          name: form.name,
          birth: `${form.birth.slice(0, 4)}-${form.birth.slice(4, 6)}-${form.birth.slice(6, 8)}`,
        }),
      });

      if (!res.ok) {
        let msg = "";
             try {
               const data = await res.clone().json();
               msg = data?.message || JSON.stringify(data);
             } catch {
               msg = await res.text().catch(() => "");
             }
             throw new Error(`HTTP ${res.status} ${msg}`.trim());
      }
      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (e) {
      alert("개설 실패: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={"fx-container " + (step===3 && result ? "fx-center" : "")}>
        <div className="fx-grid">
          {/* 왼쪽 본문 */}
          <div className={"fx-card" + (step===3 && result ? " fx-done" : "")}>
            <h2 className="fx-title">외화가입 (비대면)</h2>
            <nav className="fx-steps">
              {["1 약관 동의", "2 본인 확인", "3 검토·개설"].map((t, i) => (
                <span key={i} className={step === i + 1 ? "on" : ""}>
                  {t}
                </span>
              ))}
            </nav>

            {step === 1 && (
              <Step1Terms form={form} setForm={setForm} next={next} />
            )}

            {step === 2 && (
              <Step2KYC
                form={form}
                setForm={setForm}
                currencies={currencies}
                prev={prev}
                next={next}
              />
            )}

            {step === 3 && (
              <Step3ReviewOpen
                form={form}
                setForm={setForm}
                submitting={submitting}
                prev={prev}
                onSubmit={onSubmit}
                result={result}
              />
            )}
          </div>

          {/* 오른쪽 요약박스 (SummaryBox) — 완료 화면(step===3 && result)에서는 숨김 */}
          {!(step === 3 && result) && (
            <aside
              className="fx-card"
              style={{ position: "sticky", top: 16, height: "fit-content" }}
            >
              <SummaryBox form={form} step={step} currencies={currencies} />
            </aside>
          )}

        </div>
      </div>

      <div className="fx-container" style={{ marginTop: 12 }}>
        <NoticeBar>
          <div>
            • 환율·수수료는 수시로 변동되며 실제 체결 환율과 다를 수 있습니다.<br />
            • 외화 상품은 환율 변동에 따라 <b>원금 손실</b>이 발생할 수 있습니다.<br />
            • 영업시간 외 신청은 <b>다음 영업일 처리</b>될 수 있습니다.
          </div>
        </NoticeBar>
      </div>
    </>
  );
}

/* ===================== Step 1 ===================== */
function Step1Terms({ form, setForm, next }) {
  const toggleAll = (v) =>
    setForm((f) => ({
      ...f,
      agreeAll: v,
      agreeTerms: v,
      agreePrivacy: v,
      agreeRisk: v, // 외화 계좌에 새로 추가된 필수 약관
      agreeProduct: v, // 외화 계좌에 새로 추가된 필수 약관
      agreeMarketing: v,
    }));

  // 필수 약관이 모두 동의되었는지 확인하는 로직
  const allRequiredAgreed = form.agreeTerms && form.agreePrivacy && form.agreeRisk && form.agreeProduct;

  return (
    <>
      <p className="fx-muted">비대면 외화 입출금 계좌 개설을 위한 필수 약관 및 상품 설명서를 확인해 주세요.</p>

      <label className="fx-check fx-check--all">
        <input
          type="checkbox"
          checked={form.agreeAll}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <b>전체 동의 (필수 및 선택 포함)</b>
      </label>

      {/* 1. 외화 예금 거래 기본 약관 (필수) */}
      <details className="fx-acc" open>
        <summary>외화 예금 거래 기본 약관 (필수)</summary>
        <div className="terms-box">
          <p>
            제1조 (목적) 이 약관은 e.um 뱅크와 고객 사이에 외화예금 거래에 관하여 필요한 사항을 정함을 목적으로 합니다.
          </p>
          <p>
            제3조 (거래의 종류) 외화예금 거래는 외화 보통예금, 외화 저축예금, 외화 정기예금 등 당행이 취급하는 외화예금 상품을 대상으로 합니다.
          </p>
          <p>
            제5조 (환율의 적용) 입금 및 출금 시 환율은 외국환은행 고시 환율을 적용하며, 고객이 선택한 통화의 매매기준율, 현찰 매매율 등을 고려하여 정합니다.
          </p>
          <p className="important-text">
             <i className="fas fa-exclamation-triangle"></i> 본 약관은 고객의 외화 거래 시 기본이 되는 계약이며, 반드시 동의해야 계좌 개설이 가능합니다.
          </p>
        </div>
        <label className="fx-check">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={(e) =>
              setForm((f) => ({ ...f, agreeTerms: e.target.checked }))
            }
          />
          위 내용을 읽고 필수 동의합니다.
        </label>
      </details>

      {/* 2. 환율 변동 위험 고지 및 확인서 (필수 - 외화 계좌의 핵심) */}
      <details className="fx-acc" open>
        <summary>환율 변동 위험 고지 및 확인서 (필수)</summary>
        <div className="terms-box fx-risk-box">
          <p>
            1. 외화 상품의 원금 손실 가능성 고지: 외화 예금은 예금자 보호 대상 상품이지만, **환율 변동에 따라 원화로 환산 시 원금 손실이 발생**할 수 있습니다.
          </p>
          <p>
            2. 환전 수수료: 외화 매입(TTB) 및 매도(TTS) 시 은행의 스프레드(수수료)가 적용됩니다. 이는 외화 현찰 시와 비대면 거래 시 다를 수 있습니다.
          </p>
          <p>
            3. 중요 확인: 고객은 상기 환율 변동 위험을 충분히 인지하고 이해하였으며, 이에 동의함을 확인합니다.
          </p>
        </div>
        <label className="fx-check">
          <input
            type="checkbox"
            checked={form.agreeRisk}
            onChange={(e) =>
              setForm((f) => ({ ...f, agreeRisk: e.target.checked }))
            }
          />
          환율 변동 위험을 충분히 인지하고 필수 동의합니다.
        </label>
      </details>

      {/* 3. 외화 입출금 계좌 상품 설명서 (필수) */}
      <details className="fx-acc">
        <summary>외화 입출금 계좌 상품 설명서 (필수)</summary>
        <div className="terms-box">
           <p>
             상품명: e.um 뱅크 외화드림 자유입출금 예금<br/>
             예금자 보호: 본 외화 예금은 예금자 보호법에 따라 보호되지 않습니다. (단, 원화 환산 잔액은 국내 규정에 따름)<br/>
             이자 지급: 통화별로 정해진 이자율에 따라 월별 또는 분기별로 지급됩니다.<br/>
             거래 제한: 일부 고시 통화에 대해 현찰 입출금 및 해외 송금이 제한될 수 있습니다.
           </p>
        </div>
        <label className="fx-check">
          <input
            type="checkbox"
            checked={form.agreeProduct}
            onChange={(e) =>
              setForm((f) => ({ ...f, agreeProduct: e.target.checked }))
            }
          />
          상품 설명서를 충분히 읽고 필수 동의 합니다.
        </label>
      </details>

      {/* 4. 개인정보 수집·이용 동의 (필수) */}
      <details className="fx-acc">
        <summary>개인정보 수집·이용 동의 (필수)</summary>
        <div className="terms-box">
          <p>
            수집 목적: 외화 계좌 개설 및 관리, 외국환 거래법상 의무 이행<br/>
            수집 항목: 성명, 주민등록번호, 연락처, 거래 내역 등<br/>
            보유 기간: 거래 종료일로부터 5년 (관계 법령 기준)
          </p>
        </div>
        <label className="fx-check">
          <input
            type="checkbox"
            checked={form.agreePrivacy}
            onChange={(e) =>
              setForm((f) => ({ ...f, agreePrivacy: e.target.checked }))
            }
          />
          개인정보 수집·이용에 *필수 동의* 합니다.
        </label>
      </details>

      {/* 5. 마케팅 정보 수신 동의 (선택) */}
      <details className="fx-acc">
        <summary>마케팅 정보 수신 동의 (선택)</summary>
        <div className="terms-box">
          <p>신규 외화 상품 및 환율 알림 서비스, 이벤트 안내 수신 동의 (선택)</p>
        </div>
        <label className="fx-check">
          <input
            type="checkbox"
            checked={form.agreeMarketing}
            onChange={(e) =>
              setForm((f) => ({ ...f, agreeMarketing: e.target.checked }))
            }
          />
          이메일/문자로 안내받겠습니다. (선택)
        </label>
      </details>

      <div style={{ marginTop: 12 }}>
        <button
          className="fx-btn fx-btn--primary"
          onClick={next}
          disabled={!allRequiredAgreed} // 필수 약관 4개 모두 동의해야 다음 단계로 이동 가능
        >
          다음 단계
        </button>
      </div>
    </>
  );
}

/* ===================== Step 2 ===================== */
function Step2KYC({ form, setForm, currencies, prev, next }) {
  const onlyDigits = (s) => (s || "").replace(/\D+/g, "");

  const canNext = !!form.name && /^\d{8}$/.test(form.birth) && !!form.currency;

  return (
    <>
      <p className="fx-muted">본인 정보 입력 및 기본 통화 선택</p>

      <label className="fx-field">
        <span>이름</span>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.trim() }))}
          placeholder="홍길동"
        />
      </label>

      <label className="fx-field">
        <span>생년월일</span>
        <input
          value={form.birth}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              birth: onlyDigits(e.target.value).slice(0, 8),
            }))
          }
          placeholder="YYYYMMDD"
          inputMode="numeric"
        />
      </label>

      <label className="fx-field" style={{ marginTop: 12 }}>
        <span>기본 통화</span>
        <select
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
        >
          {/* 선택 전 상태용 플레이스홀더 */}
          <option value="">-- 기본 통화 선택 --</option>

          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </label>
      <p className="fx-help">선택한 통화로 외화 입출금 계좌가 개설됩니다.</p>

      <div style={{ marginTop: 12 }}>
        <button className="fx-btn" onClick={prev}>
          이전
        </button>
        <button className="fx-btn fx-btn--primary" onClick={next} disabled={!canNext}>
          다음 단계
        </button>
      </div>
    </>
  );
}

/* ===================== Step 3 ===================== */
function Step3ReviewOpen({ form, setForm, submitting, prev, onSubmit, result }) {
  const done = !!result;

  if (done) {
    const nick = result.nickname ?? form.nickname ?? "-";
      return (
        <>
          <h3 className="fx-subtitle">개설 완료</h3>
          {/* 계좌번호 */}
          <p className="fx-datarow">
            <b>계좌번호</b><span>{result.accountNo}</span>
          </p>
          {/* 통화 / 유형 / 별칭 (촘촘하게 한 줄) */}
          <p className="fx-row-3">
           <b>통화</b><span>{result.currency}</span>
            <b>유형</b><span>{result.accountType}</span>
            <b>별칭</b><span>{nick}</span>
          </p>
          {/* 개설일 */}
          <p className="fx-datarow">
            <b>개설일</b><span>{new Date(result.openedAt).toLocaleString()}</span>
          </p>
        </>
      );
  }

  return (
    <>
      <p className="fx-muted">입력 정보를 확인하고 계좌 별칭/비밀번호를 설정해 주세요.</p>

      <div className="fx-review">
        <div className="fx-review__row">
          <span>이름</span><b>{form.name || "-"}</b>
        </div>
        <div className="fx-review__row">
          <span>생년월일</span><b>{form.birth || "-"}</b>
        </div>
        <div className="fx-review__row">
          <span>기본 통화</span><b>{form.currency || "-"}</b>
        </div>
      </div>

      <label className="fx-field" style={{ marginTop: 12 }}>
        <span>계좌 별칭(선택)</span>
        <input
          value={form.nickname}
          onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
        />
      </label>
      <label className="fx-field">
        <span>계좌 비밀번호(4+자리)</span>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d*"
          value={form.pin}
          onChange={(e) =>
            setForm((f) => ({ ...f, pin: e.target.value.replace(/\D+/g, "") }))
          }
        />
      </label>

      <label className="fx-field">
         <span>거래 PIN(4+자리)</span>
         <input
           type="password"
           inputMode="numeric"
           pattern="\d*"
           value={form.pinNumber}
           onChange={(e) =>
             setForm((f) => ({ ...f, pinNumber: e.target.value.replace(/\D+/g, "") }))
           }
         />
      </label>

      <div style={{ marginTop: 12 }}>
        <button className="fx-btn" onClick={prev}>이전</button>
        <button
          className="fx-btn fx-btn--primary"
          onClick={onSubmit}
          disabled={
             submitting ||
             !form.pin || form.pin.length < 4 ||
             !form.pinNumber || form.pinNumber.length < 4 ||
             !form.customerId
          }
        >
          {submitting ? "개설 중..." : "계좌 개설"}
        </button>
      </div>

      {!form.customerId && (
        <div className="fx-help fx-help--warn" style={{ marginTop: 8 }}>
          고객번호를 불러오지 못했습니다. 로그인 상태를 확인해 주세요.
        </div>
      )}
    </>
  );
}

/* ===================== 오른쪽 요약 박스 ===================== */
function SummaryBox({ form, step, currencies }) {
  const currencyName =
    currencies.find((c) => c.code === form.currency)?.name || "-";

  const needs = {
    terms:  !!form.agreeTerms && !!form.agreePrivacy,
    name:   !!form.name,
    birth:  /^\d{8}$/.test(form.birth),
    // step 2 이상이고 실제로 선택했을 때만 충족으로 판단
    cur:    step >= 2 && !!form.currency,
    pin:    /^\d{4,}$/.test(form.pin),
  };

  const missing =
    (step >= 1 ? (!needs.terms ? ["필수 약관"] : []) : [])
      .concat(step >= 2 ? [
        !needs.name  && "이름",
        !needs.birth && "생년월일",
        !needs.cur   && "기본 통화",
      ].filter(Boolean) : [])
      .concat(step >= 3 ? (!needs.pin ? ["계좌 비밀번호"] : []) : []);

  return (
    <>
      <h3 className="fx-subtitle">가입 요약</h3>

      {/* 상태 칩 */}
      <div style={{ marginBottom: 8 }}>
        <Chip ok={needs.terms}                 label="약관" />
        <Chip ok={needs.name && needs.birth}   label="본인정보" />
        <Chip ok={needs.cur}                   label="통화" />
        <Chip ok={step === 3 ? needs.pin : false} dim={step < 3} label="비밀번호" />
      </div>

      {/* 핵심 정보 */}
      <ul className="fx-list">
        <li>
          기본 통화: <b>{form.currency || "-"}{form.currency ? ` · ${currencyName}` : ""}</b>
        </li>
        <li>외화 입출금: <b>가능</b></li>
        <li>수수료(예시): 환전 1.75%</li>
        {step >= 2 && (
          <>
            <li>이름: <b>{form.name || "-"}</b></li>
            <li>생년월일: <b>{form.birth || "-"}</b></li>
          </>
        )}
        {step >= 3 && <li>별칭: <b>{form.nickname || "-"}</b></li>}
      </ul>

      {/* 미입력 경고 */}
      {missing.length > 0 && (
        <div className="fx-help fx-help--warn" style={{ marginTop: 8 }}>
          아직 미입력: {missing.join(", ")}
        </div>
      )}
    </>
  );
}

function Chip({ ok, label, dim }) {
  const cls = ok ? "chip chip--ok" : "chip chip--bad";
  const style = {
    display: "block",      // 세로로 한 줄씩
    marginBottom: 6,
    ...(dim ? { opacity: 0.5 } : {}),
  };
  return <span className={cls} style={style}>{label}{ok ? " ✔" : " •"}</span>;
}
