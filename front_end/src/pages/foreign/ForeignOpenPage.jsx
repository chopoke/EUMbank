// src/pages/foreign/ForeignOpenPage.jsx
import { useEffect, useState } from "react";
import NoticeBar from "../../components/NoticeBar";

/* ===== PIN 모달 재사용 (경로 주의: pinConponent 오타 그대로) ===== */
import Modal from "../account/component/pinConponent/Modal";
import { PinPadModal } from "../account/component/pinConponent/PinPadModal"; // default export라면 {} 제거
import "../account/component/pinConponent/modal.css";

/* ===================== 서버 주소 ===================== */
const API_BASE = "http://localhost:8081";

/* ===================== 공통 fetch 래퍼 ===================== */
const getAccessToken = () => localStorage.getItem("access");
const getRefreshToken = () => localStorage.getItem("refresh");

async function apiFetch(url, options = {}) {
  const fullUrl = /^https?:\/\//i.test(url) ? url : API_BASE + url.replace(/^\/?/, "/");
  const access = getAccessToken();
  const headers = {
    ...(options.headers || {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  const res = await fetch(fullUrl, { credentials: "include", ...options, headers });

  try {
    const cloned = res.clone();
    const txt = await cloned.text();
    console.log("[apiFetch]", options.method || "GET", fullUrl, "→", res.status, res.statusText, "\n", txt);
  } catch {}

  // 토큰 리프레시
  if (res.status !== 401 || options._retry) return res;
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
    const data = await r.json();
    if (!data?.access) return res;
    localStorage.setItem("access", data.access);
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
  agreeRisk: false,
  agreeProduct: false,

  // 본인확인
  name: "",
  englishName: "",
  englishNameLocked: false, // DB에 있으면 잠금
  birth: "",       // YYYYMMDD
  pinNumber: "",   // 거래 PIN(6)

  // 검토·개설
  currency: "",
  nickname: "",
  pin: "",         // 계좌 비밀번호(6)

  // 미리보기 계좌번호
  previewAccountNo: "",

  // 서버에서 채워질 값
  customerId: "",
};

/* ===================== 메인 페이지 ===================== */
export default function ForeignOpenPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(init);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // 1) 내 정보(고객번호 + 영문이름) 채우기
  useEffect(() => {
    (async () => {
      const r = await apiFetch("/api/foreign/open/me");
      if (!r.ok) {
        console.warn("/api/foreign/open/me 실패:", r.status, await r.text().catch(() => ""));
        return;
      }
      const me = await r.json();
      const id = me?.customerNo ?? me?.cNo ?? me?.c_no ?? me?.customerId ?? me?.id;
      const num = Number(String(id).replace(/\D+/g, ""));
      const cNameEn = me?.c_name_en ?? me?.cNameEn ?? "";
      if (!Number.isNaN(num)) {
        setForm((f) => ({
          ...f,
          customerId: num,
          englishName: cNameEn || f.englishName,
          englishNameLocked: !!cNameEn,
        }));
      }
    })();
  }, []);

  // 2) 통화 목록
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
        const rows = Array.isArray(data) ? data : data?.rows;
        if (!Array.isArray(rows)) return;
        const list = rows
          .map((x) => ({
            code: x.code || x.cur || x.curUnit,
            name: x.name || x.curNm || x.cur || "",
          }))
          .filter((v) => v.code);
        if (list.length) setCurrencies(list);
      })
      .catch(() => {});
  }, []);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  // 3) 개설 요청
  const onSubmit = async () => {
    if (!form.agreeTerms || !form.agreePrivacy || !form.agreeRisk || !form.agreeProduct)
      return alert("필수 약관 동의가 필요합니다.");

    if (!form.name) return alert("이름을 입력해 주세요.");
    if (!(form.englishNameLocked || form.englishName)) return alert("영문 이름을 입력해 주세요.");
    if (!/^\d{8}$/.test(form.birth)) return alert("생년월일은 YYYYMMDD 형식으로 입력해 주세요.");
    if (!/^\d{6}$/.test(form.pinNumber)) return alert("거래 PIN은 숫자 6자리여야 합니다.");

    if (!form.currency) return alert("기본 통화를 선택해 주세요.");
    if (!/^\d{6}$/.test(form.pin)) return alert("계좌 비밀번호는 숫자 6자리여야 합니다.");

    if (!form.customerId || Number.isNaN(Number(form.customerId)))
      return alert("고객번호가 없습니다. 로그인 상태를 확인해 주세요.");

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/foreign/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreeTerms: form.agreeTerms ? "Y" : "N",
          agreePrivacy: form.agreePrivacy ? "Y" : "N",
          agreeMarketing: form.agreeMarketing ? "Y" : "N",
          agreeRisk: form.agreeRisk ? "Y" : "N",
          agreeProduct: form.agreeProduct ? "Y" : "N",

          // 계좌
          currency: form.currency,
          pin: form.pin, // 6자리
          pinNumber: Number(form.pinNumber), // 6자리
          nickname: form.nickname || null,
          preferredAccountNo: form.previewAccountNo || null,

          // 본인확인
          customerId: Number(form.customerId),
          name: form.name,
          englishName: form.englishName,
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
      <div className={"fx-container " + (step === 3 && result ? "fx-center" : "")}>
        <div className="fx-grid">
          {/* 왼쪽 본문 */}
          <div className={"fx-card" + (step === 3 && result ? " fx-done" : "")}>
            <h2 className="fx-title">외화가입 (비대면)</h2>
            <nav className="fx-steps">
              {["1 약관 동의", "2 본인 확인", "3 검토·개설"].map((t, i) => (
                <span key={i} className={step === i + 1 ? "on" : ""}>
                  {t}
                </span>
              ))}
            </nav>

            {step === 1 && <Step1Terms form={form} setForm={setForm} next={next} />}

            {step === 2 && (
              <Step2KYC form={form} setForm={setForm} prev={prev} next={next} />
            )}

            {step === 3 && (
              <Step3ReviewOpen
                form={form}
                setForm={setForm}
                submitting={submitting}
                prev={prev}
                onSubmit={onSubmit}
                result={result}
                currencies={currencies}
              />
            )}
          </div>

          {/* 오른쪽 요약 박스 — 완료 화면에서는 숨김 */}
          {!(step === 3 && result) && (
            <aside className="fx-card" style={{ position: "sticky", top: 16, height: "fit-content" }}>
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
/** 서버/정적에서 약관 본문 로드 + 스크롤 끝까지 내려야 동의 가능 */
function Step1Terms({ form, setForm, next }) {
  const [loading, setLoading] = useState(true);
  const [termsList, setTermsList] = useState([]);

  // 전체 동의
  const toggleAll = (v) =>
    setForm((f) => ({
      ...f,
      agreeAll: v,
      agreeTerms: v,
      agreePrivacy: v,
      agreeRisk: v,
      agreeProduct: v,
      agreeMarketing: v,
    }));

  // 약관 로드 (서버 미구현 시 폴백 사용)
  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch("/api/foreign/terms");
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length) {
            setTermsList(data);
            setLoading(false);
            return;
          }
        }
        setTermsList(fallbackTerms); // 폴백
      } catch {
        setTermsList(fallbackTerms);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allRequiredAgreed =
    form.agreeTerms && form.agreePrivacy && form.agreeRisk && form.agreeProduct;

  return (
    <>
      <p className="fx-muted">비대면 외화 입출금 계좌 개설을 위한 필수 약관 및 상품 설명서를 확인해 주세요.</p>

      <label className="fx-check fx-check--all" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={form.agreeAll} onChange={(e) => toggleAll(e.target.checked)} />
        <b>전체 동의 (필수 및 선택 포함)</b>
      </label>

      {loading ? (
        <div className="terms-box">약관을 불러오는 중…</div>
      ) : (
        <>
          {termsList.map((t) => (
            <TermsSection
              key={t.key}
              title={t.title}
              required={t.required}
              body={t.body}
              agreed={
                t.key === "terms" ? form.agreeTerms :
                t.key === "risk" ? form.agreeRisk :
                t.key === "product" ? form.agreeProduct :
                t.key === "privacy" ? form.agreePrivacy :
                t.key === "marketing" ? form.agreeMarketing : false
              }
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  agreeAll: false, // 개별 체크 시 전체동의 해제
                  ...(t.key === "terms" && { agreeTerms: v }),
                  ...(t.key === "risk" && { agreeRisk: v }),
                  ...(t.key === "product" && { agreeProduct: v }),
                  ...(t.key === "privacy" && { agreePrivacy: v }),
                  ...(t.key === "marketing" && { agreeMarketing: v }),
                }))
              }
            />
          ))}
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="fx-btn fx-btn--primary" onClick={next} disabled={!allRequiredAgreed}>
          다음 단계
        </button>
        {!allRequiredAgreed && (
          <div className="fx-help fx-help--warn" style={{ marginTop: 8 }}>
            필수 항목을 모두 확인·동의해 주세요.
          </div>
        )}
      </div>
    </>
  );
}

