import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { uploadLoanDoc } from "../../../api/accounts"; // 백엔드 준비되면 사용

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/heic", "image/heif"];

function prettySize(n=0){
  if (n > 1024*1024) return (n/1024/1024).toFixed(1) + " MB";
  if (n > 1024) return (n/1024).toFixed(1) + " KB";
  return n + " B";
}

function FilePicker({ label, required, file, onPick, accept=ACCEPT.join(",") }) {
  const [dragOver, setDragOver] = React.useState(false);

  const onChange = (e) => onPick(e.target.files?.[0] || null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  return (
    <div
      className={`rounded-xl border p-4 ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
      onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
      onDragLeave={()=> setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">
          {label} {required ? <span className="text-red-600 text-sm">(필수)</span> : <span className="text-gray-400 text-sm">(선택)</span>}
        </div>
        <label className="text-xs px-3 py-1 rounded-lg border bg-white cursor-pointer">
          파일 선택
          <input type="file" accept={accept} className="hidden" onChange={onChange}/>
        </label>
      </div>

      {!file ? (
        <div className="text-sm text-gray-600 mt-2">
          여기로 파일을 끌어다 놓거나 <span className="underline">파일 선택</span>을 눌러 업로드하세요. (PDF/JPG/PNG, 최대 10MB)
        </div>
      ) : (
        <div className="mt-3 text-sm">
          <div className="font-mono">{file.name}</div>
          <div className="text-gray-500">{file.type || "unknown"} · {prettySize(file.size)}</div>
        </div>
      )}
    </div>
  );
}

export default function ApplyDocsPage(){
  const { code } = useParams();
  const nav = useNavigate();

  // 훅 먼저
  const [files, setFiles] = React.useState({ incomeProof: null, idCard: null, etc: null });
  const [errors, setErrors] = React.useState({});
  const [uploading, setUploading] = React.useState(false);
  const [backendMode, setBackendMode] = React.useState(false); 

  // 플로우 로드/가드
  const flow = loadFlow(code);
  React.useEffect(() => {
    if (!flow) {
      nav(`/loan/${encodeURIComponent(code)}/quote`, { replace: true });
      return;
    }
    // 만약 이전 단계에서 저장된 첨부 메타가 있으면 로드(파일 객체는 복원 X)
    if (flow.attachments) {
      setFiles({
        incomeProof: null,
        idCard: null,
        etc: null,
      });
    }
  }, [ code, nav]);

  if (!flow) return null;

  const product = flow.product;

  const validate = () => {
    const e = {};
    if (!files.incomeProof) e.incomeProof = "소득증빙은 필수입니다.";
    ["incomeProof","idCard","etc"].forEach(k=>{
      const f = files[k];
      if (!f) return;
      if (f.size > MAX_SIZE) e[k] = `파일이 너무 큽니다. (최대 ${prettySize(MAX_SIZE)})`;
      if (!ACCEPT.includes(f.type)) e[k] = "허용되지 않는 파일 형식입니다.";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onPick = (key, f) => {
    setFiles(prev => ({ ...prev, [key]: f }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onNext = async () => {
    if (!validate()) return;

    try {
      setUploading(true);

      let attachmentsMeta = flow.attachments || {};
      const toUpload = Object.entries(files).filter(([,f])=> !!f);

      if (backendMode) {
        // --- 실서버 업로드 모드 (준비되면 이쪽 사용) ---
        // 각 파일 업로드 -> fileId/url 메타로 치환
        const results = await Promise.all(toUpload.map(async ([k,f]) => {
          const r = await uploadLoanDoc(code, f); // 서버가 {fileId,url} 반환한다고 가정
          return [k, { fileId: r?.data?.fileId || r.fileId, url: r?.data?.url || r.url, name: f.name, size: f.size, type: f.type }];
        }));
        attachmentsMeta = Object.fromEntries(results);
      } else {
        // --- 프론트 대체 모드 (백엔드 미구축) ---
        const results = toUpload.map(([k,f]) => {
          const url = URL.createObjectURL(f); // 미리보기용 임시 URL
          return [k, { fileId: null, url, name: f.name, size: f.size, type: f.type }];
        });
        attachmentsMeta = { ...attachmentsMeta, ...Object.fromEntries(results) };
      }

      const next = {
        ...flow,
        step: Math.max(Number(flow.step || 1), 4), // 다음 단계 sign
        attachments: attachmentsMeta,
      };
      saveFlow(code, next);
      nav(`/loan/apply/${encodeURIComponent(code)}/sign`);
    } catch (e) {
      console.error(e);
      alert(e?.message || "파일 처리 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ApplyGuard requireStep={3}>
      <ApplyLayout current={3}>
        <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">서류 제출</h3>
            <div className="text-xs text-gray-500">
              {product?.name ? `상품: ${product.name}` : null}
            </div>
          </div>

          <FilePicker
            label="소득증빙 (필수) — 예: 근로소득원천징수영수증, 급여명세서, 소득금액증명 등"
            required
            file={files.incomeProof}
            onPick={(f)=> onPick("incomeProof", f)}
          />
          {errors.incomeProof && <div className="text-xs text-red-600 -mt-2">{errors.incomeProof}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            <FilePicker
              label="신분증 사본 (선택)"
              required={false}
              file={files.idCard}
              onPick={(f)=> onPick("idCard", f)}
            />
            <FilePicker
              label="기타 증빙 (선택)"
              required={false}
              file={files.etc}
              onPick={(f)=> onPick("etc", f)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input/>
            </label>

            <button
              className={`px-4 py-2 rounded-xl text-white ${uploading ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"}`}
              disabled={uploading}
              onClick={onNext}
            >
              {uploading ? "처리중…" : "다음 (전자서명)"}
            </button>
          </div>
        </div>
      </ApplyLayout>
    </ApplyGuard>
  );
}
