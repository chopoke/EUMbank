export function StatCard({ title, value, sub, tone = "default" }) {
  // tone === "alert" 같은 것도 확장 가능
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm flex flex-col gap-2">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      {sub && (
        <div className="text-[12px] text-gray-500 font-medium">
          {sub}
        </div>
      )}
    </div>
  );
}
