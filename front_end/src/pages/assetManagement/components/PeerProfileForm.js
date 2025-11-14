import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";

const GENDERS = [
  { value: "F", label: "여성" },
  { value: "M", label: "남성" },
];

const AGE_BANDS = [
  { value: 20, label: "20대" },
  { value: 30, label: "30대" },
  { value: 40, label: "40대" },
  { value: 50, label: "50대 이상" },
];

const JOB_GROUPS = [
  { value: "J1", label: "학생/무직" },
  { value: "J2", label: "사무/전문직" },
  { value: "J3", label: "서비스/판매직" },
  { value: "J4", label: "생산/노무/현장" },
  { value: "J5", label: "프리랜서/자영업/기타" },
];

const INCOME_BANDS = [
  { value: "I1", label: "100만원 미만" },
  { value: "I2", label: "100~300만원" },
  { value: "I3", label: "300~500만원" },
  { value: "I4", label: "500~800만원" },
  { value: "I5", label: "800~1000만원" },
  { value: "I6", label: "1000만원 이상" },
];

const REGIONS = [
  { value: "R1", label: "수도권(서울/경기/인천)" },
  { value: "R2", label: "영남(부산/대구/경북/경남/울산)" },
  { value: "R3", label: "호남(광주/전북/전남)" },
  { value: "R4", label: "충청·세종(대전/충북/충남/세종)" },
  { value: "R5", label: "강원·제주" },
];

const LS_KEY = "peerProfileDraft";

export default function PeerProfileForm({ 
  onSaved,
  onCancel,                  // ← 선택: 수정모드에서 취소 버튼
  initialValues = null,      // ← 선택: { gender, ageBand, incomeCd, jobCd, regionCd }
  submitLabel = "저장",
  useDraft = true,           // ← 초깃값 작성(true), 수정(false)
}) {
  const [form, setForm] = useState({
    gender: "", ageBand: "", jobCd: "", incomeCd: "", regionCd: "",
  });
  const [saving, setSaving] = useState(false);

  const valid = useMemo(
    () => !!(form.gender && form.ageBand && form.jobCd && form.incomeCd && form.regionCd),
    [form]
  );

  // initialValues → 폼에 주입 (수정 모드)
  useEffect(() => {
    if (initialValues) {
      setForm({
        gender:     initialValues.gender ?? "",
        ageBand:    String(initialValues.ageBand ?? ""),
        jobCd:   initialValues.jobCd ?? "",
        incomeCd: initialValues.incomeCd ?? "",
        regionCd:     initialValues.regionCd ?? initialValues.region ?? "",
      });
    } else if(useDraft) {
      const draft = localStorage.getItem(LS_KEY);
      if (draft) try { setForm(JSON.parse(draft)); } catch {}
    }
  }, [initialValues]);

   //초깃값 모드에서만 draft 저장
  useEffect(() => {
    if (!useDraft || initialValues) return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form, useDraft, initialValues]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const payload = {
        gender : form.gender,
        ageBand: Number(form.ageBand),
        incomeCd: form.incomeCd,
        jobCd: form.jobCd,
        regionCd: form.regionCd,
      };
      const res = await api.post("/api/asset/peer/profile", payload);

      if (useDraft && !initialValues) window.localStorage.removeItem(LS_KEY);
      onSaved?.({ ...payload, ...(res?.data || {}) });
    } catch (err) {
      alert("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">또래 비교 시작하기</h2>
          <p className="text-[12px] text-gray-500 mt-1">
            아래 항목을 선택하면 그룹 평균과 비교해 순자산/비중을 보여드려요.
          </p>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[11px] border text-gray-600 bg-gray-50">
          1분 소요
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SelectField label="성별" value={form.gender} onChange={onChange("gender")} options={GENDERS} />
          <SelectField label="연령대" value={form.ageBand} onChange={onChange("ageBand")} options={AGE_BANDS} />
          <SelectField label="직업" value={form.jobCd} onChange={onChange("jobCd")} options={JOB_GROUPS} />
          <SelectField label="월 소득(세전)" value={form.incomeCd} onChange={onChange("incomeCd")} options={INCOME_BANDS} />
          <SelectField label="거주 지역" value={form.regionCd} onChange={onChange("regionCd")} options={REGIONS} />
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
          또래 비교는 통계값만 사용하며, 개인 식별 정보는 저장하지 않습니다.
        </div>

        <div className="flex justify-end gap-3">
          {!!onCancel && (
            <button type="button"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
              onClick={onCancel}
            >취소</button>
          )}
          <button type="submit" disabled={!valid || saving}
            className={`rounded-md px-4 py-2 text-sm text-white ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}>
            {saving ? "저장 중…" : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
        value={value}
        onChange={onChange}
        required
      >
        <option value="">선택하세요</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
