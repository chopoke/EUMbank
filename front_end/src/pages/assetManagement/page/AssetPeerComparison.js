// src/pages/assetManagement/page/PeerComparison.js
import AssetPageHeader from "../components/AssetPageHeader";
import { Link } from "react-router-dom";
import { BarCompareStatic } from "../components/StaticCharts";
import { useEffect, useState } from "react";
import api from "../../../api/axios";
import PeerProfileForm from "../components/PeerProfileForm";


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

  if (loading) {
    return <main className="content-container p-6">로딩 중…</main>;
  }

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      <AssetPageHeader
        title="또래 비교"
        desc="동일 연령대 · 소득대 · 지역 기준의 평균과 비교한 자산 및 부채 수준입니다."
        current="peer"
      />

      <section className="content-container px-6 pt-0 pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">분석 · 추천 · 리포트를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/analysis">자산 분석</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/recommend">맞춤 추천</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/report">월간 리포트</Link>
          </div>
        </div>

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

                {/* <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-700 font-medium">
                  표본 수: 동일 조건 2,314명
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
                    상위 22%
                  </span>
                </div>

                <BarCompareStatic
                    metric="순자산 (백만 원 기준)"
                    leftLabel="나"
                    rightLabel="평균"
                    leftValue={Math.round(Number((compare?.myNetWorth ?? 0)) / 1_000_000)}
                    rightValue={Math.round(Number((compare?.avgNetWorth ?? 0)) / 1_000_000)}
                  />
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
                <BarCompareStatic
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">현금성 자산 비중</div>
                  <div className="font-semibold text-gray-900">내 42% / 평균 35%</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    평균보다 현금 보유 비율이 높습니다.
                  </div>
                </div>

                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">투자 자산 비중</div>
                  <div className="font-semibold text-gray-900">내 18% / 평균 24%</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    장기 자산 증식 측면에서 투자 비중을 조금 늘릴 여지가 있습니다.
                  </div>
                </div>

                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">부채 비율</div>
                  <div className="font-semibold text-gray-900">내 34% / 평균 41%</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    부채 관리 능력은 우수한 편입니다.
                  </div>
                </div>
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
