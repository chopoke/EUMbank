// AssetCashflowCalendar.js
import { useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function AssetCashflowCalendar({
  month = "2025-10",
  transactions = [],
  onDayClick,
  onEventClick,
  className = "",
  tagClassMap = {
    income:  "text-emerald-600",
    expense: "text-red-600",
    auto:    "text-blue-600",
  },
}) {
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
    return () => clearTimeout(t);
  }, []);

  // 23,000 같이 천단위 콤마
  const money = useMemo(() => new Intl.NumberFormat("ko-KR"), []);
  const signAmount = (amt, type) => {
    const sign = type === "income" ? "+" : "-";
    return `${sign}${money.format(Math.abs(amt))}`;
  };

  const events = useMemo(
    () =>
      transactions.map((t, i) => ({
        id: t.id ?? `${t.date}-${i}`,
        // 제목엔 숫자만(부호 포함)
        title: signAmount(t.amount, t.type),
        start: t.date,
        allDay: true,
        extendedProps: t,
      })),
    [transactions, money]
  );

  // 숫자만 렌더(도트/배경 없음)
  const renderEvent = (arg) => {
    const t = arg.event.extendedProps;
    const tone =
      tagClassMap[t?.type] ??
      (t?.type === "income"
        ? "text-emerald-600"
        : t?.type === "expense"
        ? "text-red-600"
        : "text-blue-600");

    return (
      <span className={`text-xs font-semibold ${tone}`}>
        {arg.event.title}
      </span>
    );
  };

  return (
    <div className={`rounded-md border border-gray-200 bg-white p-3 ${className}`}>
      <style>{`.fc .fc-scroller { overflow: visible !important; }`}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={`${month}-01`}
        height="auto"
        contentHeight="auto"
        expandRows
        handleWindowResize
        fixedWeekCount={false}
        dayMaxEventRows={2}
        moreLinkText="더보기"
        // 텍스트만 보이도록
        eventDisplay="list-item"
        eventContent={renderEvent}
        dateClick={(arg) => onDayClick?.(arg.dateStr)}
        eventClick={(arg) => onEventClick?.(arg.event.extendedProps)}
        events={events}
      />
    </div>
  );
}
