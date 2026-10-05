import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { computeDynamicLayout } from "@/lib/layout-model";
import { applyLayoutFamily, LAYOUT_FAMILIES, placeDroppedSlot, slotsWithCount } from "@/lib/canvas-layout";
import { getTranslation } from "@/lib/i18n";
import { Plus, Minus, ChevronDown, Edit2, Trash2, Check, Play, Move, RotateCcw, Grid, Undo2, Redo2, Columns2, Rows2 } from "lucide-react";

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
  layoutFamily = "auto",
  onLayoutFamilyChange,
  showGuide = false,
}) {
  const t = (key, values) => getTranslation(lang, key, values);
  const canvasRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingPresetIdx, setEditingPresetIdx] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [resizingInfo, setResizingInfo] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });

  const count = canvasSlots.length;
  const currentPresetName = presets[activePreset]?.name || "A";

  const snapshot = (slots) => slots.map((slot) => ({ ...slot }));
  const saveHistory = (before) => {
    setHistory(({ past }) => ({ past: [...past, snapshot(before)].slice(-40), future: [] }));
  };

  const commitSlots = (nextSlots, before = canvasSlots) => {
    saveHistory(before);
    setCanvasSlots(nextSlots);
  };

  const handleUndo = () => {
    if (!history.past.length) return;
    const previous = history.past[history.past.length - 1];
    setHistory(({ past, future }) => ({ past: past.slice(0, -1), future: [snapshot(canvasSlots), ...future].slice(0, 40) }));
    setCanvasSlots(snapshot(previous));
  };

  const handleRedo = () => {
    if (!history.future.length) return;
    const next = history.future[0];
    setHistory(({ past, future }) => ({ past: [...past, snapshot(canvasSlots)].slice(-40), future: future.slice(1) }));
    setCanvasSlots(snapshot(next));
  };

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
    if (!hasPositions && canvasSlots.length > 0 && layoutFamily !== "custom") {
      setCanvasSlots(ensureGridPositions(canvasSlots));
    }
  }, [canvasSlots.length, layoutFamily]);

  const handleCountChange = (val) => {
    const targetCount = Math.max(0, Math.min(16, val));
    const family = layoutFamily === "custom" ? "custom" : layoutFamily;
    commitSlots(slotsWithCount(canvasSlots, targetCount, family));
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
    onLayoutFamilyChange?.("auto");
    commitSlots(applyLayoutFamily([...canvasSlots], "auto"));
  };

  const handleRemoveSlot = (index) => {
    const nextSlots = [...canvasSlots];
    nextSlots.splice(index, 1);
    commitSlots(layoutFamily === "custom" ? nextSlots : applyLayoutFamily(nextSlots, layoutFamily));
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
          commitSlots(placeDroppedSlot(canvasSlots, index, newItem, layoutFamily));
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
    const before = snapshot(canvasSlots);
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
      saveHistory(before);
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
    const before = snapshot(canvasSlots);
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
      saveHistory(before);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex flex-col gap-3 flex-1 w-full max-w-full overflow-hidden">
      {/* Workspace Toolbar */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl p-3" style={{
        border: '1px solid var(--cie-stroke)',
        background: 'var(--cie-btn)',
        borderRadius: 'var(--cie-r)'
      }}>
        {/* Browser Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--cie-ink)', fontFamily: 'var(--cie-sans)' }}>{t("howManyBrowsers")}</span>
          <div className="flex items-center rounded-md" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--card)'
          }}>
            <button
              type="button"
              onClick={() => handleCountChange(count - 1)}
              aria-label={t("decreaseCount")}
              className="flex h-8 w-8 items-center justify-center focus-visible:outline-none"
              style={{
                color: 'var(--cie-ink)',
                cursor: 'pointer',
                transition: `color var(--cie-t-snap) var(--cie-ease-expo)`
              }}
            >
              <Minus style={{ width: '14px', height: '14px' }} />
            </button>
            <input
              type="number"
              min="0"
              max="16"
              value={count}
              aria-label={t("howManyBrowsers")}
              onChange={(e) => {
                const nextCount = Number(e.target.value);
                handleCountChange(Number.isFinite(nextCount) ? nextCount : 0);
              }}
              className="w-9 h-7 text-center text-xs font-bold text-white bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => handleCountChange(count + 1)}
              aria-label={t("increaseCount")}
              className="flex h-8 w-8 items-center justify-center focus-visible:outline-none"
              style={{
                color: 'var(--cie-ink)',
                cursor: 'pointer',
                transition: `color var(--cie-t-snap) var(--cie-ease-expo)`
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          {showGuide && <span className="hidden items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold sm:inline-flex" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn-hover)',
            color: 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)',
            borderRadius: 'calc(var(--cie-r) / 2)'
          }}><span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]" style={{
            background: 'var(--cie-ink)',
            color: 'var(--cie-paper)'
          }}>2</span>{t("guideStep2Description")}</span>}
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-1.5 pt-2 lg:order-2 lg:w-auto lg:pt-0" style={{
          borderTop: '1px solid var(--cie-stroke)'
        }}>
          {LAYOUT_FAMILIES.filter(({ id }) => id !== "custom").map(({ id }) => {
            const active = layoutFamily === id;
            const Icon = id === "stack" ? Rows2 : id === "row" ? Columns2 : Grid;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onLayoutFamilyChange?.(id);
                  commitSlots(applyLayoutFamily(canvasSlots, id));
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-all focus-visible:outline-none"
                style={{
                  border: active ? '2px solid var(--cie-ink)' : '1px solid var(--cie-stroke)',
                  background: active ? 'var(--cie-ink)' : 'var(--cie-btn)',
                  color: active ? 'var(--cie-paper)' : 'var(--cie-ink)',
                  fontFamily: 'var(--cie-sans)',
                  borderRadius: 'calc(var(--cie-r) / 2)',
                  cursor: 'pointer',
                  transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
                }}
              >
                <Icon style={{ width: '12px', height: '12px' }} />{id === "auto" ? t("layoutAuto") : id === "stack" ? t("layoutStack") : id === "row" ? t("layoutRow") : id === "grid" ? t("layoutGrid") : t("layoutFocus")}
              </button>
            );
          })}
          <button type="button" aria-pressed={layoutFamily === "custom"} onClick={() => onLayoutFamilyChange?.("custom")} className="inline-flex h-8 items-center rounded-md px-2 text-[11px] font-semibold focus-visible:outline-none" style={{
            border: layoutFamily === "custom" ? '2px solid var(--cie-ink)' : '1px solid var(--cie-stroke)',
            background: layoutFamily === "custom" ? 'var(--cie-ink)' : 'var(--cie-btn)',
            color: layoutFamily === "custom" ? 'var(--cie-paper)' : 'var(--cie-ink)',
            fontFamily: 'var(--cie-sans)',
            borderRadius: 'calc(var(--cie-r) / 2)',
            cursor: 'pointer',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
          }}>{t("layoutFreeform")}</button>
          <span className="mx-1 h-5" style={{ borderLeft: '1px solid var(--cie-stroke)' }} />
          <button type="button" onClick={handleUndo} disabled={!history.past.length} aria-label={t("undo")} className="inline-flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-35" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn)',
            color: 'var(--cie-ink)',
            borderRadius: 'calc(var(--cie-r) / 2)',
            cursor: !history.past.length ? 'not-allowed' : 'pointer'
          }}><Undo2 style={{ width: '14px', height: '14px' }} /></button>
          <button type="button" onClick={handleRedo} disabled={!history.future.length} aria-label={t("redo")} className="inline-flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-35" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn)',
            color: 'var(--cie-ink)',
            borderRadius: 'calc(var(--cie-r) / 2)',
            cursor: !history.future.length ? 'not-allowed' : 'pointer'
          }}><Redo2 style={{ width: '14px', height: '14px' }} /></button>
        </div>

        {/* Layout Preset Dropdown + Equalize + Clear + Retile + Launch */}
        <div className="flex items-center gap-2">
          <div
            className="relative"
            onKeyDown={(e) => {
              if (e.key === "Escape" && dropdownOpen && editingPresetIdx === null) {
                e.stopPropagation();
                setDropdownOpen(false);
              }
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="h-9 gap-2 text-xs font-semibold"
              style={{
                border: '1px solid var(--cie-stroke)',
                background: 'var(--cie-btn)',
                color: 'var(--cie-ink)',
                fontFamily: 'var(--cie-sans)',
                borderRadius: 'calc(var(--cie-r) / 2)'
              }}
            >
              <span>📁 {t("standardLayout")} <b>{currentPresetName}</b></span>
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--cie-ink-mute)' }} />
            </Button>

            {dropdownOpen && (
              <div role="menu" className="absolute left-0 top-full z-50 mt-1 flex w-64 flex-col gap-1 rounded-xl p-2 shadow-2xl" style={{
                border: '1px solid var(--cie-stroke)',
                background: 'var(--card)',
                borderRadius: 'var(--cie-r)'
              }}>
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1 no-scrollbar">
                  {presets.map((preset, idx) => {
                    const isActive = idx === activePreset;
                    const isEditing = editingPresetIdx === idx;
                    return (
                      <div
                        key={idx}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors"
                        style={{
                          background: isActive ? 'var(--cie-ink)' : 'transparent',
                          border: isActive ? '1px solid var(--cie-ink)' : '1px solid transparent',
                          color: isActive ? 'var(--cie-paper)' : 'var(--cie-ink)',
                          fontWeight: isActive ? 'bold' : 'normal',
                          fontFamily: 'var(--cie-sans)',
                          borderRadius: 'calc(var(--cie-r) / 2)'
                        }}
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
                            className="px-1.5 py-0.5 rounded text-xs w-28"
                            style={{
                              background: 'var(--cie-btn)',
                              border: '1px solid var(--cie-stroke)',
                              color: 'var(--cie-ink)',
                              borderRadius: 'calc(var(--cie-r) / 3)'
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              onSelectPreset(idx);
                              setDropdownOpen(false);
                            }}
                            className="max-w-[150px] truncate text-left focus-visible:outline-none"
                          >
                            📁 {t("standardLayout")} {preset.name || String.fromCharCode(65 + idx)}
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPresetIdx(idx);
                              setEditingName(preset.name || "");
                            }}
                            aria-label={t("editItem", { name: preset.name || String.fromCharCode(65 + idx) })}
                            title={t("editItem", { name: preset.name || String.fromCharCode(65 + idx) })}
                            className="rounded p-1 focus-visible:outline-none"
                            style={{ color: isActive ? 'var(--cie-paper)' : 'var(--cie-ink-mute)' }}
                          >
                            <Edit2 style={{ width: '12px', height: '12px' }} />
                          </button>
                          {presets.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePreset(idx);
                              }}
                            aria-label={t("deleteItem", { name: preset.name || String.fromCharCode(65 + idx) })}
                            title={t("deleteItem", { name: preset.name || String.fromCharCode(65 + idx) })}
                            className="rounded p-1 focus-visible:outline-none"
                            style={{ color: isActive ? 'var(--cie-paper)' : 'var(--cie-ink-mute)' }}
                            >
                              <Trash2 style={{ width: '12px', height: '12px' }} />
                            </button>
                          )}
                          {isActive && <Check style={{ width: '14px', height: '14px', marginLeft: '4px' }} />}
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
                  className="w-full mt-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-colors"
                  style={{
                    border: '1px dashed var(--cie-stroke)',
                    color: 'var(--cie-ink)',
                    fontFamily: 'var(--cie-sans)',
                    borderRadius: 'calc(var(--cie-r) / 2)',
                    cursor: 'pointer'
                  }}
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
            className="h-9 gap-1.5 border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            <RotateCcw className="w-3 h-3" />
            {t("equalizeBtn")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => commitSlots([])}
            className="h-9 border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            {t("clearCanvas")}
          </Button>

          {/* Re-tile Open Windows button directly to the left of Launch */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRetile}
            title={t("retileTitle")}
            className="h-9 gap-1.5 text-xs font-semibold"
            style={{
              border: '2px solid var(--cie-ink)',
              background: 'var(--cie-ink)',
              color: 'var(--cie-paper)',
              fontFamily: 'var(--cie-sans)',
              cursor: 'pointer',
              borderRadius: 'calc(var(--cie-r) / 2)'
            }}
          >
            <Grid style={{ width: '14px', height: '14px' }} />
            <span>{t("retile")}</span>
          </Button>

          <Button
            variant="hero"
            size="sm"
            onClick={onLaunch}
            className="h-9 gap-1.5 text-xs font-semibold"
            style={{
              border: '2px solid var(--cie-ink)',
              background: 'var(--cie-ink)',
              color: 'var(--cie-paper)',
              fontFamily: 'var(--cie-sans)',
              cursor: 'pointer',
              borderRadius: 'calc(var(--cie-r) / 2)'
            }}
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
        onDrop={(e) => handleDropOnCanvas(e)}
        aria-label={t("canvasLabel")}
        className="relative min-h-[380px] w-full max-h-[620px] overflow-hidden rounded-xl shadow-inner transition-all"
        style={{
          aspectRatio: targetAspectRatio || "16/9",
          border: '2px solid var(--cie-stroke)',
          background: 'var(--card)',
          borderRadius: 'var(--cie-r)'
        }}
      >
        {showGuide && <p className="absolute left-3 top-3 z-20 max-w-[min(420px,calc(100%-1.5rem))] rounded-md px-3 py-2 text-xs font-semibold leading-5 shadow-lg" style={{
          border: '1px solid var(--cie-stroke)',
          background: 'var(--cie-ink)',
          color: 'var(--cie-paper)',
          fontFamily: 'var(--cie-sans)',
          borderRadius: 'calc(var(--cie-r) / 2)'
        }}>{t("guideCanvasHint")}</p>}
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
                  event.preventDefault();
                  event.stopPropagation();
                  setDropTargetIdx(i);
                }}
                onDragOver={(event) => {
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
                  className="relative w-full h-full flex flex-col rounded-xl border-2 transition-shadow shadow-md overflow-hidden"
                  style={{
                    background: 'var(--cie-btn)',
                    borderColor: (isDragging || isResizing || isDropTarget) ? 'var(--cie-ink)' : 'var(--cie-stroke)',
                    borderWidth: (isDragging || isResizing || isDropTarget) ? '3px' : '2px',
                    borderRadius: 'var(--cie-r)'
                  }}
                >
                  {/* Window Header — drag handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, i)}
                    className="relative z-30 flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing select-none shrink-0"
                    style={{
                      background: 'var(--cie-btn)',
                      borderBottom: '1px solid var(--cie-stroke)'
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--cie-ink)', opacity: 0.3 }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--cie-ink)', opacity: 0.3 }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--cie-ink)', opacity: 0.3 }} />
                    </div>
                    <div className="flex items-center gap-1" style={{ color: 'var(--cie-ink-mute)' }}>
                      <Move style={{ width: '12px', height: '12px' }} />
                      <span className="max-w-[100px] truncate text-[11px] font-semibold" style={{ fontFamily: 'var(--cie-sans)' }}>
                        {slot.name || t("untitledWindow")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(i);
                      }}
                      aria-label={t("removeFromCanvas", { name: slot.name || t("untitledWindow") })}
                      title={t("removeFromCanvas", { name: slot.name || t("untitledWindow") })}
                      className="cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 p-1 text-[11px] font-semibold text-zinc-400 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Window Content */}
                  <div className="p-2 flex flex-col gap-1 flex-1 overflow-hidden" style={{ background: 'var(--card)' }}>
                    <span className="truncate text-xs font-semibold" style={{ color: 'var(--card-foreground)', fontFamily: 'var(--cie-sans)' }}>
                      {slot.name || t("untitledWindow")}
                    </span>
                    {canAcceptDrop ? (
                      <span className="flex flex-1 items-center justify-center rounded px-2 text-center text-[11px] font-semibold transition-colors" style={{
                        border: isDropTarget ? '2px solid var(--cie-ink)' : '1px dashed var(--cie-stroke)',
                        background: isDropTarget ? 'var(--cie-btn-hover)' : 'transparent',
                        color: 'var(--card-foreground)',
                        fontFamily: 'var(--cie-sans)'
                      }}>
                        {isDropTarget ? t("dropHere") : t("dropEmptySlot")}
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 overflow-y-auto pr-0.5 no-scrollbar">
                        {slotUrls(slot).map((url, urlIndex) => (
                          <span key={`${url}-${urlIndex}`} title={url} className="truncate rounded px-1.5 py-1 text-[11px] leading-4" style={{
                            border: '1px solid var(--cie-stroke)',
                            background: 'var(--cie-btn)',
                            color: 'var(--cie-ink-mute)',
                            fontFamily: 'var(--cie-mono)',
                            borderRadius: 'calc(var(--cie-r) / 3)'
                          }}>
                            {t("tabLabel", { n: urlIndex + 1 })}: {url}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4-Edge Resize Handles */}
                  {/* Right */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "right")}
                    className="absolute top-1 right-0 bottom-1 w-2 cursor-col-resize transition-opacity z-40 rounded-r"
                    style={{ background: 'var(--cie-stroke)', opacity: 0.3 }}
                  />
                  {/* Left */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "left")}
                    className="absolute top-1 left-0 bottom-1 w-2 cursor-col-resize transition-opacity z-40 rounded-l"
                    style={{ background: 'var(--cie-stroke)', opacity: 0.3 }}
                  />
                  {/* Bottom */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "bottom")}
                    className="absolute bottom-0 left-1 right-1 h-2 cursor-row-resize transition-opacity z-40 rounded-b"
                    style={{ background: 'var(--cie-stroke)', opacity: 0.3 }}
                  />
                  {/* Top */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i, "top")}
                    className="absolute top-0 left-1 right-1 h-2 cursor-row-resize transition-opacity z-40 rounded-t"
                    style={{ background: 'var(--cie-stroke)', opacity: 0.3 }}
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
