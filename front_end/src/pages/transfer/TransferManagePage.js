import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { transferApi } from "../../api/transferApi";

const PAGE_SIZE = 8;

const STATUS_TEXT = {
  SCHEDULED: "예정",
  PROCESSING: "진행 중",
  PAUSED: "일시 정지",
  COMPLETED: "완료",
  CANCELLED: "취소",
  FAILED: "실패",
  UNKNOWN: "기타",
};

const STATUS_PRIORITY = {
  SCHEDULED: 0,
  PAUSED: 1,
  PROCESSING: 2,
  FAILED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  UNKNOWN: 6,
};

const FAILED_CODES = new Set([
  "FAILED",
  "TRANSFER_ERROR",
  "SYSTEM_ERROR",
  "INSUFFICIENT_BALANCE",
  "LIMIT_EXCEEDED",
]);

const statusFilters = [
  { key: "ALL", label: "전체" },
  { key: "SCHEDULED", label: "예정" },
  { key: "PROCESSING", label: "진행 중" },
  { key: "COMPLETED", label: "완료" },
  { key: "CANCELLED", label: "취소" },
  { key: "FAILED", label: "실패" },
];

const sortOptions = [
  { key: "upcoming", label: "다음 실행일 순" },
  { key: "createdDesc", label: "등록일 최신 순" },
  { key: "amountDesc", label: "금액 높은 순" },
];

function normalizeStatus(status) {
  if (!status) {
    return "UNKNOWN";
  }
  if (FAILED_CODES.has(status)) {
    return "FAILED";
  }
  const upper = status.toUpperCase();
  if (STATUS_PRIORITY[upper] !== undefined) {
    return upper;
  }
  return "UNKNOWN";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("ko-KR").format(value || 0);
}

