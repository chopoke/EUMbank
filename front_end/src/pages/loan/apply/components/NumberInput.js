import React from "react";
import { fmtKO, toNum } from "../../util/money";

export default function NumberInput({
  value, onChange, min, max, placeholder, disabled, className = "", clampOnBlur = true,
}) {
  const [text, setText] = React.useState(value == null || value === 0 ? "" : fmtKO(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(value == null || value === 0 ? "" : fmtKO(value));
  }, [value, focused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    onChange?.(toNum(raw));
  };

  const handleBlur = () => {
    setFocused(false);
    if (!clampOnBlur) {
      const num = toNum(text);
      setText(num == null ? "" : fmtKO(num));
      return;
    }
    let num = toNum(text);
    if (num == null) {
      setText("");
      onChange?.(null);
      return;
    }
    if (min != null) num = Math.max(min, num);
    if (max != null) num = Math.min(max, num);
    setText(fmtKO(num));
    onChange?.(num);
  };

  return (
    <input
      type="tel"
      inputMode="numeric"
      className={className}
      value={text}
      onFocus={() => setFocused(true)}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}