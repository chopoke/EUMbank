import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";

const GENDERS = [
  { value: "F", label: "여성" },
  { value: "M", label: "남성" },
];

const AGE_BANDS = [
  "20대", "30대", "40대", "50대", "60대이상",
].map((label, i) => ({ value: parseInt(label, 10) , label }));

const JOB_GROUPS = [
  "학생", "무직/구직", "사무/전문직", "서비스/판매직", "생산/노무", "공공/교육/보건", "프리랜서/자영업", "기타",
].map((label, i) => ({ value: `J${i+1}`, label }));

const INCOME_BANDS = [
  "100만원 미만", "100~300만원", "300~500만원", "500~800만원",
  "800~1000만원", "1000만원 이상",
].map((label, i) => ({ value: `I${i+1}`, label }));

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
].map((label) => ({ value: label, label }));

const LS_KEY = "peerProfileDraft";

export default function PeerProfileForm({ onSaved }) {
  const [form, setForm] = useState({
    gender: "", ageBand: "", jobGroup: "", incomeBand: "", region: "",
  });
  const [saving, setSaving] = useState(false);
  const valid = useMemo(
    () => !!(form.gender && form.ageBand && form.jobGroup && form.incomeBand && form.region),
    [form]
  );

  // 임시 저장 복구
  useEffect(() => {
    const draft = window.localStorage.getItem(LS_KEY);
    if (draft) {
      try { setForm(JSON.parse(draft)); } catch {}
    }
  }, []);

  // 입력 변경 시 임시 저장
  useEffect(() => {
    window.localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        ageBand: Number(form.ageBand),
      };
      const res = await api.post("/api/asset/peer/profile", payload);
      window.localStorage.removeItem(LS_KEY);
      onSaved?.(res.data ?? form);
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
          <SelectField label="직업" value={form.jobGroup} onChange={onChange("jobGroup")} options={JOB_GROUPS} />
          <SelectField label="월 소득(세전)" value={form.incomeBand} onChange={onChange("incomeBand")} options={INCOME_BANDS} />
          <SelectField label="거주 지역" value={form.region} onChange={onChange("region")} options={REGIONS} />
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
          또래 비교는 통계값만 사용하며, 개인 식별 정보는 저장하지 않습니다.
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => setForm({ gender:"", ageBand:"", jobGroup:"", incomeBand:"", region:"" })}
          >
            초기화
          </button>
          <button
            type="submit"
            disabled={!valid || saving}
            className={`rounded-md px-4 py-2 text-sm text-white ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            {saving ? "저장 중…" : "또래 비교 시작하기"}
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
