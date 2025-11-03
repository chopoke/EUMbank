// src/pages/foreign/ForeignRatePage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "../../resources/css/foreign.css";
import NoticeBar from "../../components/NoticeBar";
import { Chart } from "react-google-charts";
import api from "../../api/axios";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState("USD");
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
      // const res = await fetch("/api/foreign/rates");
      // if (!res.ok) {
      //   const text = await res.text();
      //   console.error("GET /api/foreign/rates FAILED:", res.status, text);
      //   setRows([]);
      //   return;
      // }
      // const data = await res.json();
      const { data } = await api.get("/api/foreign/rates");

      const rateRows = Array.isArray(data.rows) ? data.rows : [];
      setRows(rateRows);

      if (data.updatedAt) {
        setLastUpdated(new Date(data.updatedAt));
      } else {
        setLastUpdated(new Date());
      }
      setElapsed(0);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const curRow = useMemo(
    () => rows.find((r) => r.curUnit === cur),
    [rows, cur]
  );

  if (loading) {
    return (
      <div className="fx-page">
        <div className="fx-loading">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="fx-page" style={{ maxWidth: 1280 }}>
      <div className="fx-page__head">
        <h1>환율 정보</h1>
        <p className="fx-page__hint">
          실시간 갱신분(스케줄), 매매기준/사실때/파실때 환율을 확인하고 간이 계산기를 사용할 수 있어요.
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
            <button className="fr-link-btn" onClick={load}>
              새로고침
            </button>
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
            <label className="fr-key">파실 때(TTB)</label>
            <div className="fr-val fr-num">{fmt(curRow?.ttb)}</div>
          </div>
          <div className="fr-row">
            <label className="fr-key">사실 때(TTS)</label>
            <div className="fr-val fr-num">{fmt(curRow?.tts)}</div>
          </div>

          <footer className="fr-actions">
            {/* 계산기 */}
            <button
              className="fx-btn fx-btn--primary"
              onClick={() => setShowCalc(true)}
            >
              계산하기
            </button>

            {/* 환전 페이지 이동 */}
            <Link
              to={`/foreign/exchange?from=${cur}`}
              className="fr-link-btn fr-link-btn--center"
            >
              환전하기
            </Link>

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

      {/* ====== 경고 바 ====== */}
      <NoticeBar>
        <div>
          • 환율·수수료는 수시로 변동되며 실제 체결 환율과 다를 수 있습니다.<br />
          • 외화 상품은 환율 변동에 따라 <b>원금 손실</b>이 발생할 수 있습니다.<br />
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

/** 계산기 모달 (오른쪽 차트: EXIM 일봉 전용) */
function CalcModal({ onClose, base, ttb, tts, cur }) {
  // buy: 원화→외화(TTS), sell: 외화→원화(TTB)
  const [mode, setMode] = useState("buy");
  const [amount, setAmount] = useState(1000);
  const [feePct, setFeePct] = useState(1.75); // 우대율(%)

  // === 차트 상태 ===
  const [series, setSeries] = useState([]); // [[Date, number], ...]
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesErr, setSeriesErr] = useState("");

  // 통화 단위(예: "JPY(100)" -> lot=100, "USD" -> lot=1)
  const lot = useMemo(() => {
    const m = /\((\d+)\)/.exec(cur || "");
    return m ? parseInt(m[1], 10) : 1;
  }, [cur]);

  // 최종 적용 환율 계산(우대율은 스프레드에만 적용)
  const calcEffectiveRate = useCallback(() => {
    const mid = Number(base) || 0;
    const _tts = Number(tts) || 0;
    const _ttb = Number(ttb) || 0;
    const p = (Number(feePct) || 0) / 100;

    if (!mid || !_tts || !_ttb) return null;

    if (mode === "buy") {
      const spread = _tts - mid;
      return mid + spread * (1 - p);
    } else {
      const spread = mid - _ttb;
      return mid - spread * (1 - p);
    }
  }, [base, tts, ttb, feePct, mode]);

  const effectiveRate = calcEffectiveRate();

  // 계산 결과(표시 단위 = cur, 예: JPY(100))
  const resultUnits = useMemo(() => {
    const a = Number(amount) || 0;
    if (!effectiveRate) return null;
    return mode === "buy" ? a / effectiveRate : a * effectiveRate;
  }, [amount, mode, effectiveRate]);

  // 실제 화폐 단위로 환산(예: JPY(100) -> ×100)
  const resultActual = useMemo(() => {
    if (resultUnits == null) return null;
    return mode === "buy" ? resultUnits * lot : resultUnits; // SELL은 KRW라 lot 영향 없음
  }, [resultUnits, lot, mode]);

  // ===== 레이아웃: 좌(입력/결과) · 우(차트) =====
  const modalBodyStyle = {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "24px",
  };

  // ===== 타임존 안전한 날짜 만들기 =====
  const toSafeDate = (d) => new Date(`${d}T00:00:00`);

  // === 히스토리 데이터 호출 (우측 차트) — EXIM 일봉만 사용 ===
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setSeriesLoading(true);
        setSeriesErr("");

        const curCode = (cur || "").replace(/\(.+\)/, "");
        // const res = await fetch(
        //   `/api/foreign/rates/series?cur=${encodeURIComponent(curCode)}&days=60`,
        //   { headers: { Accept: "application/json" } }
        // );
        // if (!res.ok) {
        //   const t = await res.text();
        //   throw new Error(`HTTP ${res.status} ${t}`);
        // }
        // const body = await res.json();
        const { data: body } = await api.get("/api/foreign/rates/series", {
          params: { cur: curCode, days: 60 },
        });

        // 허용 형식:
        // 1) [{date:"YYYY-MM-DD", rate: 1380.12}, ...]
        // 2) [[timestampOrISO, rate], ...]
        let rows = [];
        if (Array.isArray(body)) {
          if (body.length > 0 && typeof body[0] === "object" && body[0].date != null) {
            rows = body.map((r) => [toSafeDate(r.date), Number(r.rate)]);
          } else if (Array.isArray(body[0])) {
            rows = body.map((r) => [new Date(r[0]), Number(r[1])]);
          }
        } else if (Array.isArray(body?.rows)) {
          const a = body.rows;
          if (a.length > 0 && a[0].date != null) {
            rows = a.map((r) => [toSafeDate(r.date), Number(r.rate)]);
          }
        }

        rows.sort((a, b) => a[0].getTime() - b[0].getTime()); // 날짜 오름차순
        setSeries(rows);
      } catch (e) {
        console.error("[series] fetch fail:", e);
        setSeries([]);
        setSeriesErr("히스토리를 불러올 수 없습니다.");
      } finally {
        setSeriesLoading(false);
      }
    };

    fetchSeries();
  }, [cur]);

  const chartData = useMemo(() => {
    if (!series || series.length === 0) return null;
    return [
      ["날짜", "1 " + (cur || "").replace(/\(.+\)/, "") + " → KRW"],
      ...series,
    ];
  }, [series, cur]);

  const chartOptions = useMemo(
    () => ({
      legend: { position: "none" },
      hAxis: { format: "M/d", textStyle: { fontSize: 11 } },
      vAxis: { textStyle: { fontSize: 11 } },
      chartArea: { left: 40, top: 10, right: 10, bottom: 40, width: "100%", height: "80%" },
      pointsVisible: false,
      lineWidth: 2,
    }),
    []
  );

  return (
    <div className="fx-modal__backdrop" onClick={onClose}>
      <div
        className="fx-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(1100px, 96vw)" }}
      >
        <header className="fx-modal__head">
          <h3>환율 계산기</h3>
          <button className="fx-modal__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <div className="fx-modal__body" style={modalBodyStyle}>
          {/* ===== 왼쪽: 입력/결과 ===== */}
          <div>
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
                <input
                  type="number"
                  value={amount}
                  min="0"
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="fr-row">
              <label className="fr-key">우대율(%)</label>
              <div className="fr-val">
                <input
                  type="number"
                  value={feePct}
                  step="0.25"
                  min="0"
                  onChange={(e) => setFeePct(e.target.value)}
                />
              </div>
            </div>

            <div className="fr-divider" />

            <div className="fr-row">
              <label className="fr-key">매매기준율</label>
              <div className="fr-val fr-num">{fmt(base)}</div>
            </div>
            <div className="fr-row">
              <label className="fr-key">파실 때(TTB)</label>
              <div className="fr-val fr-num">{fmt(ttb)}</div>
            </div>
            <div className="fr-row">
              <label className="fr-key">사실 때(TTS)</label>
              <div className="fr-val fr-num">{fmt(tts)}</div>
            </div>
            <div className="fr-row">
              <label className="fr-key">최종 적용 환율</label>
              <div className="fr-val fr-num">
                {effectiveRate == null
                  ? "—"
                  : Number(effectiveRate).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
              </div>
            </div>

            <div className="fr-result">
              <div className="fr-result__label">예상 수취</div>
              <div className="fr-result__value">
                {resultUnits == null
                  ? "—"
                  : Number(resultUnits).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{" "}
                <span className="fr-result__unit">
                  {mode === "buy" ? cur : "KRW"}
                </span>
                {mode === "buy" && lot !== 1 && resultActual != null && (
                  <div className="text-sm text-gray-500 mt-1">
                    ≈{" "}
                    {Number(resultActual).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {cur.replace(/\(\d+\)/, "")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== 오른쪽: 차트 ===== */}
          <div style={{ minHeight: 320 }}>
            <div style={{ fontSize: 12, marginBottom: 8, color: "#6b7280" }}>
              최근 60영업일 추이 (1 {cur?.replace(/\(.+\)/, "")} → KRW)
            </div>

            {seriesLoading ? (
              <div className="text-center py-10">차트 불러오는 중…</div>
            ) : seriesErr ? (
              <div className="text-center py-10 text-red-500">{seriesErr}</div>
            ) : !chartData ? (
              <div className="text-center py-10 text-gray-500">
                표시할 히스토리 데이터가 없습니다.
              </div>
            ) : (
              <Chart
                chartType="LineChart"
                width="100%"
                height="320px"
                data={chartData}
                options={chartOptions}
                loader={<div>차트 렌더링…</div>}
              />
            )}
          </div>
        </div>

        <footer className="fx-modal__foot">
          <button className="fx-btn" onClick={onClose}>
            닫기
          </button>
        </footer>
      </div>
    </div>
  );
}