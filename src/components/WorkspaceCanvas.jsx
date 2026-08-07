import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { computeDynamicLayout } from "@/lib/layout-model";
import { getTranslation } from "@/lib/i18n";
import { Plus, Minus, ChevronDown, Edit2, Trash2, Check, Play, Move, RotateCcw, Grid } from "lucide-react";

// 12-column grid system for snapping
const GRID_COLS = 12;
const GRID_ROWS = 12;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function WorkspaceCanvas({
  lang,
  targetAspectRatio,
  canvasSlots,
  setCanvasSlots,
  presets,
  activePreset,
  onSelectPreset,
  onRenamePreset,
  onDeletePreset,
  onCreatePreset,
  onLaunch,
  onRetile,
  onNotice,
  onOpenEditModal,
}) {
  const t = (key) => getTranslation(lang, key);
  const canvasRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingPresetIdx, setEditingPresetIdx] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [resizingInfo, setResizingInfo] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);

  const count = canvasSlots.length;
  const currentPresetName = presets[activePreset]?.name || "A";

  // Initialize grid positions for slots if they don't have them
  const ensureGridPositions = useCallback((slots) => {
    const layout = computeDynamicLayout(slots.length, "blank");
    return slots.map((slot, i) => {
      if (slot.gridX !== undefined && slot.gridY !== undefined &&
          slot.gridW !== undefined && slot.gridH !== undefined) {
        return slot;
      }
      const cell = layout.cells[i] || { x: i % layout.cols, y: Math.floor(i / layout.cols), w: 1, h: 1 };
      const colScale = GRID_COLS / layout.cols;
      const rowScale = GRID_ROWS / layout.rows;
      return {
        ...slot,
        gridX: Math.round(cell.x * colScale),
        gridY: Math.round(cell.y * rowScale),
        gridW: Math.round(cell.w * colScale),
        gridH: Math.round(cell.h * rowScale),
      };
    });
  }, []);

  // Auto-assign grid positions when slots change count
  useEffect(() => {
    const hasPositions = canvasSlots.every(
      (s) => s.gridX !== undefined && s.gridY !== undefined
    );
    if (!hasPositions && canvasSlots.length > 0) {
      setCanvasSlots(ensureGridPositions(canvasSlots));
    }
  }, [canvasSlots.length]);

  const handleCountChange = (val) => {
    const targetCount = Math.max(1, Math.min(16, val));
    let nextSlots = [...canvasSlots];
    while (nextSlots.length < targetCount) {
      nextSlots.push({
        id: `slot-${Date.now()}-${nextSlots.length}`,
        name: `Window ${nextSlots.length + 1}`,
        urls: "",
        color: "auto",
      });
    }
    while (nextSlots.length > targetCount) {
      nextSlots.pop();
    }
    nextSlots = equalizeSlots(nextSlots);
    setCanvasSlots(nextSlots);
  };

  // Equalize all slots to evenly fill the grid
  const equalizeSlots = (slots) => {
    const n = slots.length;
    if (n === 0) return slots;
    const layout = computeDynamicLayout(n, "blank");
    const colScale = GRID_COLS / layout.cols;
    const rowScale = GRID_ROWS / layout.rows;
    return slots.map((slot, i) => {
      const cell = layout.cells[i] || { x: i % layout.cols, y: Math.floor(i / layout.cols), w: 1, h: 1 };
      return {
        ...slot,
        gridX: Math.round(cell.x * colScale),
        gridY: Math.round(cell.y * rowScale),
        gridW: Math.round(cell.w * colScale),
        gridH: Math.round(cell.h * rowScale),
      };
    });
  };

  const handleEqualize = () => {
    setCanvasSlots(equalizeSlots([...canvasSlots]));
  };

  const handleRemoveSlot = (index) => {
    const nextSlots = [...canvasSlots];
    nextSlots.splice(index, 1);
    setCanvasSlots(equalizeSlots(nextSlots));
  };

  const isBlankSlot = (slot) => {
    const urls = Array.isArray(slot.urls) ? slot.urls : String(slot.urls ?? "").split("\n");
    return !urls.some((url) => String(url).trim());
  };

  const slotUrls = (slot) => (Array.isArray(slot.urls) ? slot.urls : String(slot.urls ?? "").split("\n"))
    .map((url) => String(url).trim())
    .filter(Boolean);

  const handleDropOnCanvas = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const json = e.dataTransfer.getData("application/json");
    if (json) {
      try {
        const items = JSON.parse(json);
        if (Array.isArray(items) && items.length) {
          const newItem = items[0];
          if (index === undefined || !isBlankSlot(canvasSlots[index])) {
            onNotice?.(t("dropEmptySlotHint"));
            return;
          }
          const nextSlots = [...canvasSlots];
          nextSlots[index] = { ...nextSlots[index], ...newItem, id: nextSlots[index].id };
          setCanvasSlots(nextSlots);
        }
      } catch {
        onNotice?.(t("dropEmptySlotHint"));
      } finally {
        setDropTargetIdx(null);
      }
    }
  };

  // --- Free Drag to Reposition ---
  const handleDragStart = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIdx(idx);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const slot = canvasSlots[idx];
    const origGridX = slot.gridX;
    const origGridY = slot.gridY;

    const cellW = canvasRect.width / GRID_COLS;
    const cellH = canvasRect.height / GRID_ROWS;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const stepX = Math.round(dx / cellW);
      const stepY = Math.round(dy / cellH);

      const newX = clamp(origGridX + stepX, 0, GRID_COLS - slot.gridW);
      const newY = clamp(origGridY + stepY, 0, GRID_ROWS - slot.gridH);

      if (newX !== canvasSlots[idx].gridX || newY !== canvasSlots[idx].gridY) {
        const updated = [...canvasSlots];
        updated[idx] = { ...updated[idx], gridX: newX, gridY: newY };
        setCanvasSlots(updated);
      }
    };

    const onMouseUp = () => {
      setDraggingIdx(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // --- 4-Edge Resize ---
  const handleResizeStart = (e, idx, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingInfo({ idx, direction });

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const slot = canvasSlots[idx];
    const origX = slot.gridX;
    const origY = slot.gridY;
    const origW = slot.gridW;
    const origH = slot.gridH;

    const cellW = canvasRect.width / GRID_COLS;
    const cellH = canvasRect.height / GRID_ROWS;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const stepX = Math.round(dx / cellW);
      const stepY = Math.round(dy / cellH);

      const updated = [...canvasSlots];
      let newX = origX, newY = origY, newW = origW, newH = origH;

      if (direction === "right") {
        newW = clamp(origW + stepX, 1, GRID_COLS - origX);
      } else if (direction === "left") {
        const delta = clamp(stepX, -(origX), origW - 1);
        newX = origX + delta;
        newW = origW - delta;
      } else if (direction === "bottom") {
        newH = clamp(origH + stepY, 1, GRID_ROWS - origY);
      } else if (direction === "top") {
        const delta = clamp(stepY, -(origY), origH - 1);
        newY = origY + delta;
        newH = origH - delta;
      }

      updated[idx] = { ...updated[idx], gridX: newX, gridY: newY, gridW: newW, gridH: newH };
      setCanvasSlots(updated);
    };

    const onMouseUp = () => {
      setResizingInfo(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex flex-col gap-3 flex-1 w-full max-w-full overflow-hidden">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 gap-2 w-full">
        {/* Browser Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-200 font-bold">{t("howManyBrowsers")}</span>
          <div className="flex items-center border border-zinc-700 rounded-md bg-zinc-900">
            <button
              type="button"
              onClick={() => handleCountChange(count - 1)}
              className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              max="16"
              value={count}
              onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
              className="w-9 h-7 text-center text-xs font-bold text-white bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => handleCountChange(count + 1)}
              className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Layout Preset Dropdown + Equalize + Clear + Retile + Launch */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-8 gap-2 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 text-xs font-bold"
            >
              <span>📁 {t("standardLayout")} <b>{currentPresetName}</b></span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </Button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl z-50 flex flex-col gap-1">
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1 no-scrollbar">
                  {presets.map((preset, idx) => {
                    const isActive = idx === activePreset;
                    const isEditing = editingPresetIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectPreset(idx);
                          setDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isActive
                            ? "bg-blue-600/20 border border-blue-500/50 text-blue-300 font-bold"
                            : "hover:bg-zinc-900 text-zinc-200"
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onRenamePreset(idx, editingName);
                                setEditingPresetIdx(null);
                              }
                            }}
                            onBlur={() => {
                              onRenamePreset(idx, editingName);
                              setEditingPresetIdx(null);
                            }}
                            autoFocus
                            className="bg-zinc-900 border border-blue-500 px-1.5 py-0.5 rounded text-white text-xs w-28 focus:outline-none"
                          />
                        ) : (
                          <span className="truncate max-w-[130px]">
                            📁 {t("standardLayout")} {preset.name || String.fromCharCode(65 + idx)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPresetIdx(idx);
                              setEditingName(preset.name || "");
                            }}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {presets.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePreset(idx);
                              }}
                              className="p-1 text-zinc-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          {isActive && <Check className="w-3.5 h-3.5 text-blue-400 ml-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCreatePreset();
                    setDropdownOpen(false);
                  }}
                  className="w-full mt-1 py-1.5 text-center text-xs font-semibold text-blue-400 border border-dashed border-blue-500/40 rounded-lg hover:bg-blue-500/10 transition-colors"
                >
                  {t("newLayoutBtn")}
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEqualize}
            className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-semibold gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            {t("equalizeBtn")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCanvasSlots([])}
            className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-semibold"
          >
            {t("clearCanvas")}
          </Button>

          {/* Re-tile Open Windows button directly to the left of Launch */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRetile}
            title="起動済みウィンドウをキャンバスの最新配置に並べ直す"
            className="h-8 gap-1.5 text-xs font-bold border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400"
          >
            <Grid className="w-3.5 h-3.5 text-blue-400" />
            <span>{t("retile")}</span>
          </Button>

          <Button
            variant="hero"
            size="sm"
            onClick={onLaunch}
            className="h-8 gap-1.5 text-xs font-bold"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{t("launchBtn")}</span>
          </Button>
        </div>
      </div>

      {/* Canvas with 12×12 Grid */}
      <div
        ref={canvasRef}
        onDragOver={(e) => e.preventDefault()}
        onDragEnd={() => setDropTargetIdx(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDropTargetIdx(null);
          onNotice?.(t("dropEmptySlotHint"));
        }}
        style={{ aspectRatio: targetAspectRatio || "16/9" }}
        className="relative rounded-xl border-2 border-zinc-700 bg-zinc-950 min-h-[380px] max-h-[620px] transition-all overflow-hidden shadow-inner w-full"
      >
        {/* Grid lines (subtle visual guide) */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }}>
          {Array.from({ length: GRID_COLS - 1 }).map((_, i) => (
            <div
              key={`vline-${i}`}
              className="absolute top-0 bottom-0 border-l border-zinc-400"
              style={{ left: `${((i + 1) / GRID_COLS) * 100}%` }}
            />
          ))}
          {Array.from({ length: GRID_ROWS - 1 }).map((_, i) => (
            <div
              key={`hline-${i}`}
              className="absolute left-0 right-0 border-t border-zinc-400"
              style={{ top: `${((i + 1) / GRID_ROWS) * 100}%` }}
            />
          ))}
        </div>

        {canvasSlots.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-zinc-400 font-medium text-center px-4">
              {t("dragHint")}
            </p>
          </div>
        ) : (
          canvasSlots.map((slot, i) => {
            const gx = slot.gridX ?? 0;
            const gy = slot.gridY ?? 0;
            const gw = slot.gridW ?? Math.round(GRID_COLS / Math.ceil(Math.sqrt(count)));
            const gh = slot.gridH ?? Math.round(GRID_ROWS / Math.ceil(count / Math.ceil(Math.sqrt(count))));

            const isDragging = draggingIdx === i;
            const isResizing = resizingInfo?.idx === i;
            const isDropTarget = dropTargetIdx === i;
            const canAcceptDrop = isBlankSlot(slot);

            return (
              <div
                key={slot.id || i}
                onDoubleClick={() => onOpenEditModal(slot)}
                onDragEnter={(event) => {
                  if (!canAcceptDrop) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setDropTargetIdx(i);
                }}
                onDragOver={(event) => {
                  if (!canAcceptDrop) return;
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "copy";
                  setDropTargetIdx(i);
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget === event.target) setDropTargetIdx(null);
                }}
                onDrop={(event) => handleDropOnCanvas(event, i)}
                style={{
                  position: "absolute",
                  left: `${(gx / GRID_COLS) * 100}%`,
                  top: `${(gy / GRID_ROWS) * 100}%`,
                  width: `${(gw / GRID_COLS) * 100}%`,
                  height: `${(gh / GRID_ROWS) * 100}%`,
                  padding: "3px",
                  zIndex: isDragging ? 50 : isResizing ? 40 : 10,
                }}
              >
                <div
                  className={`relative w-full h-full flex flex-col rounded-xl border-2 transition-shadow shadow-md overflow-hidden bg-zinc-900 ${
                    isDragging
                      ? "border-blue-400 ring-2 ring-blue-500/40 shadow-xl"
                      : isResizing
                      ? "border-yellow-400 ring-2 ring-yellow-500/30"
                      : isDropTarget
                      ? "border-blue-400 ring-2 ring-blue-500/50 shadow-xl"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {/* Window Header — drag handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, i)}
                    className="relative z-30 flex items-center justify-between bg-zinc-800/90 px-2 py-1 border-b border-zinc-700 cursor-grab active:cursor-grabbing select-none shrink-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Move className="w-3 h-3" />
                      <span className="text-[10px] font-bold truncate max-w-[80px]">
                        {slot.name || "Window"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(i);
                      }}
                      className="text-zinc-500 hover:text-red-400 text-[10px] font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Window Content */}
                  <div className="p-2 flex flex-col gap-1 bg-zinc-900/90 flex-1 overflow-hidden">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      {slot.name || "Window"}
                    </span>
                    {canAcceptDrop ? (
                      <span className={`flex flex-1 items-center justify-center rounded border border-dashed px-2 text-center text-[10px] font-semibold transition-colors ${
                        isDropTarget ? "border-blue-400 bg-blue-500/10 text-blue-200" : "border-zinc-700 text-zinc-500"
                      }`}>
                        {isDropTarget ? t("dropHere") : t("dropEmptySlot")}
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 overflow-y-auto pr-0.5 no-scrollbar">
                        {slotUrls(slot).map((url, urlIndex) => (
                          <span key={`${url}-${urlIndex}`} title={url} className="text-[10px] text-zinc-400 truncate font-mono bg-zinc-950/70 px-1.5 py-0.5 rounded border border-zinc-800">
                            tab {urlIndex + 1}: {url}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4-Edge Resize Handles */}
                  {/* Right */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "right")}
                    className="absolute top-1 right-0 bottom-1 w-2 cursor-col-resize hover:bg-blue-500/40 transition-colors z-40 rounded-r"
                  />
                  {/* Left */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "left")}
                    className="absolute top-1 left-0 bottom-1 w-2 cursor-col-resize hover:bg-blue-500/40 transition-colors z-40 rounded-l"
                  />
                  {/* Bottom */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "bottom")}
                    className="absolute bottom-0 left-1 right-1 h-2 cursor-row-resize hover:bg-blue-500/40 transition-colors z-40 rounded-b"
                  />
                  {/* Top */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "top")}
                    className="absolute top-0 left-1 right-1 h-2 cursor-row-resize hover:bg-blue-500/40 transition-colors z-40 rounded-t"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
