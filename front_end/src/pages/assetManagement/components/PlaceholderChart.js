export function PlaceholderChart({ label = "차트", height = "h-40" }) {
  return (
    <div
      className={`rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-500 flex flex-col items-center justify-center text-center ${height}`}
    >
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="text-[11px] text-gray-400">데이터 연동 예정</div>
    </div>
  );
}
