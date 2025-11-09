import React from "react";

export default function ProductDetailsModal({ open, onClose, title, subtitle, sections = [], cta }) {
  if (!open) return null;

  const show = (v) => {
    if (v === null || v === undefined) return "-";
    const s = String(v);
    return s.trim() === "" ? "-" : s;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:max-w-xl sm:rounded-2xl bg-white shadow-2xl sm:mx-4 max-h-[88vh] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold text-gray-900 truncate">{show(title)}</h3>
              {subtitle ? <p className="mt-1 text-sm text-gray-500 truncate">{show(subtitle)}</p> : null}
            </div>
            <button onClick={onClose} className="rounded-lg px-2.5 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800">
              닫기
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-3">
              {sec.heading ? <div className="text-sm font-semibold text-gray-800">{sec.heading}</div> : null}
              <div className="divide-y divide-gray-100 rounded-xl ring-1 ring-gray-100 overflow-hidden">
                {sec.rows.map((r, j) => (
                  <div key={j} className="flex items-start justify-between gap-4 bg-white/60 px-4 py-3">
                    <div className="text-[13px] text-gray-500">{r.label}</div>
                    <div className="text-sm font-medium text-gray-900 text-right break-words max-w-[60%]">
                      {show(r.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {cta?.href ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {cta.text || "자세히 보기"}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
