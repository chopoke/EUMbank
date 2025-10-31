import { useEffect, useMemo, useState } from "react";
import "../../resources/css/foreign.css";
import api from "../../api/axios";

const TYPE_LABEL = {
  TERM_DEPOSIT: "정기예금",
  FREE_DEPOSIT: "자유예금",
  MMF: "MMF",
  ETF_SAVINGS: "ETF 적립",
  GENERAL: "외화예금",
};

function fmtNum(n) {
  if (n == null) return "-";
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return "-";
  return v.toLocaleString();
}

function ProductCard({ p }) {
  // 스프레드(대략적인 환전 수수료 비율)
  const spreadPct = useMemo(() => {
    if (!p?.ttb || !p?.tts || !p?.dealBasR) return null;
    const ttb = Number(p.ttb);
    const tts = Number(p.tts);
    const base = Number(p.dealBasR);
    if ([ttb, tts, base].some(Number.isNaN) || base === 0) return null;
    return ((tts - ttb) / base) * 100;
  }, [p]);

  const title =
    (TYPE_LABEL[p?.prodType] || "외화예금") +
    (p?.termMon ? ` ${p.termMon}M` : "");

  // ✅ 상태 배지 (색상 포함)
  const chips = [
    p?.dpProtectYn === "Y"
      ? { label: "예금자보호", tone: "green" }
      : { label: "비보호", tone: "red" },
    p?.ioYn === "Y"
      ? { label: "입출금 가능", tone: "purple" }
      : { label: "입출금 불가", tone: "yellow" },
    // 선택: 만기지급식 표시는 색상 없이 회색 기본 배지로
    p?.prodType === "TERM_DEPOSIT" ? { label: "만기지급식", tone: "" } : null,
  ].filter(Boolean);

  return (
    <article className="fx-card">
      <header className="fx-card__header">
        <div className="fx-card__cap">
          <div className="fx-card__subtitle">
            {p?.curUnit} · {TYPE_LABEL[p?.prodType] || "외화예금"}
          </div>
          <h3 className="fx-card__title">{title}</h3>

          <div className="fx-chips">
            {chips.map((c, i) => (
              <span
                key={i}
                className={`fx-chip${c.tone ? ` fx-chip--${c.tone}` : ""}`}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
        {/* ⛔ APY 뱃지 영역 제거 */}
      </header>

      <dl className="fx-kv">
        <div className="fx-kv__row">
          <dt>통화</dt>
          <dd className="fx-value text-right">{p?.curUnit || "-"}</dd>
        </div>
        <div className="fx-kv__row">
          <dt>기간</dt>
          <dd className="fx-value">
            {p?.termMon ? `${p.termMon}개월` : "자유입출금"}
          </dd>
        </div>
        <div className="fx-kv__row">
          <dt>매매기준율</dt>
          <dd className="fx-value text-right">{fmtNum(p?.dealBasR)}</dd>
        </div>
        <div className="fx-kv__row">
          <dt>송금(사다)</dt>
          <dd className="fx-value text-right">{fmtNum(p?.ttb)}</dd>
        </div>
        <div className="fx-kv__row">
          <dt>송금(팔때)</dt>
          <dd className="fx-value text-right">{fmtNum(p?.tts)}</dd>
        </div>
        <div className="fx-kv__row">
          <dt>스프레드</dt>
          <dd className="fx-value text-right">
            {spreadPct == null ? "-" : `${spreadPct.toFixed(2)}%`}
          </dd>
        </div>
      </dl>

      <footer className="fx-card__footer">
        <button className="fx-btn fx-btn--primary" type="button">
          가입하기
        </button>
      </footer>
    </article>
  );
}

export default function ForeignProductsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // const res = await fetch("/api/foreign/products?size=20&sort=id,asc");
        // const data = await res.json();
        const { data } = await api.get("/api/foreign/products", {
          params: { size: 20, sort: "id,asc" },
        });
        setRows(Array.isArray(data?.content) ? data.content : []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="fx-page">
        <div className="fx-loading">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="fx-page">
      <div className="fx-page__head">
        <h1>외화예금상품</h1>
        <p className="fx-page__hint">
          정기/자유 · 예금자보호 · 환율(송금/매매기준) 정보를 한눈에 확인하세요.
        </p>
      </div>

      <div className="fx-grid">
        {rows.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
        {rows.length === 0 && (
          <div className="fx-empty">표시할 상품이 없습니다.</div>
        )}
      </div>
    </div>
  );
}