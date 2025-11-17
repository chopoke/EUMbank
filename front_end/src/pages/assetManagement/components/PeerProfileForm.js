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
  onCancel,
  initialValues = null,
  submitLabel = "저장",
  useDraft = true,
}) {
  const [form, setForm] = useState({
    gender: "", ageBand: "", jobCd: "", incomeCd: "", regionCd: "",
  });
  const [saving, setSaving] = useState(false);

  const valid = useMemo(
    () => !!(form.gender && form.ageBand && form.jobCd && form.incomeCd && form.regionCd),
    [form]
  );

  useEffect(() => {
    if (initialValues) {
      setForm({
        gender: initialValues.gender ?? "",
        ageBand: String(initialValues.ageBand ?? ""),
        jobCd: initialValues.jobCd ?? "",
        incomeCd: initialValues.incomeCd ?? "",
        regionCd: initialValues.regionCd ?? initialValues.region ?? "",
      });
    } else if (useDraft) {
      const draft = localStorage.getItem(LS_KEY);
      if (draft) try { setForm(JSON.parse(draft)); } catch {}
    }
  }, [initialValues, useDraft]);

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
        gender: form.gender,
        ageBand: Number(form.ageBand),
        incomeCd: form.incomeCd,
        jobCd: form.jobCd,
        regionCd: form.regionCd,
      };
      const res = await api.post("/api/asset/peer/profile", payload);
      if (useDraft && !initialValues) window.localStorage.removeItem(LS_KEY);
      onSaved?.({ ...payload, ...(res?.data || {}) });
    } catch {
      alert("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* 헤더 스트립 */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-b border-blue-100">
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">i</span>
              <h2 className="text-base font-semibold text-gray-900">또래 비교 시작하기</h2>
            </div>
            <p className="text-[12px] text-blue-700 mt-1">
              선택한 기준으로 그룹 평균과 비교해 드립니다.
            </p>
          </div>
          <span className="rounded-full px-2 py-0.5 text-[11px] border border-blue-200 text-blue-700 bg-white">
            약 1분 소요
          </span>
        </div>
      </div>

      {/* 본문 */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <FieldCard
            icon="🙋‍♀️"
            caption="성별"
            helper="통계 비교용"
          >
            <SelectField value={form.gender} onChange={onChange("gender")} options={GENDERS} />
          </FieldCard>

          <FieldCard
            icon="🎂"
            caption="연령대"
            helper="10년 단위 구간"
          >
            <SelectField value={form.ageBand} onChange={onChange("ageBand")} options={AGE_BANDS} />
          </FieldCard>

          <FieldCard
            icon="💼"
            caption="직업"
            helper="가까운 군을 선택"
          >
            <SelectField value={form.jobCd} onChange={onChange("jobCd")} options={JOB_GROUPS} />
          </FieldCard>

          <FieldCard
            icon="💰"
            caption="월 소득(세전)"
            helper="개인정보는 저장되지 않아요"
          >
            <SelectField value={form.incomeCd} onChange={onChange("incomeCd")} options={INCOME_BANDS} />
          </FieldCard>

          <FieldCard
            icon="📍"
            caption="거주 지역"
            helper="광역 구분"
          >
            <SelectField value={form.regionCd} onChange={onChange("regionCd")} options={REGIONS} />
          </FieldCard>
        </div>

        {/* 안내 배지 */}
        <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-[12px] text-blue-800">
          또래 비교는 통계값만 사용하며, 개인 식별 정보는 저장하지 않습니다.
        </div>

        {/* 액션 바 */}
        <div className="mt-6 flex justify-end gap-3">
          {!!onCancel && (
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
              onClick={onCancel}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={!valid || saving}
            className={`rounded-md px-4 py-2 text-sm text-white transition-colors ${
              valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            {saving ? "저장 중…" : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ————— 보조 컴포넌트 ————— */

function FieldCard({ icon, caption, helper, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition-shadow focus-within:border-blue-400 focus-within:shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[13px]">{icon}</span>
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-500">{caption}</span>
          {helper && <span className="text-[11px] text-gray-400 -mt-0.5">{helper}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      className="mt-1 block w-full rounded-md border-gray-300 text-sm
                 focus:border-blue-500 focus:ring-blue-500
                 hover:border-gray-400 transition-colors"
      value={value}
      onChange={onChange}
      required
    >
      <option value="">선택하세요</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
