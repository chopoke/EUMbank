// src/pages/loan/apply/ApplySignPage.js
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import jsPDF from "jspdf";

// 폰트 fetch는 1회, 문서마다 addFont
let fontBase64Regular = null;
let fontBase64Bold = null;

async function loadFontsBase64() {
  if (fontBase64Regular && fontBase64Bold) return;
  // public/font/NotoSansKR.ttf (정/볼드 같은 파일을 임시로 동일 적용)
  const [regRes, boldRes] = await Promise.all([
    fetch("/font/NotoSansKR.ttf"),
    fetch("/font/NotoSansKR.ttf"),
  ]);
  const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
  const toB64 = (buf) => {
    let s = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };
  fontBase64Regular = toB64(regBuf);
  fontBase64Bold = toB64(boldBuf);
}

async function ensureKoreanFontForDoc(doc) {
  await loadFontsBase64();
  doc.addFileToVFS("NotoSansKR-Regular.ttf", fontBase64Regular);
  doc.addFileToVFS("NotoSansKR-Bold.ttf", fontBase64Bold);
  doc.addFont("NotoSansKR-Regular.ttf", "NotosansKR", "normal");
  doc.addFont("NotoSansKR-Bold.ttf", "NotosansKR", "bold");
}

// -------------------- 값 정규화
const normProduct = (p = {}) => ({
  id: p.id ?? p.code ?? p.lpd_code ?? p.lpdCode ?? p.lpd_no ?? "",
  name: p.name ?? p.lpd_name ?? p.productName ?? "",
  type: p.type ?? p.lpd_type ?? p.loanType ?? "",
});
const normQuote = (q = {}) => ({
  monthlyPayment: q.monthlyPayment ?? q.monthly_payment ?? (q.monthly && q.monthly.payment) ?? null,
  appliedRate: q.appliedRate ?? q.applied_rate ?? null,
  approvedAmount: q.approvedAmount ?? q.approved_amount ?? null,
  approvedTerm: q.approvedTerm ?? q.approved_term ?? null,
});

