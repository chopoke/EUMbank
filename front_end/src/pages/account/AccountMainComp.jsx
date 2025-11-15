import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {fetchAccounts} from "../../api/accounts";
import PriceWidget from "../spot/components/PriceWidget";


const Icon = ({ path, label }) => (
  <span className="icon-wrapper" aria-hidden="true">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {label && <span className="sr-only">{label}</span>}
  </span>
);

const paths = {
  arrowR: "M5 12h14M13 5l7 7-7 7",
  chart: "M4 20h16M7 16v-6M12 20V8M17 20v-10",
};

function formatWon(n) {
  const num = Number(n || 0);

  return num.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
// ================== 외화용 유틸 추가
function formatFx(amount, currency = "USD") {
  const cur = String(currency || "KRW").toUpperCase();
  const digits =
    cur === "KRW" || cur === "JPY" || cur === "IDR" ? 0 :
    cur === "BHD" || cur === "KWD" ? 3 : 2;

  const n = Number(amount || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  if (cur === "KRW") return `${sign}₩${abs}`;
  return `${sign}${cur} ${abs}`;
}
//=====================

export const AccountMainComp = ({ user, cards = [], loans = [] }) => {
  const isLoggedIn = !!user;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 계좌목록 호출
  useEffect(() => {
    if (!isLoggedIn) return;

    let alive = true;
    setLoading(true);
    setError(null);

    fetchAccounts()
      .then((res) => {
        if (!alive) return;
        const rows = res.data || [];

        const mapped = rows.map((d) => {
          const disName =
            d.a_nickname ||
            d.a_account_code ||
            d.a_account_type ||
            "계좌명";

          return {
            id: d.a_no,
            disName,
            accountType: d.a_account_type || "입출금",
            balance: Number(d.a_balance || 0),
            currency: d.a_currency || "KRW",
          };
        });

        setAccounts(mapped);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // 총자산 (원화 기준)
  const total = useMemo(
    () =>
      accounts
        .filter((a) => (a.currency || "KRW").toUpperCase() === "KRW")
        .reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  // 잔액 많은 순 Top2 (원화만)
  const top2Accounts = useMemo(
    () =>
      [...accounts]
        .filter((a) => (a.currency || "KRW").toUpperCase() === "KRW")
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 2),
    [accounts]
  );

  // 외화 계좌 목록
  const fxAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => (a.currency || "KRW").toUpperCase() !== "KRW"
      ),
    [accounts]
  );

  const hasFx = fxAccounts.length > 0;

  const getDetailHref = (row) => {
    if (row.accountType === "예금") {
      return `/accounts/deposit/${row.id}`;
    }
    if (row.accountType === "적금") {
      return `/accounts/installment/${row.id}`;
    }
    // 나머지는 입출금
    return `/accounts/${row.id}`;
  };

  if (!isLoggedIn) {
    return (
      <section className="account-snapshot-section">
        <div className="content-container h-[300px] py-10">
          <h1 className="text-center text-2xl">로그인이 필요합니다.</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="account-snapshot-section">
      <div className="content-container py-10">
        <div className="snapshot-grid">
          {/* ==== 왼쪽: 자산 스냅샷 카드 ==== */}
          <div className="snapshot-main-col">
            <div className="snapshot-card main-card">
              <div className="card-header">
                <div>
                  <h4 className="card-title">자산 스냅샷</h4>
                  <p className="card-subtitle">
                    총자산{" "}
                    <b className="card-subtitle-highlight">
                      {formatWon(total)} 원
                    </b>
                  </p>
                </div>
                <button
                  className="text-link"
                  onClick={() => navigate("/accounts")}
                >
                  계좌관리
                </button>
              </div>

              {/* 잔액 top2 계좌  */}
              <div className="account-list-grid">
                {loading && (
                  <div className="account-item">
                    <div className="account-name">계좌를 불러오는 중...</div>
                    <div className="account-balance">-</div>
                  </div>
                )}

                {!loading &&
                  top2Accounts.map((acc) => (
                    <div key={acc.id} className="account-item">
                      <div className="account-name">
                        {acc.disName || acc.accountType}
                      </div>
                      <div className="account-balance">
                        {formatWon(acc.balance)} 원
                      </div>
                      <button
                        className="text-link with-icon"
                        onClick={() => navigate(getDetailHref(acc))}
                      >
                        상세보기 <Icon path={paths.arrowR} />
                      </button>
                    </div>
                  ))}

                {!loading && top2Accounts.length === 0 && (
                  <div className="account-item">
                    <div className="account-name">
                      보유 중인 계좌가 없습니다.
                    </div>
                  </div>
                )}
              </div>

              {/* 하단: 외화 계좌 목록 -없으면 안 보이기 */}
              {hasFx && (
                <div className="recent-transactions">
                  <div className="card-header small">
                    <h5 className="card-title-small">외화 계좌</h5>
                    <Link
                      to="/accounts"
                      state={{ type: "외환" }}
                      className="text-link"
                    >
                      더보기
                    </Link>
                  </div>
                  <ul className="transaction-list">
                    {fxAccounts.slice(0, 3).map((a) => (
                      <li key={a.id} className="transaction-item">
                        <div className="transaction-detail">
                          <span className="transaction-date">
                            {a.currency}
                          </span>
                          <span className="transaction-desc">
                            {a.disName || a.accountType}
                          </span>
                        </div>
                        <span className="transaction-amount positive">
                          {formatFx(a.balance, a.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ================= 오른쪽 사이드 카드  */}
          <div className="snapshot-side-col">
            {/* 현물 시세 */}
            <div className="snapshot-card side-card">
              <div className="card-header-icon small">
                <div className="font-medium">현물 시세</div>
                <Icon path={paths.chart} />
              </div>
              <div>
                <PriceWidget
                  size="small"
                  showChart={false}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountMainComp;
