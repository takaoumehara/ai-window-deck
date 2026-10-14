import React from "react";

const BUTTON_TONES = {
  // Paper on the ink ground; inside a paper sheet use "ink".
  paper: "bg-paper text-ink hover:bg-paper/85",
  ink: "bg-ink text-paper hover:bg-ink/85",
  quiet: "bg-btn hover:bg-btn-hover",
};

export function Button({ tone = "quiet", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`cie-tap inline-flex h-9 items-center justify-center gap-1.5 rounded-pill px-4 text-sm transition-colors duration-fast disabled:pointer-events-none disabled:opacity-40 ${BUTTON_TONES[tone]} ${className}`}
      {...props}
    />
  );
}

// Round panel button (cie .pbtn), sized for a title bar.
export const IconButton = React.forwardRef(function IconButton({ className = "", pressed, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={`cie-tap grid h-8 w-8 shrink-0 place-items-center rounded-pill transition-colors duration-fast ${
        pressed ? "bg-paper text-ink" : "bg-btn text-paper hover:bg-btn-hover"
      } ${className}`}
      {...props}
    />
  );
});

export const Field = React.forwardRef(function Field({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-10 w-full rounded-tick border border-ink-edge bg-transparent px-3 text-sm text-ink transition-colors duration-fast placeholder:text-paper-mute hover:border-ink focus:border-ink deck-focus-ring ${className}`}
      {...props}
    />
  );
});

// Pill radio group for a sheet (paper ground).
export function Choices({ label, options, value, onChange, columns = "grid-cols-3" }) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-1.5 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={`cie-tap ink-swap h-9 truncate rounded-pill border border-solid px-3 text-sm ${
              selected ? "border-ink bg-ink text-paper" : "border-ink-edge hover:border-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