/** 개별 약관 블록 – 스크롤 바닥 감지 후 체크 활성화 */
function TermsSection({ title, required, body, agreed, onChange }) {
  const [scrolledEnd, setScrolledEnd] = useState(false);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    if (atBottom && !scrolledEnd) setScrolledEnd(true);
  };

  // ✅ 스크롤도 안 했고 아직 동의도 안 된 경우에만 비활성/희미 처리
  const shouldDisable = required && !scrolledEnd && !agreed;

  return (
    <details className="fx-acc" open>
      <summary>
        {title} {required ? "(필수)" : "(선택)"}
      </summary>

      <div className="terms-box terms-box--scroll" onScroll={onScroll}>
        {typeof body === "string" ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{body}</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: body?.__html || "" }} />
        )}
      </div>

      <label className="fx-check" style={{ marginTop: 8, opacity: shouldDisable ? 0.6 : 1 }}>
        <input
          type="checkbox"
          checked={!!agreed}
          disabled={shouldDisable}
          onChange={(e) => onChange(e.target.checked)}
        />
        {required ? "위 내용을 모두 확인했고 동의합니다." : "수신(선택)에 동의합니다."}
      </label>

      {shouldDisable && (
        <div className="fx-help" style={{ marginTop: 6 }}>
          하단까지 스크롤해 내용을 끝까지 확인해 주세요.
        </div>
      )}
    </details>
  );
}

