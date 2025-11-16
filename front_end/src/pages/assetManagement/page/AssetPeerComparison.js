import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import PeerProfileForm from "../components/PeerProfileForm";
import AssetHubNav from "../components/AssetHubNav";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AssetPeerComparison() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needProfile, setNeedProfile] = useState(false);
  const [compare, setCompare] = useState(null);   // PeerCompareResponse

  // 편집 모드 on/off
  const [editing, setEditing] = useState(false);
  const [rawProfile, setRawProfile] = useState(null); // 코드값 보관

  const COLOR_MAP = {
    CASH: "#53d2f8",       // 입출금
    INSTALLMENT: "#fc7fd2",// 적금
    DEPOSIT: "#34dfa6",    // 예금
    FOREIGN: "#fac569",    // 외환
    GOLD: "#ff6161",       // 현물
    LIABILITIES: "#ef4444",// 총부채(대출)
    AVG: "#9ca3af",        // 평균(회색)
  };
  const METRIC_COLORS = {
    NET_WORTH: "#87259b",  // 순자산
  };

  // 막대 끝에 값 표시(퍼센트/금액) 플러그인
  const endLabelPlugin = {
    id: "endLabelPlugin",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const { ctx, data } = chart;
      const formatter =
        pluginOptions?.formatter ||
        ((v) => String(v)); // 기본 포매터

      ctx.save();
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#374151";

      const meta = chart.getDatasetMeta(0);
      if (!meta) return;

      // dataset 0 기준으로 라벨 찍기(“나” 값)
      meta.data.forEach((el, i) => {
        const { x, y } = el.tooltipPosition();
        const raw = data.datasets[0].data[i];
        const label = formatter(raw, i);
        // 막대 오른쪽 바깥 6px
        ctx.fillText(label, x + 6, y);
      });

      const metaAvg = chart.getDatasetMeta(1);
      metaAvg?.data.forEach((el, i) => {
        const { x, y } = el.tooltipPosition();
        const raw = data.datasets[1].data[i];
        const label = formatter(raw, i);
        ctx.fillStyle = "#6B7280";
        ctx.fillText(label, x + 6, y + 12); // 평균은 한 줄 아래
      });

      ctx.restore();
    },
  };
  ChartJS.register(endLabelPlugin);

  // 첫 진입 시 기존 프로필 조회 → 없으면 폼 페이지로 이동시켜도 됨
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/asset/peer/profile"); // 없으면 204/404로 가정
        if (res?.data) {
          const p = res.data;
          
          setRawProfile(p);
          setNeedProfile(false);
          
          const cmp = await api.post("/api/asset/peer/profile", p);
          setCompare(cmp.data);
          console.log(cmp.data);
          setProfile({
            genderLabel: cmp.data.genderLabel,
            ageBandLabel: cmp.data.ageBandLabel,
            incomeCdLabel: cmp.data.incomeCdLabel,
            jobCdLabel: cmp.data.jobCdLabel,
            regionLabel: cmp.data.regionLabel,
          });
        }
        else setNeedProfile(true);
      } catch {
        setNeedProfile(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 수정 저장 처리(폼에서 돌아온 데이터 반영)
  const handleProfileSaved = (resDataOrForm) => {
    // 백엔드가 compare 응답을 돌려준다고 가정
    setCompare(resDataOrForm);
    setProfile({
      genderLabel: resDataOrForm.genderLabel,
      ageBandLabel: resDataOrForm.ageBandLabel,
      incomeCdLabel: resDataOrForm.incomeCdLabel,
      jobCdLabel: resDataOrForm.jobCdLabel,
      regionLabel: resDataOrForm.regionLabel,
    });
    setRawProfile({
      gender:  resDataOrForm.gender,
      ageBand: resDataOrForm.ageBand,
      incomeCd:resDataOrForm.incomeCd,
      jobCd:   resDataOrForm.jobCd,
      regionCd:resDataOrForm.regionCd,
    });
    setNeedProfile(false);
    setEditing(false); // ← 편집 모드 종료
  };

  // “수정하기” 버튼 핸들러
  const startEdit = () => {
    setEditing(true);
  };

  const asInt = (v) => Math.trunc(Number(v ?? 0));

  const compareOptions = useMemo(
    () => ({
      indexAxis: "y", // 가로 막대
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || "";
              const intVal = Math.trunc(Number(ctx.raw ?? 0)); // 원 단위
              return ` ${label}: ${intVal.toLocaleString("ko-KR")}원`;
            },
          },
        },
      },
      // 막대 끝에 금액 라벨 노출
      endLabelPlugin: {
        formatter: (v) =>
          `${Math.trunc(Number(v ?? 0)).toLocaleString("ko-KR")}원`,
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#E5E7EB" },
          ticks: {
            maxTicksLimit: 4,
            callback: (v) => Math.trunc(Number(v)).toLocaleString("ko-KR"),
          },
        },
        y: {
          grid: { display: false },
        },
      },
    }),
    []
  );

  // 순자산 비교용 데이터
  const netWorthData = useMemo(() => {
    if (!compare) return null;
    const left = asInt(compare.myNetWorth);
    const right = asInt(compare.avgNetWorth);
    return {
      labels: ["나", "평균"],
      datasets: [
        {
          label: "순자산",
          data: [left, right],
          backgroundColor: [METRIC_COLORS.NET_WORTH, COLOR_MAP.AVG],
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    };
  }, [compare]);

  // 퍼센트 유틸 (0~100, 소수1자리)
  const pct = (part, total) => {
    const P = Number(total) > 0 ? (Number(part) / Number(total)) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(P) ? P : 0));
  };

  // 퍼센트용 차트 옵션 (x축 %)
  const percentOptions = useMemo(() => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${Math.floor(ctx.parsed.x)}%`,
        },
      },
    },
    endLabelPlugin: {
       formatter: (v) => `${Math.floor(Number(v ?? 0))}%`,
     },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (v) => `${v}%`,
        },
        grid: { color: "#E5E7EB" },
      },
      y: { grid: { display: false } },
    },
  }), []);

  // 자산 구성 비교용 (입출금/적금/예금/외환/현물/대출) 공통 생성 함수
  const buildAssetCompareData = (myVal, avgVal, myTotal, avgTotal, color) => ({
    labels: ["나", "평균"],
    datasets: [{
      data: [ Math.floor(pct(myVal, myTotal)), Math.floor(pct(avgVal, avgTotal)) ],
      backgroundColor: [color, COLOR_MAP.AVG],
      borderRadius: 8,
      barThickness: 18,
    }],
  });

  const badgeBySeverity = {
    good: "border-green-200 bg-green-50 text-green-800",
    info: "border-yellow-200 bg-yellow-50 text-yellow-800",
    warn: "border-red-200 bg-red-50 text-red-800",
  };

  const cashData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myCash, compare.avgCash, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.CASH)
        : null,
    [compare]
  );
  const installmentData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myInstallment, compare.avgInstallment, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.INSTALLMENT)
        : null,
    [compare]
  );
  const depositData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myDeposit, compare.avgDeposit, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.DEPOSIT)
        : null
    [compare]
  );
  const foreignData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myForeign, compare.avgForeign, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.FOREIGN)
        : null,
    [compare]
  );
  const goldData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myGold, compare.avgGold, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.GOLD)
        : null,
    [compare]
  );
  const liabilitiesData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myTotalLiabilities, compare.avgTotalLiabilities, compare.myTotalAssets, compare.avgTotalAssets, COLOR_MAP.LIABILITIES)
        : null,
    [compare]
  );

  if (loading) {
    return <main className="content-container p-6">로딩 중…</main>;
  }

  // ===== 렌더링 분기 =====
  // 1) 첫 진입: 프로필 없음 → 폼 보여주기
  // 2) 수정하기 클릭: editing=true → 폼 보여주기
  if (needProfile || editing) {
    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="content-container px-6 pt-8 md:pt-10 pb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {needProfile ? "또래 비교 시작하기" : "나의 프로필 수정"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">그룹 기준을 선택해 주세요.</p>
        </header>

        <section className="content-container px-6 pb-16">
          <PeerProfileForm
            initialValues={editing ? rawProfile : null}
            submitLabel={editing ? "저장" : "시작하기"}
            onSaved={handleProfileSaved}
            onCancel={editing ? () => setEditing(false) : undefined}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      {/* 상단 타이틀 영역 */}
      <header className="content-container px-6 pt-8 md:pt-10 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">또래 비교</h1>
        <p className="text-sm text-gray-500 mt-1">
          동일 연령대 · 소득대 · 지역 기준의 평균과 비교한 자산 및 부채 수준입니다.
        </p>
      </header>

      <section className="content-container px-6 pt-0 pb-16 md:pb-20">
        <AssetHubNav />

        {needProfile ? (
          <PeerProfileForm onSaved={handleProfileSaved}/>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

            {/* 상단: 나의 프로필 + 순자산 비교 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 나의 프로필 */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4 relative">
                <button
                  onClick={startEdit}
                  className="absolute top-4 right-4 text-xs font-medium text-blue-600 hover:text-blue-700
                            px-2 py-1 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="프로필 수정하기"
                >
                  수정하기
                </button>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">나의 프로필</h2>
                  <p className="text-[12px] text-gray-500 -mt-1">
                    비교 그룹 산정에 사용된 정보입니다.
                  </p>
                </div>

                <ul className="text-sm text-gray-700 space-y-5">
                  <li className="flex justify-between">
                    <span className="text-[12px] text-gray-500">성별</span>
                    <span className="font-medium text-gray-900">{profile.genderLabel}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[12px] text-gray-500">연령대</span>
                    <span className="font-medium text-gray-900">{profile.ageBandLabel}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[12px] text-gray-500">월 소득</span>
                    <span className="font-medium text-gray-900">{profile.incomeCdLabel}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[12px] text-gray-500">직업</span>
                    <span className="font-medium text-gray-900">{profile.jobCdLabel}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[12px] text-gray-500">거주 지역</span>
                    <span className="font-medium text-gray-900">{profile.regionLabel}</span>
                  </li>
                </ul>

                {/* <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-700 font-medium">
                  표본 수: 동일 조건 {Number(compare?.nCustomers ?? 0).toLocaleString()}명
                </div> */}

              </div>

              {/* 순자산 비교 */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">순자산 비교</h2>
                    <p className="text-[12px] text-gray-500">
                      동일 그룹 평균 대비 내 순자산 위치입니다.
                    </p>
                  </div>
                  <span className="rounded-full bg-green-50 text-green-700 text-[11px] font-medium px-2 py-0.5 border border-green-200">
                    상위{Number(compare?.topPct ?? 0).toLocaleString()}%
                  </span>
                </div>

                <div className="h-28">
                  {netWorthData && (<Bar data={netWorthData} options={compareOptions} />)}
                </div>
                
                

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-md bg-white border border-gray-200 p-4">
                    <div className="text-[12px] text-gray-500">내 순자산</div>
                    <div className="font-semibold text-gray-900">
                      {Math.floor(Number(compare?.myNetWorth ?? 0)).toLocaleString()}원
                    </div>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-4">
                    <div className="text-[12px] text-gray-500">그룹 평균</div>
                    <div className="font-semibold text-gray-900">
                      {Math.floor(Number(compare?.avgNetWorth ?? 0)).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 자산 구성 비교 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">자산 구성 비교</h2>
                <p className="text-[12px] text-gray-500">
                  현금성 자산, 예금, 투자 자산 비중을 또래 평균과 비교했습니다.
                </p>
              </div>

              {/* <PlaceholderChart label="막대 비교 (나 vs 평균)" height="h-56" /> */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 입출금 자산 비중 </div>
                  <div className="h-24">
                    {cashData && ( <Bar data={cashData} options={percentOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 적금 자산 비중 </div>
                  <div className="h-24">
                    {installmentData && ( <Bar data={installmentData} options={percentOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 예금 자산 비중 </div>
                  <div className="h-24">
                    {depositData && ( <Bar data={depositData} options={percentOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 외환 자산 비중 </div>
                  <div className="h-24">
                    {foreignData && ( <Bar data={foreignData} options={percentOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 현물 자산 비중 </div>
                  <div className="h-24">
                    {goldData && ( <Bar data={goldData} options={percentOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 대출 비중 </div>
                  <div className="h-24">
                    {liabilitiesData && ( <Bar data={liabilitiesData} options={percentOptions} />)}
                  </div>
                </div>
              </div>

            </div>

            {/* 맞춤 안내 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(compare?.advice ?? []).map((a) => (
                <div key={a.code}
                  className={`rounded-md border p-4 text-sm ${badgeBySeverity[a.severity] || badgeBySeverity.info}`}>
                  <div className="font-semibold mb-1">{a.title}</div>
                  <div>{a.message}</div>
                </div>
              ))}

              {/* fallback (백엔드가 아직 조언을 안 줬을 때) */}
              {(!compare?.advice || compare.advice.length === 0) && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  데이터에 기반한 안내를 준비 중입니다.
                </div>
              )}
            </div>
          </div>
        )}
        
      </section>
    </main>
  );
}