function parseDateTime(value) {
  if (!value) {
    return null;
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTime(date) {
  if (!date) {
    return "-";
  }
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function deriveAutoGroupKey(order) {
  const created = order.createdAt || "";
  return `AUTO:${created}:${order.destAccountNo}:${order.amount}`;
}

function deriveGroupStatus(orders) {
  const normalized = orders.map((order) => normalizeStatus(order.status));
  if (normalized.includes("SCHEDULED")) {
    return "SCHEDULED";
  }
  if (normalized.includes("PROCESSING")) {
    return "PROCESSING";
  }
  if (normalized.includes("PAUSED")) {
    return "PAUSED";
  }
  if (normalized.every((status) => status === "COMPLETED")) {
    return "COMPLETED";
  }
  if (normalized.every((status) => status === "CANCELLED")) {
    return "CANCELLED";
  }
  if (normalized.some((status) => status === "FAILED")) {
    return "FAILED";
  }
  return normalized[0] ?? "UNKNOWN";
}

function getBadgeClass(status) {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PROCESSING":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PAUSED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function buildAutoGroups(orders) {
  const groups = new Map();

  orders.forEach((order) => {
    const key = deriveAutoGroupKey(order);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(order);
  });

  return Array.from(groups.entries()).map(([key, groupOrders]) => {
    const sorted = [...groupOrders].sort((a, b) => {
      if (!a.startAtDate || !b.startAtDate) {
        return 0;
      }
      return a.startAtDate - b.startAtDate;
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const status = deriveGroupStatus(sorted);
    const scheduledOrders = sorted.filter((order) => normalizeStatus(order.status) === "SCHEDULED");
    const nextExecution = scheduledOrders.length > 0 ? scheduledOrders[0].startAtDate : null;

    return {
      type: "AUTO",
      id: key,
      status,
      orders: sorted,
      accountNo: first.accountNo,
      bankCode: first.bankCode,
      destAccountNo: first.destAccountNo,
      memo: first.memo,
      amountPerTransfer: first.amount,
      totalAmount: first.amount * sorted.length,
      repeatCount: sorted.length,
      transferDay: first.startAtDate ? first.startAtDate.getDate() : null,
      startYearMonth: first.startAtDate
        ? `${first.startAtDate.getFullYear()}.${String(first.startAtDate.getMonth() + 1).padStart(2, "0")}`
        : "-",
      endDate: last.startAtDate,
      nextExecution,
      createdAt: first.createdAtDate,
      scheduledOrderIds: scheduledOrders.map((order) => order.orderId),
      actionableOrderIds: sorted
        .filter((order) => {
          const mapped = normalizeStatus(order.status);
          return mapped !== "COMPLETED" && mapped !== "CANCELLED";
        })
        .map((order) => order.orderId),
    };
  });
}

function buildReserveItems(orders) {
  return orders.map((order) => ({
    type: "RESERVE",
    id: order.orderId,
    status: normalizeStatus(order.status),
    order,
    accountNo: order.accountNo,
    bankCode: order.bankCode,
    destAccountNo: order.destAccountNo,
    memo: order.memo,
    amount: order.amount,
    scheduleAt: order.startAtDate,
    createdAt: order.createdAtDate,
  }));
}

function summarizeOrders(rawOrders) {
  const normalized = rawOrders.map((order) => ({
    ...order,
    status: order.status || "UNKNOWN",
    executionType: order.executionType || "RESERVE",
    startAtDate: parseDateTime(order.startAt),
    endAtDate: parseDateTime(order.endAt),
    createdAtDate: parseDateTime(order.createdAt),
    amount: order.amount || 0,
  }));

  const autoGroups = buildAutoGroups(normalized.filter((order) => order.executionType === "AUTO"));
  const reserveItems = buildReserveItems(normalized.filter((order) => order.executionType !== "AUTO"));

  return [...autoGroups, ...reserveItems];
}

function AutoTransferDetailModal({ group, onClose }) {
  if (!group) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-modal-title"
      >
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 id="auto-modal-title" className="text-lg font-semibold text-gray-900">
              자동이체 상세 일정
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {group.destAccountNo} · 매월 {group.transferDay ?? "-"}일 · {group.repeatCount}회
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            닫기
          </button>
        </header>
        <section className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
            <div>
              <span className="text-gray-500">총 금액</span>
              <div className="mt-1 font-semibold text-gray-900">
                ₩{formatCurrency(group.totalAmount)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">1회당 금액</span>
              <div className="mt-1 font-semibold text-gray-900">
                ₩{formatCurrency(group.amountPerTransfer)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">첫 실행</span>
              <div className="mt-1 font-medium">
                {group.orders[0]?.startAtDate ? formatDateTime(group.orders[0].startAtDate) : "-"}
              </div>
            </div>
            <div>
              <span className="text-gray-500">마지막 실행</span>
              <div className="mt-1 font-medium">{formatDateTime(group.endDate)}</div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">회차</th>
                  <th className="px-4 py-2 text-left font-medium">실행 예정일</th>
                  <th className="px-4 py-2 text-left font-medium">상태</th>
                  <th className="px-4 py-2 text-right font-medium">금액</th>
                  <th className="px-4 py-2 text-left font-medium">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.orders.map((order, index) => {
                  const mappedStatus = normalizeStatus(order.status);
                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-2 text-gray-900">{formatDateTime(order.startAtDate)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getBadgeClass(mappedStatus)}`}
                        >
                          {STATUS_TEXT[mappedStatus] ?? STATUS_TEXT.UNKNOWN}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        ₩{formatCurrency(order.amount)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{order.memo || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TransferManagePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilterKey, setStatusFilterKey] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortKey, setSortKey] = useState("upcoming");
  const [page, setPage] = useState(1);
  const [modalGroup, setModalGroup] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await transferApi.getAccounts();

        if (response.data?.success) {
          const list = response.data?.data?.accounts ?? [];
          setAccounts(list);

          const passedAccount =
            location.state?.accountNo ||
            location.state?.fromAccountNumber ||
            null;

          const initialAccount =
            (passedAccount && list.find((item) => item.accountNo === passedAccount)) ||
            list[0] ||
            null;

          setSelectedAccount(initialAccount ?? null);
        } else {
          throw new Error(response.data?.message ?? "계좌 목록을 불러올 수 없습니다.");
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.message || "계좌 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchAccounts();
  }, [location.state]);

  useEffect(() => {
    if (!selectedAccount?.aNo) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await transferApi.getReserveTransfers(selectedAccount.aNo);
        if (response.data?.success) {
          setOrders(response.data?.data ?? []);
        } else {
          throw new Error(response.data?.message ?? "이체 내역을 불러올 수 없습니다.");
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.message || "예약/자동이체 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedAccount]);

  const summarizedItems = useMemo(() => summarizeOrders(orders), [orders]);

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return summarizedItems
      .filter((item) => {
        if (statusFilterKey !== "ALL" && item.status !== statusFilterKey) {
          return false;
        }
        if (!keyword) {
          return true;
        }
        if (item.type === "AUTO") {
          return (
            item.destAccountNo?.toLowerCase().includes(keyword) ||
            item.memo?.toLowerCase().includes(keyword)
          );
        }
        return (
          item.destAccountNo?.toLowerCase().includes(keyword) ||
          item.memo?.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }

        if (sortKey === "amountDesc") {
          const amountA = a.type === "AUTO" ? a.amountPerTransfer : a.amount;
          const amountB = b.type === "AUTO" ? b.amountPerTransfer : b.amount;
          return amountB - amountA;
        }

        if (sortKey === "createdDesc") {
          const timeA = a.createdAt ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        }

        if (sortKey === "upcoming") {
          const nextA =
            a.type === "AUTO"
              ? a.nextExecution?.getTime() ?? Number.POSITIVE_INFINITY
              : a.scheduleAt?.getTime() ?? Number.POSITIVE_INFINITY;
          const nextB =
            b.type === "AUTO"
              ? b.nextExecution?.getTime() ?? Number.POSITIVE_INFINITY
              : b.scheduleAt?.getTime() ?? Number.POSITIVE_INFINITY;
          return nextA - nextB;
        }

        return 0;
      });
  }, [statusFilterKey, searchKeyword, sortKey, summarizedItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilterKey, searchKeyword, sortKey, selectedAccount]);

  const refreshOrders = async () => {
    if (!selectedAccount?.aNo) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await transferApi.getReserveTransfers(selectedAccount.aNo);
      if (response.data?.success) {
        setOrders(response.data?.data ?? []);
      } else {
        throw new Error(response.data?.message ?? "이체 내역을 불러올 수 없습니다.");
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "예약/자동이체 내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelGroup = async (group) => {
    if (!group.actionableOrderIds.length) {
      window.alert("취소 가능한 자동이체 일정이 없습니다.");
      return;
    }

    if (!window.confirm("선택된 자동이체 일정을 모두 취소하시겠습니까?")) {
      return;
    }

    setIsActionLoading(true);
    try {
      await transferApi.updateTransferOrderStatus({
        orderIds: group.actionableOrderIds,
        status: "CANCELLED",
      });
      await refreshOrders();
      window.alert("자동이체가 취소되었습니다.");
    } catch (actionError) {
      console.error(actionError);
      window.alert(actionError.response?.data?.message || "자동이체 취소 중 오류가 발생했습니다.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelReserve = async (item) => {
    if (!["SCHEDULED", "PROCESSING"].includes(item.status)) {
      window.alert("취소할 수 없는 상태입니다.");
      return;
    }

    if (!window.confirm("예약이체를 취소하시겠습니까?")) {
      return;
    }

    setIsActionLoading(true);
    try {
      await transferApi.cancelReserveTransfer(item.id);
      await refreshOrders();
      window.alert("예약이체가 취소되었습니다.");
    } catch (actionError) {
      console.error(actionError);
      window.alert(actionError.response?.data?.message || "예약이체 취소 중 오류가 발생했습니다.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <div className="text-xl font-semibold text-gray-800">표시할 이체 내역이 없습니다.</div>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        자동이체 또는 예약이체를 등록하면 이곳에서 상세한 일정과 상태를 확인할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={() => navigate("/transfer", { state: { fromAccountNumber: selectedAccount?.accountNo } })}
        className="mt-6 rounded-full bg-blue-700 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800"
      >
        이체 등록하러 가기
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">자동/예약 이체 관리</h1>
            <p className="mt-1 text-sm text-gray-600">
              자동이체와 예약이체를 한곳에서 조회하고, 일시정지·재개·해지를 빠르게 처리하세요.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              돌아가기
            </button>
            <button
              type="button"
              onClick={refreshOrders}
              className="rounded-full border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 grid max-w-[1240px] grid-cols-12 gap-6 px-6">
        <aside className="col-span-12 space-y-5 md:col-span-3">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">조회 계좌</h2>
            <p className="mt-1 text-xs text-gray-500">관리할 계좌를 선택하세요.</p>
            <select
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={selectedAccount?.aNo ?? ""}
              onChange={(event) => {
                const next = accounts.find((account) => String(account.aNo) === event.target.value);
                setSelectedAccount(next ?? null);
              }}
            >
              {accounts.map((account) => (
                <option key={account.aNo} value={account.aNo}>
                  {account.accountName || account.accountNo}
                  {account.accountName ? ` · ${account.accountNo}` : ""}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">상태 필터</h2>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
                onClick={() => setStatusFilterKey("ALL")}
              >
                초기화
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilterKey(filter.key)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    statusFilterKey === filter.key
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label className="text-xs text-gray-500" htmlFor="transfer-search">
                키워드 검색
              </label>
              <input
                id="transfer-search"
                type="text"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="수취 계좌번호, 메모 등"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </section>
        </aside>

        <section className="col-span-12 rounded-2xl border bg-white p-5 shadow-sm md:col-span-9">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="hidden text-gray-500 md:inline">총</span>
              <strong className="text-gray-900">{filteredItems.length}</strong>
              <span>건의 이체 일정</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <select
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="mt-10 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : paginatedItems.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">종류</th>
                      <th className="px-4 py-3 text-left font-medium">요약</th>
                      <th className="px-4 py-3 text-left font-medium">다음 실행</th>
                      <th className="px-4 py-3 text-right font-medium">금액</th>
                      <th className="px-4 py-3 text-left font-medium">상태</th>
                      <th className="px-4 py-3 text-center font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {item.type === "AUTO" ? "자동이체" : "예약이체"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">
                            {item.destAccountNo}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.type === "AUTO"
                              ? `매월 ${item.transferDay ?? "-"}일 · ${item.repeatCount}회 · 총 ₩${formatCurrency(
                                  item.totalAmount
                                )}`
                              : `${formatDateTime(item.scheduleAt)} 실행 예정`}
                          </div>
                          {item.memo && (
                            <div className="mt-1 text-xs text-gray-500">메모: {item.memo}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.type === "AUTO"
                            ? formatDateTime(item.nextExecution)
                            : formatDateTime(item.scheduleAt)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">
                          ₩
                          {formatCurrency(
                            item.type === "AUTO" ? item.amountPerTransfer : item.amount
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getBadgeClass(
                              item.status
                            )}`}
                          >
                            {STATUS_TEXT[item.status] ?? STATUS_TEXT.UNKNOWN}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            {item.type === "AUTO" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setModalGroup(item)}
                                  className="rounded-md border px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  상세 보기
                                </button>
                                {item.actionableOrderIds.length > 0 && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleCancelGroup(item)}
                                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                                  >
                                    해지
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setModalGroup({
                                    ...item,
                                    orders: [item.order],
                                    transferDay: item.scheduleAt ? item.scheduleAt.getDate() : null,
                                    repeatCount: 1,
                                    amountPerTransfer: item.amount,
                                    totalAmount: item.amount,
                                  })}
                                  className="rounded-md border px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  상세 보기
                                </button>
                                {["SCHEDULED", "PROCESSING"].includes(item.status) && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleCancelReserve(item)}
                                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                                  >
                                    해지
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-500">
                          {item.type === "AUTO" ? "자동이체" : "예약이체"}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {item.destAccountNo}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getBadgeClass(
                          item.status
                        )}`}
                      >
                        {STATUS_TEXT[item.status] ?? STATUS_TEXT.UNKNOWN}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-gray-600">
                      <div>
                        금액: ₩
                        {formatCurrency(
                          item.type === "AUTO" ? item.amountPerTransfer : item.amount
                        )}
                      </div>
                      <div>
                        다음 실행:{" "}
                        {item.type === "AUTO"
                          ? formatDateTime(item.nextExecution)
                          : formatDateTime(item.scheduleAt)}
                      </div>
                      {item.type === "AUTO" && (
                        <div>
                          총 {item.repeatCount}회 · 총액 ₩{formatCurrency(item.totalAmount)}
                        </div>
                      )}
                      {item.memo && <div>메모: {item.memo}</div>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalGroup(
                            item.type === "AUTO"
                              ? item
                              : {
                                  ...item,
                                  orders: [item.order],
                                  transferDay: item.scheduleAt ? item.scheduleAt.getDate() : null,
                                  repeatCount: 1,
                                  amountPerTransfer: item.amount,
                                  totalAmount: item.amount,
                                }
                          )
                        }
                        className="flex-1 rounded-md border px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        상세 보기
                      </button>
                      {item.type === "AUTO" ? (
                        item.actionableOrderIds.length > 0 && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleCancelGroup(item)}
                            className="flex-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                          >
                            해지
                          </button>
                        )
                      ) : (
                        ["SCHEDULED", "PROCESSING"].includes(item.status) && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleCancelReserve(item)}
                            className="flex-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                          >
                            해지
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 hover:bg-gray-50 disabled:opacity-40"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <div>
                  <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
                </div>
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 hover:bg-gray-50 disabled:opacity-40"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <AutoTransferDetailModal
        group={modalGroup}
        onClose={() => setModalGroup(null)}
      />
    </div>
  );
}

