import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "../../resources/css/foreign.css";
import NoticeBar from "../../components/NoticeBar";

// 숫자 포맷
const fmt = (v) => (v == null || isNaN(v) ? "-" : Number(v).toLocaleString());

// 간단한 날짜 포맷
const fmtDateTime = (d) =>
  !d
    ? "-"
    : new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);

export default function ForeignRatePage() {
  const [rows, setRows] = useState([]);           // ← 이제 rates 배열을 그대로 받음
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState("USD");          // 선택 통화
  const [showCalc, setShowCalc] = useState(false);

  // 마지막 갱신 시각 + 실시간 경과 초
  const [lastUpdated, setLastUpdated] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // 초 카운터
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/foreign/rates");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      setElapsed(0);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const curRow = useMemo(() => rows.find((r) => r.curUnit === cur), [rows, cur]);

  if (loading) {
    return (
      <div className="fx-page">
        <div className="fx-loading">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="fx-page" style={{ maxWidth: 1200 }}>
      <div className="fx-page__head">
        <h1>환율 정보</h1>
        <p className="fx-page__hint">
          실시간 갱신분(스케줄), 매매기준/매입(TTB)/매도(TTS) 환율을 확인하고 간이 계산기를 사용할 수 있어요.
        </p>
      </div>

      <div className="fr-grid-2">
        {/* ===== 좌: 주요 환율 카드 ===== */}
        <section className="fr-card">
          <header className="fr-card__head">
            <h3>주요 환율</h3>
          </header>

          {/* 메타(업데이트/실시간/새로고침) */}
          <div className="fr-meta">
            <div className="fr-meta__item">
              <span className="fr-meta__label">업데이트</span>
              <span className="fr-meta__value">{fmtDateTime(lastUpdated)}</span>
            </div>
            <div className="fr-meta__item">
              <span className="fr-meta__label">실시간</span>
              <span className="fr-meta__pill">ON</span>
              <span className="fr-meta__sub">({elapsed}초)</span>
            </div>
            <button className="fr-link-btn" onClick={load}>새로고침</button>
          </div>

          {/* 통화 선택 */}
          <div className="fr-row">
            <label className="fr-key">통화</label>
            <div className="fr-val">
              <select value={cur} onChange={(e) => setCur(e.target.value)}>
                {rows.map((r) => (
                  <option key={r.curUnit} value={r.curUnit}>
                    {r.curUnit} · {r.curNm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 값들은 전부 우측 정렬 */}
          <div className="fr-row">
            <label className="fr-key">매매기준율</label>
            <div className="fr-val fr-num">{fmt(curRow?.dealBasR)}</div>
          </div>
          <div className="fr-row">
            <label className="fr-key">파실 때</label>
            <div className="fr-val fr-num">{fmt(curRow?.ttb)}</div>
          </div>
          <div className="fr-row">
            <label className="fr-key">사실 때</label>
            <div className="fr-val fr-num">{fmt(curRow?.tts)}</div>
          </div>

          <footer className="fr-actions">
            {/* 계산기 */}
            <button className="fx-btn fx-btn--primary" onClick={() => setShowCalc(true)}>
              계산하기
            </button>
            <Link to="/foreign/open" className="fr-link-btn fr-link-btn--center">
              외화계좌 개설
            </Link>
          </footer>
        </section>

        {/* ===== 우: 요약 테이블 ===== */}
        <section className="fr-card">
          <header className="fr-card__head">
            <h3>주요 통화 요약</h3>
          </header>

          <div className="fr-table-wrap">
            <table className="fr-table">
              <thead>
                <tr>
                  <th>통화</th>
                  <th className="text-right">기준</th>
                  <th className="text-right">파실 때</th>
                  <th className="text-right">사실 때</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r) => (
                  <tr key={r.curUnit}>
                    <td className="text-right">{r.curUnit}</td>
                    <td className="text-right">{fmt(r.dealBasR)}</td>
                    <td className="text-right">{fmt(r.ttb)}</td>
                    <td className="text-right">{fmt(r.tts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ====== 경고 바 삽입 ====== */}
       <NoticeBar>
          <div>
            • 환율·수수료는 수시로 변동되며 실제 체결 환율과 다를 수 있습니다.<br/>
            • 외화 상품은 환율 변동에 따라 <b>원금 손실</b>이 발생할 수 있습니다.<br/>
            • 영업시간 외 신청은 <b>다음 영업일 처리</b>될 수 있습니다.
          </div>
        </NoticeBar>

      {/* ===== 계산기 모달 ===== */}
      {showCalc && (
        <CalcModal
          onClose={() => setShowCalc(false)}
          base={curRow?.dealBasR}
          ttb={curRow?.ttb}
          tts={curRow?.tts}
          cur={curRow?.curUnit}
        />
      )}
    </div>
  );
}

/** 계산기 모달 */
function CalcModal({ onClose, base, ttb, tts, cur }) {
  const [mode, setMode] = useState("buy");   // buy: 원화→외화(TTB), sell: 외화→원화(TTS)
  const [amount, setAmount] = useState(1000);
  const [feePct, setFeePct] = useState(1.75);

  const result = useMemo(() => {
    const a = Number(amount) || 0;
    const fee = Number(feePct) / 100;
    if (mode === "buy") {
      if (!ttb) return null;
      return a / (Number(ttb) * (1 + fee));          // 원화 → 외화
    }
    if (!tts) return null;
    return a * (Number(tts) * (1 - fee));            // 외화 → 원화
  }, [mode, amount, feePct, ttb, tts]);

  return (
    <div className="fx-modal__backdrop" onClick={onClose}>
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <header className="fx-modal__head">
          <h3>환율 계산기</h3>
          <button className="fx-modal__close" onClick={onClose} aria-label="닫기">×</button>
        </header>

        <div className="fx-modal__body">
          <div className="fr-row">
            <label className="fr-key">모드</label>
            <div className="fr-val">
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="buy">원화 → {cur} (사실 때)</option>
                <option value="sell">{cur} → 원화 (파실 때)</option>
              </select>
            </div>
          </div>

          <div className="fr-row">
            <label className="fr-key">금액</label>
            <div className="fr-val">
              <input type="number" value={amount} min="0" onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="fr-row">
            <label className="fr-key">수수료(%)</label>
            <div className="fr-val">
              <input type="number" value={feePct} step="0.25" min="0" onChange={(e) => setFeePct(e.target.value)} />
            </div>
          </div>

          <div className="fr-divider" />

          <div className="fr-row">
            <label className="fr-key">매매기준율</label>
            <div className="fr-val fr-num">{fmt(base)}</div>
          </div>
          <div className="fr-row">
             <label className="fr-key">파실 때</label>
             <div className="fr-val fr-num">{fmt(ttb)}</div>
          </div>
          <div className="fr-row">
             <label className="fr-key">사실 때</label>
             <div className="fr-val fr-num">{fmt(tts)}</div>
          </div>

          <div className="fr-result">
            <div className="fr-result__label">예상 수취</div>
            <div className="fr-result__value">
              {result == null ? "—" : result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="fr-result__unit">{mode === "buy" ? ` ${cur}` : " KRW"}</span>
            </div>
          </div>
        </div>

        <footer className="fx-modal__foot">
          <button className="fx-btn" onClick={onClose}>닫기</button>
        </footer>
      </div>
    </div>
  );
}