export default function ApplySignPage() {
  const { code } = useParams();
  const nav = useNavigate();

  // 레퍼런스
  const canvasRef = React.useRef(null);
  const ctxRef = React.useRef(null);
  const drawingRef = React.useRef(false);
  const dirtyRef = React.useRef(false);

  // 스타일/도구 상태
  const [inkColor, setInkColor] = React.useState("#0f172a"); // slate-900
  const [lineWidth, setLineWidth] = React.useState(2);

  // 스테이트
  const [flow, setFlow] = React.useState(null);
  const [signer, setSigner] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  // 항상 호출 필요한 플로우 로드
  React.useEffect(() => {
    const f = loadFlow(code);
    setFlow(f);
    if (!f) {
      Promise.resolve().then(() => {
        nav(`/loan/${encodeURIComponent(code)}/quote`, { replace: true });
      });
    }
  }, [code, nav]);

  // ---- 캔버스 초기화 + 가이드(그리드/코너/워터마크) ----
  const paintGuides = React.useCallback((ctx, w, h) => {
    // 흰 배경
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // 옅은 그리드
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)"; // slate-400 15%
    ctx.lineWidth = 1;
    const grid = 20;
    for (let x = grid; x < w; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = grid; y < h; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    // 서명 워터마크
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.fillStyle = "rgba(99, 102, 241, 0.08)"; // indigo-500 8%
    ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR";
    ctx.textAlign = "center";
    ctx.fillText("여기에 서명해주세요", 0, 0);
    ctx.restore();

    // 대시 박스
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.restore();

    // 코너 마커
    ctx.save();
    ctx.strokeStyle = "#334155"; // slate-700
    ctx.lineWidth = 3;
    const L = 18;
    // 좌상
    ctx.beginPath(); ctx.moveTo(8, 8 + L); ctx.lineTo(8, 8); ctx.lineTo(8 + L, 8); ctx.stroke();
    // 우상
    ctx.beginPath(); ctx.moveTo(w - 8 - L, 8); ctx.lineTo(w - 8, 8); ctx.lineTo(w - 8, 8 + L); ctx.stroke();
    // 좌하
    ctx.beginPath(); ctx.moveTo(8, h - 8 - L); ctx.lineTo(8, h - 8); ctx.lineTo(8 + L, h - 8); ctx.stroke();
    // 우하
    ctx.beginPath(); ctx.moveTo(w - 8 - L, h - 8); ctx.lineTo(w - 8, h - 8); ctx.lineTo(w - 8, h - 8 - L); ctx.stroke();
    ctx.restore();
  }, []);

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(720, parent?.clientWidth || 720);
    const h = 220;

    // 실제 픽셀 사이즈
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 기본 펜 스타일
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;

    paintGuides(ctx, w, h); // 가이드 그려주고
    ctxRef.current = ctx;
  }, [inkColor, lineWidth, paintGuides]);

  // DOM에 붙는 시점에 확실히 초기화
  const canvasRefCb = React.useCallback(
    (node) => {
      canvasRef.current = node;
      if (node) initCanvas();
    },
    [initCanvas]
  );

  // 부모 리사이즈 대응
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(parent);
    return () => ro.disconnect();
  }, [initCanvas]);

  // flow 판단 중이면 로딩
  if (flow === null) {
    return (
      <ApplyGuard requireStep={3}>
        <ApplyLayout current={4}>
          <div className="p-6">로딩중…</div>
        </ApplyLayout>
      </ApplyGuard>
    );
  }
  if (!flow) return null;

  // ---- 드로잉 (Pointer Events 통합) ----
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const beginStroke = (x, y) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerDown = (e) => {
    if (!ctxRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return; // 우클릭 무시
    drawingRef.current = true;
    dirtyRef.current = true;
    const { x, y } = getPos(e);
    beginStroke(x, y);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onPointerMove = (e) => {
    if (!ctxRef.current || !drawingRef.current) return;
    const { x, y } = getPos(e);
    ctxRef.current.strokeStyle = inkColor;
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    e.preventDefault();
  };
  const onPointerUp = (e) => {
    drawingRef.current = false;
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
  };

  // ---- 서명 지우기 ----
  const clearSign = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const w = parseInt(canvas.style.width, 10) || 720;
    const h = parseInt(canvas.style.height, 10) || 220;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    paintGuides(ctx, w, h); // 가이드 다시
    dirtyRef.current = false;
    setSigned(false);
  };

  // ---- PDF 생성 & 다운로드 ----
  const makePdfAndDownload = async () => {
    if (!dirtyRef.current) return alert("서명을 먼저 입력해 주세요.");
    if (!agreed) return alert("약관에 동의해 주세요.");

    const dataUrl = canvasRef.current.toDataURL("image/png");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    await ensureKoreanFontForDoc(doc);

    const pad = 48;
    let y = pad;

    // 제목
    doc.setFont("NotosansKR", "bold");
    doc.setFontSize(18);
    doc.text("대출 전자서명 확인서", pad, y);
    y += 24;

    // 본문
    doc.setFont("NotosansKR", "normal");
    doc.setFontSize(11);

    const prod = normProduct(flow?.product || {});
    const form = flow?.form || {};
    const quote = normQuote(flow?.quote || {});
    const won = (n) => Number(n || 0).toLocaleString("ko-KR");

    const rows = [
      ["상품명", prod.name || "-"],
      ["상품코드", prod.id || "-"],
      ["대출종류", prod.type || "-"],
      ["신청금액", `${won(form.desiredAmount)} 원`],
      ["기간(개월)", String(form.desiredTerm || "-")],
      ["금리유형", form.rateType || "-"], // 한글 그대로
      ["상환방법", form.rpayType || "-"],
      ["월 납입(예상)", quote.monthlyPayment != null ? `${won(quote.monthlyPayment)} 원` : "-"],
      ["적용금리(조회)", quote.appliedRate != null ? `${Number(quote.appliedRate).toFixed(2)} %` : "-"],
    ];
    rows.forEach(([k, v]) => {
      doc.setFont("NotosansKR", "bold");   doc.text(k, pad, y);
      doc.setFont("NotosansKR", "normal"); doc.text(`: ${v}`, pad + 80, y);
      y += 18;
    });

    y += 8;
    doc.setDrawColor(180);
    doc.line(pad, y, 595 - pad, y);
    y += 18;

    doc.setFont("NotosansKR", "bold");
    doc.text("약관 동의", pad, y);
    doc.setFont("NotosansKR", "normal");
    doc.text(`: ${agreed ? "동의함" : "동의 안함"}`, pad + 80, y);
    y += 28;

    // 서명 박스 테두리 더 명확히
    doc.setFont("NotosansKR", "bold");
    doc.text("전자서명", pad, y);
    y += 8;
    const sigW = 380, sigH = 130;
    doc.setDrawColor(120);
    doc.setLineWidth(1);
    doc.rect(pad, y, sigW, sigH, "S");
    doc.addImage(dataUrl, "PNG", pad + 4, y + 4, sigW - 8, sigH - 8);
    y += sigH + 20;

    doc.setFont("NotosansKR", "normal");
    doc.text(`서명자: ${signer || "-"}`, pad, y); y += 16;
    doc.text(`서명일시: ${new Date().toLocaleString("ko-KR")}`, pad, y);

    const fileName = `전자서명_${prod.name || "대출"}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    const next = {
      ...flow,
      step: Math.max(Number(flow.step || 1), 5),
      sign: {
        signed: true,
        signedAt: new Date().toISOString(),
        signer,
        signatureDataUrl: dataUrl,
        pdfFileName: fileName,
      },
    };
    saveFlow(code, next);
    setFlow(next);
    setSigned(true);
  };

  const goNext = () => {
    if (!signed) return alert("PDF 생성(다운로드)까지 완료해 주세요.");
    nav(`/loan/apply/${encodeURIComponent(code)}/submit`);
  };

  // 색상 프리셋
  const COLORS = [
    { v: "#0f172a", name: "Slate" },
    { v: "#1f2937", name: "Gray" },
    { v: "#111827", name: "Ink" },
    { v: "#000000", name: "Black" },
    { v: "#334155", name: "Deep" },
    { v: "#ef4444", name: "Red" },
    { v: "#10b981", name: "Green" },
    { v: "#3b82f6", name: "Blue" },
  ];

  return (
    <ApplyGuard requireStep={3}>
      <ApplyLayout current={4}>
        <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-pen-nib-line text-xl text-indigo-600" />
              <h3 className="font-semibold">최종 약정 / 전자서명</h3>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <i className="ri-smartphone-line" />
              <i className="ri-mouse-line" />
              <i className="ri-input-method-line" />
              <span>마우스/터치/펜 입력 지원</span>
            </div>
          </div>

          {/* 인풋들 */}
          <div className="grid md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm text-gray-600">서명자 이름</span>
              <div className="relative">
                <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  value={signer}
                  onChange={(e) => setSigner(e.target.value)}
                  placeholder="홍길동"
                  className="mt-1 w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-600">약관 동의</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="agree"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                  (필수) 대출 약관, 개인(신용)정보 수집·이용·제공에 동의합니다.
                </label>
                <button
                  type="button"
                  className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={() => setShowHelp((s) => !s)}
                >
                  <i className="ri-information-line"></i> 약관 요약
                </button>
              </div>
              {showHelp && (
                <div className="mt-2 text-xs text-gray-600 bg-indigo-50 rounded-lg p-3 leading-5">
                  • 금리/한도는 심사 결과에 따라 변동될 수 있습니다.<br />
                  • 전자서명 완료 시 신청서 제출 단계로 이동합니다.<br />
                  • 민감정보는 암호화되어 전송/보관됩니다.
                </div>
              )}
            </label>
          </div>

          {/* 서명 툴바 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">펜 두께</span>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-gray-50"
                  onClick={() => setLineWidth((w) => Math.max(1, w - 1))}
                  title="얇게"
                >
                  <i className="ri-subtract-line"></i>
                </button>
                <span className="px-3 min-w-10 text-center">{lineWidth}px</span>
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-gray-50"
                  onClick={() => setLineWidth((w) => Math.min(12, w + 1))}
                  title="두껍게"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>

              <span className="ml-3 text-gray-600">잉크 색상</span>
              <div className="flex items-center gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    className={`w-6 h-6 rounded-full border ${inkColor === c.v ? "ring-2 ring-offset-2 ring-indigo-500" : "border-gray-300"}`}
                    style={{ backgroundColor: c.v }}
                    title={c.name}
                    onClick={() => setInkColor(c.v)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearSign}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
              >
                <i className="ri-eraser-line"></i> 지우기
              </button>
            </div>
          </div>

          {/* 서명 캔버스 카드 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <i className="ri-edit-2-line text-indigo-600" />
                <span>서명 영역</span>
                <span className="hidden md:inline text-gray-400">— 경계(점선/코너) 안쪽에 서명해 주세요</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <i className="ri-focus-2-line" />
                <span>해상도 자동 보정</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
              <canvas
                ref={canvasRefCb}
                className="w-full h-[220px] touch-none cursor-crosshair rounded-lg"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            </div>

            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              <span>서명칸 밖으로 포인터가 나가면 선이 끊길 수 있어요.</span>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={makePdfAndDownload}
            >
              <i className="ri-check-double-line"></i>
              서명 완료 & PDF 다운로드
            </button>

            <button
              className={`px-4 py-2 rounded-xl text-white ${signed ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={!signed}
              onClick={goNext}
            >
              다음 (제출)
            </button>
          </div>

          <div className="text-xs text-gray-500">
            ※ 현재는 로컬로 PDF를 저장하고, 서명 이미지는 세션(flow.sign.signatureDataUrl)에만 저장합니다.
          </div>
        </div>
      </ApplyLayout>
    </ApplyGuard>
  );
}
