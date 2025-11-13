// src/pages/loan/apply/ApplySignPage.js
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import SignaturePad from "../apply/components/SignaturePad";
import {
  mergePdfsAndAddSignature,
  buildSignatureMeta,
} from "../util/signPdf";
import agreementPdf from "../assets/loan.pdf"

export default function ApplySignPage() {
  const { code } = useParams();
  const nav = useNavigate();

  const [flow, setFlow] = React.useState(null);
  const [signer, setSigner] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [signing, setSigning] = React.useState(false);
  const [signMeta, setSignMeta] = React.useState(null);

  const sigRef = React.useRef(null);

  // 1) 플로우 로드
  React.useEffect(() => {
    const f = loadFlow(code);
    if (!f) {
      nav(`/loan/apply/${encodeURIComponent(code)}/quote`, {
        replace: true,
      });
      return;
    }
    setFlow(f);
    // 이전에 서명해둔 거 있으면 복원
    if (f.sign?.signatureDate) {
      setSignMeta(f.sign);
      setAgreed(true);
      setSigner(f.sign.signer || "");
    }
    setLoading(false);
  }, [code, nav]);

  if (loading) {
    return (
      <ApplyGuard requireStep={3}>
        <ApplyLayout current={4}>
          <div className="p-6 text-sm text-gray-500">
            전자서명 정보를 불러오는 중입니다…
          </div>
        </ApplyLayout>
      </ApplyGuard>
    );
  }

  if (!flow) return null;

  const productName =
    flow.product?.name ||
    flow.product?.loanName ||
    flow.product?.loan_name ||
    "대출 상품";

  // 실제로 사용할 PDF 목록 
  // const pdfUrls = [
  //   "/pdf/loan/loan.pdf",  
  // ];
  const pdfUrls = [agreementPdf];

  const handleMakeSignedPdf = async () => {
    if (!agreed) {
      alert("약관 동의에 체크해 주세요.");
      return;
    }
    if (!signer.trim()) {
      alert("서명자 이름을 입력해 주세요.");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("서명란에 서명(사인)을 입력해 주세요.");
      return;
    }

    try {
      setSigning(true);

      const canvas = sigRef.current.getCanvas();
      const blob = await mergePdfsAndAddSignature(canvas, pdfUrls);
      const meta = buildSignatureMeta(blob, pdfUrls);
      const next = {
        ...flow,
        step: Math.max(Number(flow.step || 1), 5),
        sign: {
          ...meta,
          signer,
          agreed: true,
        },
      };

      saveFlow(code, next);
      setFlow(next);
      setSignMeta(next.sign);

      // 다운로드까지 같이 하고 싶으면:
      const a = document.createElement("a");
      a.href = meta.previewUrl;
      a.download = meta.fileName || "loan-sign.pdf";
      a.click();

      alert("서명 PDF가 생성되었습니다.");
    } catch (e) {
      console.error(e);
      alert("전자서명 PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setSigning(false);
    }
  };

  const handleNext = () => {
    if (!signMeta) {
      alert("서명 PDF 생성까지 완료해 주세요.");
      return;
    }
    nav(`/loan/apply/${encodeURIComponent(code)}/submit`);
  };

  return (
    <ApplyGuard requireStep={3}>
      <ApplyLayout current={4}>
        <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-pen-nib-line text-xl text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  최종 약정 · 전자서명
                </h3>
                <p className="text-xs text-gray-500">
                  {productName} 약정서 PDF를 확인하시고, 하단에
                  전자서명을 진행해 주세요.
                </p>
              </div>
            </div>
            {signMeta && (
              <div className="text-[10px] text-emerald-600 text-right">
                서명 완료: {signMeta.signatureDate?.slice(0, 19).replace("T", " ")}
                <br />
                (다시 서명 시 최신 내용으로 갱신됩니다)
              </div>
            )}
          </div>

          {/* PDF 미리보기 (첫 파일 기준) */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <i className="ri-file-pdf-line text-red-500" />
                <span>약정서 / 약관 전문 미리보기</span>
              </div>
              <a
                href={pdfUrls[0]}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-600 hover:underline"
              >
                새 창에서 크게 보기
              </a>
            </div>
            <div className="w-full h-72 rounded-xl border border-gray-200 overflow-hidden bg-white">
              <iframe
                src={pdfUrls[0]}
                title="loan-agreement"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* 서명자 & 동의 체크 */}
          <div className="grid md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm text-gray-700">
                서명자 이름
              </span>
              <div className="relative">
                <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="mt-1 w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="홍길동"
                  value={signer}
                  onChange={(e) => setSigner(e.target.value)}
                />
              </div>
            </label>
            <div className="md:col-span-2 flex flex-col justify-end">
              <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  (필수) 대출 약관 및 개인(신용)정보 수집·이용·제공
                  내용에 동의합니다.
                </span>
              </label>
            </div>
          </div>

          {/* 서명 패드 */}
          <SignaturePad ref={sigRef} />

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleMakeSignedPdf}
              disabled={signing}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white ${
                signing
                  ? "bg-gray-400 cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <i className="ri-check-double-line" />
              {signing
                ? "서명 PDF 생성 중..."
                : "서명 완료 & PDF 생성"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!signMeta}
              className={`px-4 py-2 rounded-xl text-white text-sm ${
                signMeta
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              다음 (제출 단계로 이동)
            </button>
          </div>

          <div className="text-[10px] text-gray-500">
            ※ 현재는 브라우저에서 PDF를 생성하며, 서버 업로드/보관은
            추후 연동 지점에서 처리하면 됩니다.
          </div>
        </div>
      </ApplyLayout>
    </ApplyGuard>
  );
}