/* ===================== Step 2 ===================== */
function Step2KYC({ form, setForm, prev, next }) {
  const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
  const englishOk = form.englishNameLocked || !!form.englishName;
  const canNext =
    !!form.name &&
    englishOk &&
    /^\d{8}$/.test(form.birth) &&
    /^\d{6}$/.test(form.pinNumber);

  /* PIN 모달 상태 */
  const [pinOpen, setPinOpen] = useState(false);
  const [pinStep, setPinStep] = useState("enter"); // enter | confirm
  const [pinTmp, setPinTmp] = useState("");

  return (
    <>
      <p className="fx-muted">본인 정보 입력(영문 이름 포함) 및 거래 PIN(6자리) 설정</p>

      <label className="fx-field">
        <span>이름</span>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.trim() }))}
          placeholder="홍길동"
        />
      </label>

      <label className="fx-field">
        <span>영문 이름</span>
        <input
          value={form.englishName}
          onChange={(e) => {
            if (form.englishNameLocked) return;
            setForm((f) => ({ ...f, englishName: e.target.value.toUpperCase() }));
          }}
          readOnly={form.englishNameLocked}
          placeholder="LEE MIN JUN"
        />
        {form.englishNameLocked && (
          <div className="fx-help">이미 등록된 영문이름입니다. 최초 1회만 입력 가능합니다.</div>
        )}
      </label>

      <label className="fx-field">
        <span>생년월일</span>
        <input
          value={form.birth}
          onChange={(e) => setForm((f) => ({ ...f, birth: onlyDigits(e.target.value).slice(0, 8) }))}
          placeholder="YYYYMMDD"
          inputMode="numeric"
        />
      </label>

      {/* 거래 PIN 모달 트리거 */}
      <label className="fx-field">
        <span>거래 PIN(6자리)</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="fx-btn fx-btn--primary"
            onClick={() => { setPinOpen(true); setPinStep("enter"); setPinTmp(""); }}
          >
            PIN 등록
          </button>
          <span className="fx-muted">
            {/^\d{6}$/.test(form.pinNumber) ? "등록완료: ●●●●●●" : "미등록"}
          </span>
        </div>
      </label>

      <Modal
        open={pinOpen}
        close={() => setPinOpen(false)}
        header={pinStep === "enter" ? "거래 PIN 6자리 입력" : "거래 PIN 6자리 확인"}
      >
        <PinPadModal
          key={pinStep}
          length={6}
          onSubmit={(val) => {
            if (pinStep === "enter") {
              setPinTmp(val);
              setPinStep("confirm");
            } else {
              if (pinTmp !== val) {
                alert("PIN이 일치하지 않습니다.");
                setPinStep("enter");
                return;
              }
              setForm((f) => ({ ...f, pinNumber: val }));
              setPinOpen(false);
            }
          }}
          onCancel={() => setPinOpen(false)}
        />
      </Modal>

      <div style={{ marginTop: 12 }}>
        <button className="fx-btn" onClick={prev}>이전</button>
        <button className="fx-btn fx-btn--primary" onClick={next} disabled={!canNext}>
          다음 단계
        </button>
      </div>
    </>
  );
}

