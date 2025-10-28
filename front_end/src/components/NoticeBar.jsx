export default function NoticeBar({ children, className = "" }) {
  return (
    <div className={`notice-bar ${className}`}>
      <span className="notice-ico" aria-hidden>⚠️</span>
      <div className="notice-text">{children}</div>
    </div>
  );
}
