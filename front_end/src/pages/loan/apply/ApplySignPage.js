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
    // font경로 public/font/NotoSansKR  .ttf
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
    await loadFontsBase64(); // fetch는 1회 캐시됨
    doc.addFileToVFS("NotoSansKR-Regular.ttf", fontBase64Regular);
    doc.addFileToVFS("NotoSansKR-Bold.ttf", fontBase64Bold);
    doc.addFont("NotoSansKR-Regular.ttf", "NotosansKR", "normal");
    doc.addFont("NotoSansKR-Bold.ttf", "NotosansKR", "bold");
}

// -------------------- 값 정규화(여러 별칭을 안전하게 흡수)
const normProduct = (p = {}) => ({
    id: p.id ?? p.code ?? p.lpd_code ?? p.lpdCode ?? p.lpd_no ?? "",
    name: p.name ?? p.lpd_name ?? p.productName ?? "",
    type: p.type ?? p.lpd_type ?? p.loanType ?? "",
});

const normQuote = (q = {}) => ({
    monthlyPayment:
        q.monthlyPayment ?? q.monthly_payment ?? (q.monthly && q.monthly.payment) ?? null,
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

    // 스테이트
    const [flow, setFlow] = React.useState(null); // 초기 null -> 로딩
    const [signer, setSigner] = React.useState("");
    const [agreed, setAgreed] = React.useState(false);
    const [signed, setSigned] = React.useState(false);

  // 항상 호출 필요한 플로우 로ㅇ드
    React.useEffect(() => {
        const f = loadFlow(code);
        setFlow(f);
        if (!f) {
        Promise.resolve().then(() => {
            nav(`/loan/${encodeURIComponent(code)}/quote`, { replace: true });
        });
        }
    }, [code, nav]);

    // ---- 캔버스 초기화 ----
    const initCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.min(600, parent?.clientWidth || 600);
        const h = 200;

        // 실제 픽셀 사이즈
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const ctx = canvas.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // 스타일
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = "#111827";

        // 흰 배경
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        ctxRef.current = ctx;
    }, []);

    // DOM에 붙는 시점에 확실히 초기화
    const canvasRefCb = React.useCallback(
        (node) => {
        canvasRef.current = node;
        if (node) initCanvas();
        },
        [initCanvas]
    );

    // 부모 리사이즈 대응(선택)
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
    // flow가 없으면 리다이렉트 중
    if (!flow) return null;

    // ---- 드로잉 (Pointer Events 통합) ----
    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e) => {
        if (!ctxRef.current) return;
        if (e.pointerType === "mouse" && e.button !== 0) return; // 우클릭 무시
        drawingRef.current = true;
        dirtyRef.current = true;
        const { x, y } = getPos(e);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!ctxRef.current || !drawingRef.current) return;
        const { x, y } = getPos(e);
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

        const w = parseInt(canvas.style.width, 10) || 600;
        const h = parseInt(canvas.style.height, 10) || 200;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 2;

        dirtyRef.current = false;
        setSigned(false);
    };

    // ---- PDF 생성 & 다운로드 ----
    const makePdfAndDownload = async () => {
        if (!dirtyRef.current) return alert("서명을 먼저 입력해 주세요.");
        if (!agreed) return alert("약관에 동의해 주세요.");

        const dataUrl = canvasRef.current.toDataURL("image/png");
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        // 폰트: 매 문서 인스턴스마다 확실히 등록
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
        // 정책: 한글 그대로 저장/출력
        ["금리유형", form.rateType || "-"],
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

        doc.setFont("NotosansKR", "bold");
        doc.text("전자서명", pad, y);
        y += 8;
        const sigW = 360, sigH = 120;
        doc.setDrawColor(200);
        doc.rect(pad, y, sigW, sigH);
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
            signatureDataUrl: dataUrl, // (후순위 서버 업로드 시 사용)
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

    return (
        <ApplyGuard requireStep={3}>
        <ApplyLayout current={4}>
            <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">최종 약정 / 전자서명</h3>
                <div className="text-xs text-gray-500">
                {flow?.product?.name ? `상품: ${flow.product.name}` : null}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <label className="block">
                <span className="text-sm text-gray-600">서명자 이름</span>
                <input
                    value={signer}
                    onChange={(e) => setSigner(e.target.value)}
                    placeholder="홍길동"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                </label>
                <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">약관 동의</span>
                <div className="mt-1 flex items-center gap-2">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    <span className="text-sm text-gray-700">(필수) 대출 약관, 개인(신용)정보 수집·이용·제공에 동의합니다.</span>
                </div>
                </label>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">서명칸(마우스/터치/펜)</span>
                <button onClick={clearSign} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
                    지우기
                </button>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-2">
                <canvas
                    ref={canvasRefCb}
                    className="w-full h-[200px] touch-none cursor-crosshair rounded-lg"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                />
                </div>
                <div className="mt-2 text-xs text-gray-500">※ 서명칸 밖으로 포인터가 나가면 선이 끊길 수 있어요.</div>
            </div>

            <div className="flex items-center justify-between">
                <button className="px-4 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800" onClick={makePdfAndDownload}>
                서명 완료 & PDF 다운로드
                </button>

                <button
                className={`px-4 py-2 rounded-xl text-white ${signed ? "bg-green-700 hover:bg-green-800" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!signed}
                onClick={goNext}
                >
                다음 (제출)
                </button>
            </div>

            <div className="text-xs text-gray-500">
                ※ 현재는 로컬로 PDF를 저장하고, 서명 이미지는 세션(flow.sign.signatureDataUrl)에만 저장합니다. 서버 저장은 추후 업로드 API로 연결하세요.
            </div>
            </div>
        </ApplyLayout>
        </ApplyGuard>
    );
}