/* ===================== Step 3 ===================== */
function Step3ReviewOpen({ form, setForm, submitting, prev, onSubmit, result, currencies }) {
  useEffect(() => {
    if (result) return;
    if (!form.currency) return;

    let cancelled = false;

    async function fetchPreviewWithRetry(maxTry = 4, delayMs = 300) {
      for (let i = 0; i < maxTry; i++) {
        try {
          const r = await apiFetch(
            `/api/foreign/open/preview?currency=${encodeURIComponent(form.currency)}`
          );
          if (!r.ok) {
            await new Promise(res => setTimeout(res, delayMs * Math.pow(1.6, i)));
            continue;
          }
          const data = await r.json();
          const no = data?.accountNo || data?.accNo || data?.account_no || data?.account || "";
          if (!cancelled && no) {
            setForm(f => ({ ...f, previewAccountNo: no }));
            return;
          }
        } catch {}
        await new Promise(res => setTimeout(res, delayMs * Math.pow(1.6, i)));
      }
      if (!cancelled) setForm(f => ({ ...f, previewAccountNo: "" }));
    }

    setForm(f => ({ ...f, previewAccountNo: "" }));
    fetchPreviewWithRetry();

    return () => { cancelled = true; };
  }, [form.currency, result, setForm]);

  const done = !!result;

  return (
    <>
      {done ? (
        <>
          <h3 className="fx-subtitle">개설 완료</h3>
          <p className="fx-datarow">
            <b>계좌번호</b><span>{result.accountNo}</span>
          </p>
          <p className="fx-row-3">
            <b>통화</b><span>{result.currency}</span>
            <b>유형</b><span>{result.accountType}</span>
            <b>별칭</b><span>{result.nickname ?? form.nickname ?? "-"}</span>
          </p>
          <p className="fx-datarow">
            <b>개설일</b><span>{new Date(result.openedAt).toLocaleString()}</span>
          </p>
        </>
      ) : (
        <>
          <p className="fx-muted">입력 정보를 확인하고 <b>기본 통화</b> 및 <b>계좌 비밀번호(6자리)</b>를 설정해 주세요.</p>

          <label className="fx-field">
            <span>기본 통화</span>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              <option value="">-- 기본 통화 선택 --</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="fx-help">선택한 통화로 외화 입출금 계좌가 개설됩니다.</p>

          <div className="fx-review">
            <div className="fx-review__row">
              <span>이름</span><b>{form.name || "-"}</b>
            </div>
            <div className="fx-review__row">
              <span>영문 이름</span><b>{form.englishName || "-"}</b>
            </div>
            <div className="fx-review__row">
              <span>생년월일</span><b>{form.birth || "-"}</b>
            </div>

            <div className="fx-review__row">
              <span>발급 예정 계좌번호</span>
              <b>
                {form.currency
                  ? (form.previewAccountNo || "조회 중…")
                  : "통화를 먼저 선택하세요"}
              </b>
              {form.currency && !form.previewAccountNo && (
                <button
                  className="fx-btn fx-btn--small"
                  style={{ marginLeft: 8 }}
                  onClick={() => setForm(f => ({ ...f, previewAccountNo: "" }))}
                >
                  재조회
                </button>
              )}
            </div>
          </div>

          <label className="fx-field" style={{ marginTop: 12 }}>
            <span>계좌 별칭(선택)</span>
            <input
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
          </label>

          {/* 계좌 비밀번호 — 화면에서 직접 입력 */}
          <label className="fx-field">
            <span>계좌 비밀번호(6자리)</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={form.pin}
              onChange={(e) =>
                setForm((f) => ({ ...f, pin: e.target.value.replace(/\D+/g, "").slice(0, 6) }))
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
                !/^\d{6}$/.test(form.pin) ||
                !/^\d{6}$/.test(form.pinNumber) ||
                !form.customerId ||
                !form.currency
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
      )}
    </>
  );
}

/* ===================== 오른쪽 요약 박스 ===================== */
function SummaryBox({ form, step, currencies }) {
  const currencyName = currencies.find((c) => c.code === form.currency)?.name || "-";

  const needs = {
    kyc: !!form.name && (form.englishNameLocked || !!form.englishName) && /^\d{8}$/.test(form.birth),
    pin6: /^\d{6}$/.test(form.pinNumber),
    cur: step >= 3 && !!form.currency,
    accPin: /^\d{6}$/.test(form.pin),
  };

  const missing =
    (step >= 2 ? [
      !needs.kyc && "본인정보",
      !needs.pin6 && "거래 PIN(6자리)",
    ].filter(Boolean) : [])
      .concat(step >= 3 ? [
        !needs.cur && "기본 통화",
        !needs.accPin && "계좌 비밀번호(6자리)",
      ].filter(Boolean) : []);

  return (
    <>
      <h3 className="fx-subtitle">가입 요약</h3>

      <div style={{ marginBottom: 8 }}>
        <Chip ok={needs.kyc} label="본인정보" />
        <Chip ok={needs.pin6} label="PIN(6)" />
        <Chip ok={needs.cur} label="통화" dim={step < 3} />
        <Chip ok={step === 3 ? needs.accPin : false} dim={step < 3} label="비밀번호(6)" />
      </div>

      <ul className="fx-list">
        <li>기본 통화: <b>{form.currency || "-"}{form.currency ? ` · ${currencyName}` : ""}</b></li>
        <li>외화 입출금: <b>가능</b></li>
        <li>수수료(예시): 환전 1.75%</li>
        {step >= 2 && (
          <>
            <li>이름: <b>{form.name || "-"}</b></li>
            <li>영문 이름: <b>{form.englishName || "-"}</b></li>
            <li>생년월일: <b>{form.birth || "-"}</b></li>
          </>
        )}
        {form.previewAccountNo && (
          <li>계좌번호(예정): <b>{form.previewAccountNo}</b></li>
        )}
        {step >= 3 && <li>별칭: <b>{form.nickname || "-"}</b></li>}
      </ul>

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
    display: "block",
    marginBottom: 6,
    ...(dim ? { opacity: 0.5 } : {}),
  };
  return <span className={cls} style={style}>{label}{ok ? " ✔" : " •"}</span>;
}

/* ======= 서버 미구현 시 사용하는 폴백 약관(실운영에서는 삭제) ======= */
const fallbackTerms = [
  {
    key: "terms",
    title: "외화 예금 거래 기본 약관",
    required: true,
    body:
`제1조(목적)
이 약관은 이음은행이 제공하는 외화 예금 거래의 기본 사항을 정함을 목적으로 합니다.

제2조(정의)
1. "외화 예금"은 외화로 표시된 예금을 말합니다.
2. "거래일"은 은행 영업일 중 은행이 정하는 시간 내의 거래 처리일을 말합니다.

제3조(계좌 개설)
1. 고객은 신원확인 절차를 거쳐 계좌를 개설할 수 있습니다.
2. 은행은 법령 및 내부 기준에 따라 개설을 제한할 수 있습니다.

제4조(입출금)
1. 고객은 관련 법령과 약관에 따라 입출금을 할 수 있습니다.
2. 수표·어음 등은 교환 결과에 따라 반환 또는 정정될 수 있습니다.

제5조(환율 및 수수료)
1. 적용 환율은 거래 시점의 고시환율을 원칙으로 합니다.
2. 수수료 부과 기준은 은행이 정하여 고시합니다.`
  },
  {
    key: "risk",
    title: "환율 변동 위험 고지 및 확인서",
    required: true,
    body:
`외화 상품은 환율 변동에 따라 원금 손실이 발생할 수 있습니다.
• 환율 급변 시 손실이 확대될 수 있습니다.
• 국가·시장 위험에 따라 유동성 제약이 발생할 수 있습니다.
• 과거의 수익률은 미래의 수익률을 보장하지 않습니다.`
  },
  {
    key: "product",
    title: "외화 입출금 계좌 상품 설명서",
    required: true,
    body:
`상품명: 외화 입출금 계좌
기본 기능: 외화 입·출금, 환전, 해외송금 연계 등
수수료: 은행 고시 기준에 따름
유의사항: 환율 변동 위험 및 영업시간 외 처리 기준을 반드시 확인하세요.`
  },
  {
    key: "privacy",
    title: "개인정보 수집·이용 동의",
    required: true,
    body:
`수집 항목: 성명, 생년월일, 연락처, 식별값(DI/CI) 등
이용 목적: 본인확인, 계좌개설 및 거래관리, 민원처리 등
보유 기간: 관련 법령의 보존기간 동안 보관`
  },
  {
    key: "marketing",
    title: "마케팅 정보 수신 동의",
    required: false,
    body:
`이벤트/혜택, 신규 서비스 안내 수신(선택)`
  },
];
