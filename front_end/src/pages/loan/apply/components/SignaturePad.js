import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";

const SignaturePad = forwardRef(function SignaturePad({ height = 220 }, ref) {
  const guideRef = useRef(null);   // 가이드용
  const drawRef = useRef(null);    // 실제 서명용
  const guideCtxRef = useRef(null);
  const drawCtxRef = useRef(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);

  const [inkColor, setInkColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState(2);

  const COLORS = [
    "#111827",
    "#000000",
    "#1f2937",
    "#334155",
    "#ef4444",
    "#10b981",
    "#3b82f6",
  ];

  const initCanvas = useCallback(() => {
    const guide = guideRef.current;
    const draw = drawRef.current;
    if (!guide || !draw) return;

    const parent = guide.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(720, parent?.clientWidth || 720);
    const h = height;

    // 가이드 캔버스
    guide.width = w * dpr;
    guide.height = h * dpr;
    guide.style.width = `${w}px`;
    guide.style.height = `${h}px`;

    const gctx = guide.getContext("2d");
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.scale(dpr, dpr);

    // 흰 배경
    gctx.fillStyle = "#ffffff";
    gctx.fillRect(0, 0, w, h);

    // 점선 박스
    gctx.save();
    gctx.setLineDash([8, 4]);
    gctx.strokeStyle = "#9ca3af";
    gctx.lineWidth = 1.5;
    gctx.strokeRect(10, 10, w - 20, h - 20);
    gctx.restore();

    // 안내 텍스트
    gctx.save();
    gctx.fillStyle = "rgba(148,163,253,0.55)";
    gctx.font = "bold 18px system-ui, 'Noto Sans KR'";
    gctx.textAlign = "center";
    gctx.fillText("여기에 서명해 주세요", w / 2, h / 2 + 6);
    gctx.restore();

    guideCtxRef.current = gctx;

    // 서명 캔버스 (투명 배경)
    draw.width = w * dpr;
    draw.height = h * dpr;
    draw.style.width = `${w}px`;
    draw.style.height = `${h}px`;

    const dctx = draw.getContext("2d");
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.scale(dpr, dpr);
    dctx.lineCap = "round";
    dctx.lineJoin = "round";
    dctx.strokeStyle = inkColor;
    dctx.lineWidth = lineWidth;

    drawCtxRef.current = dctx;
    dirtyRef.current = false;
  }, [height, inkColor, lineWidth]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    const guide = guideRef.current;
    const parent = guide?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(parent);
    return () => ro.disconnect();
  }, [initCanvas]);

  const getPos = (e) => {
    const rect = drawRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const start = (e) => {
    const ctx = drawCtxRef.current;
    if (!ctx) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    drawingRef.current = true;
    dirtyRef.current = true;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const move = (e) => {
    const ctx = drawCtxRef.current;
    if (!ctx || !drawingRef.current) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const end = (e) => {
    drawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const clear = () => {
    const draw = drawRef.current;
    const ctx = drawCtxRef.current;
    if (!draw || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, draw.width, draw.height);
    ctx.restore();
    dirtyRef.current = false;
  };

  // 부모에서 export용 canvas 가져갈 때:
  // 가이드는 빼고 "서명 선만" 있는 캔버스를 만들어 준다.
  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      const draw = drawRef.current;
      if (!draw) return null;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = draw.width;
      exportCanvas.height = draw.height;
      const ctx = exportCanvas.getContext("2d");
      ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(draw, 0, 0);
      return exportCanvas;
    },
    clear,
    isEmpty: () => !dirtyRef.current,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <i className="ri-edit-2-line text-indigo-500" />
          <span className="font-medium text-gray-800">전자서명</span>
          <span className="hidden md:inline text-gray-400">
            마우스 / 터치 / 펜 입력 가능
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>펜 두께</span>
          <input
            type="range"
            min={1}
            max={10}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
          <span>{lineWidth}px</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-1">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-5 h-5 rounded-full border ${
              inkColor === c
                ? "ring-2 ring-indigo-500 border-indigo-500"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
            onClick={() => setInkColor(c)}
          />
        ))}
        <button
          type="button"
          onClick={clear}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <i className="ri-eraser-line" />
          지우기
        </button>
      </div>

      <div className="relative rounded-xl border border-gray-200 bg-white p-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
        {/* 가이드 캔버스 */}
        <canvas
          ref={guideRef}
          className="w-full h-[220px] rounded-lg pointer-events-none absolute inset-2"
        />
        {/* 서명 캔버스 (위에) */}
        <canvas
          ref={drawRef}
          className="w-full h-[220px] touch-none cursor-crosshair rounded-lg relative"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
    </div>
  );
});

export default SignaturePad;