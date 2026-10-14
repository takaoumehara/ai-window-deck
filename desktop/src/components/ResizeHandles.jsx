import React, { useRef } from "react";

const KEY_STEP = 0.02;
const KEY_STEP_LARGE = 0.1;

/**
 * Dividers in the gaps between panes. Drag to resize (moves are batched to
 * one per frame), arrow keys step 2% (Shift: 10%), double-click or Enter
 * resets to equal sizes. Native pages are drawn above the DOM, so a handle is
 * only reachable in the gap between two pages; App freezes the pages to
 * snapshots while a drag runs.
 */
export function ResizeHandles({ handles, size, label, onStart, onMove, onEnd, onStep, onReset }) {
  const drag = useRef(null);

  const finish = (cancelled) => {
    const current = drag.current;
    if (!current) return;
    cancelAnimationFrame(current.frame);
    drag.current = null;
    document.body.style.removeProperty("cursor");
    onEnd(current.handle, cancelled);
  };

  return handles.map((handle) => {
    const vertical = handle.axis === "x";
    const extent = vertical ? size.width : size.height;
    const style = vertical
      ? { left: `${handle.position * 100}%`, top: `${handle.start * 100}%`, height: `${handle.length * 100}%` }
      : { top: `${handle.position * 100}%`, left: `${handle.start * 100}%`, width: `${handle.length * 100}%` };
    return (
      <div
        key={handle.id}
        role="separator"
        tabIndex={0}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(handle.value * 100)}
        aria-label={label(handle)}
        title={label(handle)}
        style={style}
        className={`deck-divider group ${vertical ? "is-vertical" : "is-horizontal"}`}
        onPointerDown={(event) => {
          if (event.button !== 0 || !extent) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          drag.current = { handle, origin: vertical ? event.clientX : event.clientY, delta: 0, frame: 0 };
          document.body.style.cursor = vertical ? "col-resize" : "row-resize";
          onStart(handle);
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) return;
          // The pointer can be released over a page before the pages hide, and
          // that release never reaches the shell.
          if (event.buttons === 0) {
            finish(false);
            return;
          }
          current.delta = ((vertical ? event.clientX : event.clientY) - current.origin) / extent;
          if (current.frame) return;
          current.frame = requestAnimationFrame(() => {
            current.frame = 0;
            if (drag.current === current) onMove(current.handle, current.delta);
          });
        }}
        onPointerUp={() => {
          const current = drag.current;
          if (current) onMove(current.handle, current.delta);
          finish(false);
        }}
        onPointerCancel={() => finish(true)}
        onLostPointerCapture={() => finish(false)}
        onDoubleClick={() => onReset(handle)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onReset(handle);
            return;
          }
          if (event.key === "Escape" && drag.current) {
            event.preventDefault();
            finish(true);
            return;
          }
          const back = vertical ? "ArrowLeft" : "ArrowUp";
          const forward = vertical ? "ArrowRight" : "ArrowDown";
          if (event.key !== back && event.key !== forward) return;
          event.preventDefault();
          event.stopPropagation();
          const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
          onStep(handle, event.key === back ? -step : step);
        }}
      >
        <span className="deck-divider__line" aria-hidden="true" />
      </div>
    );
  });
}
