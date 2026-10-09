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
      className={`h-10 w-full rounded-tick border border-ink/25 bg-transparent px-3 text-sm text-ink transition-colors duration-fast placeholder:text-paper-mute hover:border-ink/50 focus:border-ink focus:outline-none ${className}`}
      {...props}
    />
  );
});
