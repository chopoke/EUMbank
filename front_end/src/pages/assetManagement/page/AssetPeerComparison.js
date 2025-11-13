import { BarCompareStatic } from "../components/StaticCharts";
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

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/asset/peer/profile"); // 없으면 204/404로 가정
        if (res?.data) {
          const p = res.data;
          setNeedProfile(false);
          
          const cmp = await api.post("/api/asset/peer/profile", p);
          setCompare(cmp.data);
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

  const handleProfileSaved = (resDataOrForm) => {
    setCompare(resDataOrForm);
    setProfile({
      genderLabel: resDataOrForm.genderLabel,
      ageBandLabel: resDataOrForm.ageBandLabel,
      incomeCdLabel: resDataOrForm.incomeCdLabel,
      jobCdLabel: resDataOrForm.jobCdLabel,
      regionLabel: resDataOrForm.regionLabel,
    });
    setNeedProfile(false);
  };

  const toMillion = (v) => Math.round(Number(v ?? 0) / 1_000_000);

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
              const val = ctx.parsed.x;
              return ` ${label}: ${Number(val ?? 0).toLocaleString("ko-KR")} 백만`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#E5E7EB" },
          ticks: {
            maxTicksLimit: 4,
            callback: (v) => `${v}`,
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
    const left = toMillion(compare.myNetWorth);
    const right = toMillion(compare.avgNetWorth);
    return {
      labels: ["나", "평균"],
      datasets: [
        {
          label: "순자산 (백만 원 기준)",
          data: [left, right],
          backgroundColor: ["#3b82f6", "#9ca3af"],
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    };
  }, [compare]);

  // 자산 구성 비교용 (입출금/적금/예금/외환/현물/대출) 공통 생성 함수
  const buildAssetCompareData = (myVal, avgVal) => {
    const left = toMillion(myVal);
    const right = toMillion(avgVal);
    return {
      labels: ["나", "평균"],
      datasets: [
        {
          data: [left, right],
          backgroundColor: ["#3b82f6", "#9ca3af"],
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    };
  };

  const cashData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myCash, compare.avgCash)
        : null,
    [compare]
  );
  const installmentData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myInstallment, compare.avgInstallment)
        : null,
    [compare]
  );
  const depositData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myDeposit, compare.avgDeposit)
        : null,
    [compare]
  );
  const foreignData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myForeign, compare.avgForeign)
        : null,
    [compare]
  );
  const goldData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(compare.myGold, compare.avgGold)
        : null,
    [compare]
  );
  const liabilitiesData = useMemo(
    () =>
      compare
        ? buildAssetCompareData(
            compare.myTotalLiabilities,
            compare.avgTotalLiabilities
          )
        : null,
    [compare]
  );

  if (loading) {
    return <main className="content-container p-6">로딩 중…</main>;
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
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">나의 프로필</h2>
                  <p className="text-[12px] text-gray-500 -mt-1">
                    비교 그룹 산정에 사용된 정보입니다.
                  </p>
                </div>

                <ul className="text-sm text-gray-700 space-y-3">
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

                {typeof compare?.nCustomers === "number" && compare.nCustomers > 0 && (
                  <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-700 font-medium">
                    표본 수: 동일 조건 {compare.nCustomers.toLocaleString()}명
                  </div>
                )}
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
                    상위 22%
                  </span>
                </div>

                <div className="h-28">
                  {netWorthData && (<Bar data={netWorthData} options={compareOptions} />)}
                </div>
                
                {/* <BarCompareStatic
                    metric="순자산 (백만 원 기준)"
                    leftLabel="나"
                    rightLabel="평균"
                    leftValue={Math.round(Number((compare?.myNetWorth ?? 0)) / 1_000_000)}
                    rightValue={Math.round(Number((compare?.avgNetWorth ?? 0)) / 1_000_000)}
                  /> */}

                {/* <PlaceholderChart label="분포 차트 (박스플롯 등)" height="h-40" /> */}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-md bg-white border border-gray-200 p-4">
                    <div className="text-[12px] text-gray-500">내 순자산</div>
                    <div className="font-semibold text-gray-900">
                      {Number(compare?.myNetWorth ?? 0).toLocaleString()}원
                    </div>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-4">
                    <div className="text-[12px] text-gray-500">그룹 평균</div>
                    <div className="font-semibold text-gray-900">
                      {Number(compare?.avgNetWorth ?? 0).toLocaleString()}원
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
                    {compare && ( <Bar data={cashData} options={compareOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 적금 자산 비중 </div>
                  <div className="h-24">
                    {compare && ( <Bar data={installmentData} options={compareOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 예금 자산 비중 </div>
                  <div className="h-24">
                    {compare && ( <Bar data={depositData} options={compareOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 외환 자산 비중 </div>
                  <div className="h-24">
                    {compare && ( <Bar data={foreignData} options={compareOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 현물 자산 비중 </div>
                  <div className="h-24">
                    {compare && ( <Bar data={goldData} options={compareOptions} />)}
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="text-[12px] text-gray-500 mb-2"> 대출 비중 </div>
                  <div className="h-24">
                    {compare && ( <Bar data={liabilitiesData} options={compareOptions} />)}
                  </div>
                </div>
                {/* <BarCompareStatic
                  metric="입출금 자산 비중"
                  leftLabel="나" rightLabel="평균"
                  leftValue={Math.round(Number((compare?.myCash ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgCash ?? 0)) / 1_000_000)}
                />
                <BarCompareStatic
                  metric="적금 자산 비중"
                  leftLabel="나" rightLabel="평균"
                  leftValue={Math.round(Number((compare?.myInstallment ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgInstallment ?? 0)) / 1_000_000)}
                />
                <BarCompareStatic
                  metric="예금 자산 비중"
                  leftValue={Math.round(Number((compare?.myDeposit ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgDeposit ?? 0)) / 1_000_000)}
                />
                <BarCompareStatic
                  metric="외환 자산 비중"
                  leftValue={Math.round(Number((compare?.myForeign ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgForeign ?? 0)) / 1_000_000)}
                />
                <BarCompareStatic
                  metric="현물 자산 비중"
                  leftValue={Math.round(Number((compare?.myGold ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgGold ?? 0)) / 1_000_000)}
                />
                <BarCompareStatic
                  metric="대출 비중"
                  leftValue={Math.round(Number((compare?.myTotalLiabilities ?? 0)) / 1_000_000)}
                  rightValue={Math.round(Number((compare?.avgTotalLiabilities ?? 0)) / 1_000_000)}
                /> */}
              </div>

            </div>

            {/* 맞춤 안내 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                또래 평균 대비 투자 비중이 낮습니다. 매달 일정 금액을 자동으로 투자하는
                방식이 목표 달성에 도움이 될 수 있습니다.
              </div>

              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                부채 비율이 양호하므로, 추가 대출 없이도 적금 납입액을 소폭 늘릴 수 있는
                여력이 있습니다.
              </div>
            </div>

          </div>
        )}
        
      </section>
    </main>
  );
}
