import React, { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, CopyPlus, RotateCcwSquare, Smartphone, Tablet } from "lucide-react";
import { deviceMetrics, fitDevice } from "@desktop/lib/device-frame";

function StageButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="cie-tap grid h-6 w-6 shrink-0 place-items-center rounded-pill text-paper transition-colors duration-fast hover:bg-btn"
    >
      {children}
    </button>
  );
}

// Camera cutouts and the home button, drawn in the bezel at the screen's
// top (portrait) or left (landscape) edge.
function Cutout({ device, fit, landscape }) {
  const along = landscape ? fit.screen.height : fit.screen.width;
  const depth = landscape ? fit.bezel.left : fit.bezel.top;
  const place = (length, thickness) =>
    landscape
      ? { left: (depth - thickness) / 2, top: `calc(50% - ${length / 2}px)`, width: thickness, height: length }
      : { top: (depth - thickness) / 2, left: `calc(50% - ${length / 2}px)`, width: length, height: thickness };
  if (device.cutout === "island" || device.cutout === "notch") {
    const thickness = Math.max(2, depth * 0.45);
    return <span className="absolute rounded-pill bg-ink" style={place(along * (device.cutout === "island" ? 0.28 : 0.4), thickness)} aria-hidden="true" />;
  }
  if (device.cutout === "punch") {
    const size = Math.max(2, depth * 0.45);
    return <span className="absolute rounded-pill bg-ink" style={place(size, size)} aria-hidden="true" />;
  }
  if (device.type !== "phone" || device.radius) return null;
  const button = Math.max(6, depth * 0.62);
  const end = landscape ? fit.bezel.right : fit.bezel.bottom;
  const style = landscape
    ? { right: (end - button) / 2, top: `calc(50% - ${button / 2}px)`, width: button, height: button }
    : { bottom: (end - button) / 2, left: `calc(50% - ${button / 2}px)`, width: button, height: button };
  return (
    <>
      <span className="absolute rounded-pill bg-ink" style={place(along * 0.16, Math.max(2, depth * 0.08))} aria-hidden="true" />
      <span className="absolute rounded-pill border border-paper/25" style={style} aria-hidden="true" />
    </>
  );
}

/**
 * A pane in mobile preview: a toolbar (model, size, rotate, same page on
 * another device) over a device frame. The forwarded ref is the frame's
 * screen, which the page's native view covers.
 */
export const DeviceStage = React.forwardRef(function DeviceStage(
  { t, device, landscape, devices, focused, children, onChange, onRotate, onAddDevice },
  screenRef
) {
  const stageRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const measure = () => setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = fitDevice(box, device, { landscape });
  const Icon = device.type === "phone" ? Smartphone : Tablet;
  const groups = [
    ["ios", "iPhone"],
    ["android", "Android"],
    ["ipados", "iPad"],
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink text-paper">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-paper/10 px-2" onClick={(event) => event.stopPropagation()}>
        <label
          title={t("deviceModelHint")}
          className="deck-focus-within relative flex min-w-0 items-center gap-1.5 rounded-pill border border-paper-edge py-0.5 pl-2 pr-6 transition-colors duration-fast hover:border-paper"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="register shrink-0 uppercase text-ink-mute">{t("deviceModel")}</span>
          <select
            value={device.id}
            onChange={(event) => onChange(event.target.value)}
            aria-label={t("deviceModelHint")}
            className="min-w-0 cursor-pointer appearance-none truncate bg-transparent text-[13px] outline-none"
          >
            {groups.map(([os, label]) => {
              const list = devices.filter((candidate) => candidate.os === os);
              if (!list.length) return null;
              return (
                <optgroup key={os} label={label} className="bg-ink text-paper">
                  {list.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.approx ? `${candidate.name} (${t("deviceApprox")})` : candidate.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 opacity-60" aria-hidden="true" />
        </label>
        <span className="register min-w-0 truncate text-ink-mute" title={t("deviceAccuracy")}>
          {deviceMetrics(device, landscape)}
          {fit.scale < 0.995 ? ` · ${Math.round(fit.scale * 100)}%` : ""}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <StageButton label={t(landscape ? "devicePortrait" : "deviceLandscape")} onClick={onRotate}>
            <RotateCcwSquare className="h-3.5 w-3.5" aria-hidden="true" />
          </StageButton>
          <StageButton label={t("deviceAddAnother")} onClick={onAddDevice}>
            <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
          </StageButton>
        </div>
      </div>

      <div ref={stageRef} className="grid min-h-0 flex-1 place-items-center overflow-hidden">
        <div
          className={`ink-swap relative bg-paper/10 ring-1 ${focused ? "ring-paper/60" : "ring-paper/15"}`}
          style={{
            paddingTop: fit.bezel.top,
            paddingRight: fit.bezel.right,
            paddingBottom: fit.bezel.bottom,
            paddingLeft: fit.bezel.left,
            borderRadius: fit.radius + Math.min(fit.bezel.top, fit.bezel.left),
          }}
        >
          <Cutout device={device} fit={fit} landscape={landscape} />
          <div
            ref={screenRef}
            className="relative overflow-hidden bg-paper/5"
            style={{ width: fit.screen.width, height: fit.screen.height, borderRadius: fit.radius }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});
