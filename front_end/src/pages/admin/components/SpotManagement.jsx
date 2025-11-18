import { useEffect, useState } from "react";
import api from "../../../api/axios";

export default function SpotManagement() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const [summaryRes, usersRes] = await Promise.all([
          api.get("/api/admin/spot/statistics"),
          api.get("/api/admin/spot/users"),
        ]);
        if (mounted) {
          setSummary(summaryRes.data || {});
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
      } catch (err) {
        console.error("현물 통계 조회 실패:", err);
        if (mounted) {
          if (err?.response?.status === 401) {
            setError("관리자 권한이 필요합니다.");
          } else {
            setError("현물 통계를 불러오지 못했습니다.");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-2xl bg-white shadow-sm animate-pulse" />
        <div className="h-32 rounded-2xl bg-white shadow-sm animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-white shadow-sm text-red-500">
        {error}
      </div>
    );
  }

  const totalGold = Number(summary?.totalGoldBalance ?? 0);
  const totalSilver = Number(summary?.totalSilverBalance ?? 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-gray-900">현물 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          관리자 권한으로 전체 고객의 금/은 보유량을 확인합니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Gold Holdings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalGold.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })}{" "}
                g
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl">
              Au
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">전체 금 보유량</p>
        </div>

        <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Silver Holdings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalSilver.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })}{" "}
                g
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center text-xl">
              Ag
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">전체 은 보유량</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">회원별 보유량</h3>
            <p className="text-sm text-gray-500 mt-1">
              고객 번호별 금/은 보유량을 확인하세요.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-2">Customer No</th>
                <th className="text-left p-2">User ID</th>
                <th className="text-right p-2">Gold (g)</th>
                <th className="text-right p-2">Silver (g)</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    현물 지갑 정보가 없습니다.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.customerNo} className="border-t">
                  <td className="p-2 font-medium text-gray-900">{user.customerNo}</td>
                  <td className="p-2 text-gray-600">{user.userId || "-"}</td>
                  <td className="p-2 text-right text-gray-900">
                    {Number(user.gold ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}
                  </td>
                  <td className="p-2 text-right text-gray-900">
                    {Number(user.silver ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
