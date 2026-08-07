import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CommandBar } from "@/components/CommandBar";
import { DisplaySelector } from "@/components/DisplaySelector";
import { WindowsSidebar } from "@/components/WindowsSidebar";
import { WorkspaceCanvas } from "@/components/WorkspaceCanvas";
import { RegisterModal } from "@/components/RegisterModal";
import { WindowsTab } from "@/components/WindowsTab";
import { ConfigProfileManager } from "@/components/ConfigProfileManager";
import { DangerZone } from "@/components/DangerZone";
import { SpotlightConfig } from "@/components/SpotlightConfig";
import { useExtensionState } from "@/hooks/useExtensionState";
import { useRegisteredWindows } from "@/hooks/useRegisteredWindows";
import { computeDynamicLayout } from "@/lib/layout-model";
import { getTranslation } from "@/lib/i18n";

export function App() {
  const { state, updateState, defaultState } = useExtensionState();
  const { windows, addWindow, updateWindow, deleteWindow, setWindows } = useRegisteredWindows();

  const [activeTab, setActiveTab] = useState("arrange"); // "arrange" | "windows" | "profiles"

  // Load canvasSlots from the active preset's saved slots
  const activePresetObj = state.presets?.[state.activePreset || 0];
  const [canvasSlots, setCanvasSlotsRaw] = useState(
    activePresetObj?.slots?.length ? activePresetObj.slots : [
      { id: "slot-1", name: "Research", urls: "https://example.com/docs" },
      { id: "slot-2", name: "Chat AI", urls: "https://claude.ai" },
    ]
  );

  // Auto-save canvasSlots to the active preset whenever they change
  const setCanvasSlots = (newSlots) => {
    const resolved = typeof newSlots === "function" ? newSlots(canvasSlots) : newSlots;
    setCanvasSlotsRaw(resolved);
    // Persist to the current preset
    const presetIdx = state.activePreset || 0;
    const nextPresets = [...(state.presets || [])];
    if (nextPresets[presetIdx]) {
      nextPresets[presetIdx] = { ...nextPresets[presetIdx], slots: resolved };
      updateState({ presets: nextPresets });
    }
  };

  const [displays, setDisplays] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const lang = state.language || "ja";
  const t = (key) => getTranslation(lang, key);

  const isPageMode = typeof window !== "undefined" && window.location.search.includes("mode=page");
  const isDockMode = typeof window !== "undefined" && window.location.search.includes("mode=dock");

  // Dynamically set document body class for container scaling
  useEffect(() => {
    if (isPageMode) {
      document.body.className = "mode-page bg-zinc-950 text-zinc-100 font-sans antialiased";
    } else if (isDockMode) {
      document.body.className = "mode-dock bg-zinc-950 text-zinc-100 font-sans antialiased";
    } else {
      document.body.className = "mode-popup bg-zinc-950 text-zinc-100 font-sans antialiased";
    }
  }, [isPageMode, isDockMode]);

  // Fetch displays for physical monitor aspect ratio
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "displays" }, (res) => {
        if (res?.ok && Array.isArray(res.displays)) {
          setDisplays(res.displays);
        }
      });
    }
  }, []);

  const activeDisplay = displays.find((d) => state.targetDisplays?.includes(d.id)) || displays.find((d) => d.isFocused) || displays[0];
  const targetAspectRatio = activeDisplay?.bounds ? `${activeDisplay.bounds.width}/${activeDisplay.bounds.height}` : "16/9";

  const showNote = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCommandAction = async (actionType) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      if (actionType === "launch") {
        if (!canvasSlots.length) {
          showNote(t("noWindows"));
          return;
        }
        const cells = canvasSlots.map((slot, idx) => ({
          x: slot.gridX ?? (idx % 2) * 6,
          y: slot.gridY ?? Math.floor(idx / 2) * 6,
          w: slot.gridW ?? 6,
          h: slot.gridH ?? 6,
        }));
        chrome.runtime.sendMessage(
          {
            type: "launch",
            preset: {
              columns: 12,
              rows: 12,
              cells: cells,
              slots: canvasSlots,
            },
            targetDisplay: state.targetDisplay,
            targetDisplays: state.targetDisplays,
            sameDisplayOnly: state.sameDisplayOnly,
            openEmpty: true,
          },
          (res) => {
            if (res?.ok) showNote(t("launchedMsg"));
          }
        );
      } else if (actionType === "retile") {
        if (!canvasSlots.length) {
          showNote(t("noWindows"));
          return;
        }
        const cells = canvasSlots.map((slot, idx) => ({
          x: slot.gridX ?? (idx % 2) * 6,
          y: slot.gridY ?? Math.floor(idx / 2) * 6,
          w: slot.gridW ?? 6,
          h: slot.gridH ?? 6,
        }));
        chrome.runtime.sendMessage(
          {
            type: "tile",
            preset: {
              columns: 12,
              rows: 12,
              cells: cells,
            },
            targetDisplay: state.targetDisplay,
            targetDisplays: state.targetDisplays,
            sameDisplayOnly: state.sameDisplayOnly,
            deckOnly: true,
          },
          (res) => {
            showNote(res?.ok ? t("actionExecutedMsg") : t("deckWindowsMissing"));
          }
        );
      } else {
        chrome.runtime.sendMessage({ type: actionType }, (res) => {
          if (res?.ok) showNote(t("actionExecutedMsg"));
        });
      }
    }
  };

  const handleToggleDisplay = (displayId) => {
    const current = [...(state.targetDisplays || [])];
    const idx = current.indexOf(displayId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(displayId);
    }
    updateState({ targetDisplays: current });
  };

  // Preset Handlers
  const handleSelectPreset = (idx) => {
    // Load the new preset's saved slots
    const newPreset = state.presets?.[idx];
    const newSlots = newPreset?.slots?.length ? newPreset.slots : [];
    setCanvasSlotsRaw(newSlots);
    updateState({ activePreset: idx });
    showNote(t("presetSwitchedMsg"));
  };

  const handleRenamePreset = (idx, newName) => {
    const nextPresets = [...state.presets];
    if (nextPresets[idx]) {
      nextPresets[idx].name = newName;
      updateState({ presets: nextPresets });
      showNote(t("presetRenamedMsg"));
    }
  };

  const handleDeletePreset = (idx) => {
    if (state.presets.length <= 1) return;
    const nextPresets = state.presets.filter((_, i) => i !== idx);
    const nextActive = Math.max(0, state.activePreset - 1);
    updateState({ presets: nextPresets, activePreset: nextActive });
    showNote(t("presetDeletedMsg"));
  };

  const handleCreatePreset = () => {
    const newName = String.fromCharCode(65 + state.presets.length);
    const newPreset = { name: newName, columns: 2, rows: 2, slots: [] };
    const nextPresets = [...state.presets, newPreset];
    updateState({ presets: nextPresets, activePreset: nextPresets.length - 1 });
    setCanvasSlotsRaw([]);
    showNote(t("presetCreatedMsg"));
  };

  // Profile Handlers
  const handleSelectProfile = (profileId) => {
    updateState({ activeProfileId: profileId });
    showNote(t("presetSwitchedMsg"));
  };

  const handleCreateProfile = (name) => {
    const newProf = {
      id: `profile-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    const nextProfiles = [...(state.profiles || []), newProf];
    updateState({ profiles: nextProfiles, activeProfileId: newProf.id });
    showNote(t("presetCreatedMsg"));
  };

  const handleDeleteProfile = (profileId) => {
    if ((state.profiles || []).length <= 1) return;
    const nextProfiles = state.profiles.filter((p) => p.id !== profileId);
    const nextActive = nextProfiles[0]?.id || "profile-default";
    updateState({ profiles: nextProfiles, activeProfileId: nextActive });
    showNote(t("presetDeletedMsg"));
  };

  // Full Backup Export / Import (.json)
  const handleExportBackup = () => {
    const backupData = {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      state,
      registeredWindows: windows,
      canvasSlots,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-window-deck-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNote(t("backupSuccessMsg"));
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result || "{}");
          if (parsed.state) updateState(parsed.state);
          if (Array.isArray(parsed.registeredWindows)) setWindows(parsed.registeredWindows);
          if (Array.isArray(parsed.canvasSlots)) setCanvasSlots(parsed.canvasSlots);
          showNote(t("restoreSuccessMsg"));
        } catch {
          showNote("JSONファイルの読み込みに失敗しました");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveWindow = ({ id, name, urls }) => {
    if (id) {
      updateWindow(id, { name, urls });
    } else {
      addWindow({ name, urls, color: "auto" });
      setCanvasSlots((prev) => [...prev, { id: `slot-${Date.now()}`, name, urls }]);
    }
  };

  const handleBulkSave = (text) => {
    const lines = text.split("\n");
    let currentName = "";
    let currentUrls = [];
    const newItems = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentName || currentUrls.length) {
          newItems.push({
            id: `win-bulk-${Date.now()}-${newItems.length}`,
            name: currentName || `Window ${newItems.length + 1}`,
            urls: currentUrls.join("\n"),
          });
          currentName = "";
          currentUrls = [];
        }
      } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        currentUrls.push(trimmed);
      } else {
        currentName = trimmed;
      }
    });

    if (currentName || currentUrls.length) {
      newItems.push({
        id: `win-bulk-${Date.now()}-${newItems.length}`,
        name: currentName || `Window ${newItems.length + 1}`,
        urls: currentUrls.join("\n"),
      });
    }

    if (newItems.length) {
      setWindows([...windows, ...newItems]);
      setCanvasSlots((prev) => [...prev, ...newItems]);
    }
  };

  const handleExportFile = () => {
    const lines = [];
    windows.forEach((item, idx) => {
      if (idx > 0) lines.push("");
      lines.push(item.name || `Window ${idx + 1}`);
      if (item.urls) lines.push(item.urls);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-window-deck-windows.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        handleBulkSave(evt.target?.result || "");
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Complete Factory Reset
  const handleFactoryReset = async () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.sync.clear();
      await chrome.storage.session.clear();
    }

    const defaultWindows = [
      { id: "win-1", name: "Research", urls: "https://example.com/docs", color: "auto" },
      { id: "win-2", name: "Chat AI", urls: "https://claude.ai", color: "auto" },
    ];

    updateState(defaultState);
    setWindows(defaultWindows);
    setCanvasSlots(defaultWindows);
    showNote(t("resetDoneMsg"));
  };

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 p-5 selection:bg-blue-600/30 ${isPageMode ? "w-full" : ""}`}>
      <div className={`${isPageMode ? "max-w-[1600px] w-full" : "max-w-6xl"} mx-auto flex flex-col min-h-full`}>
        {/* Header */}
        <Header
          lang={lang}
          onLanguageChange={(newLang) => updateState({ language: newLang })}
          onOpenBig={() => {
            if (typeof chrome !== "undefined" && chrome.runtime) {
              chrome.runtime.sendMessage({ type: "bigSettings" });
            }
          }}
          onOpenDock={() => {
            if (typeof chrome !== "undefined" && chrome.runtime) {
              chrome.runtime.sendMessage({ type: "dock" });
            }
          }}
        />

        {/* Command Bar */}
        <CommandBar lang={lang} onAction={handleCommandAction} />

        {/* Spotlight Configuration (Enlarge Size & Anchor Settings) */}
        <SpotlightConfig
          lang={lang}
          state={state}
          updateState={updateState}
          onAction={handleCommandAction}
          targetAspectRatio={targetAspectRatio}
          canvasSlots={canvasSlots}
        />

        {/* Multi-Monitor Display Cards */}
        <DisplaySelector
          lang={lang}
          targetDisplays={state.targetDisplays || []}
          onToggleDisplay={handleToggleDisplay}
        />

        {/* Notification Banner */}
        {notification && (
          <div className="mb-4 p-3 rounded-xl bg-blue-600/25 border border-blue-500/50 text-blue-200 text-xs font-bold text-center animate-in fade-in shadow-lg">
            {notification}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 mb-4">
          <button
            onClick={() => setActiveTab("arrange")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "arrange"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t("arrangeTab")}
          </button>
          <button
            onClick={() => setActiveTab("windows")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "windows"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t("windowsTab")}
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "profiles"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t("profilesTab")}
          </button>
        </div>

        {/* Main View Panels */}
        {activeTab === "arrange" ? (
          <div className="flex flex-wrap md:flex-nowrap gap-4 flex-1">
            {/* Left Windows Library Sidebar */}
            <WindowsSidebar
              lang={lang}
              windows={windows}
              canvasSlots={canvasSlots}
              onOpenAddModal={handleOpenAddModal}
              onEditWindow={handleOpenEditModal}
              onDeleteWindow={deleteWindow}
            />

            {/* Right Workspace Canvas */}
            <WorkspaceCanvas
              lang={lang}
              targetAspectRatio={targetAspectRatio}
              canvasSlots={canvasSlots}
              setCanvasSlots={setCanvasSlots}
              presets={state.presets || []}
              activePreset={state.activePreset || 0}
              onSelectPreset={handleSelectPreset}
              onRenamePreset={handleRenamePreset}
              onDeletePreset={handleDeletePreset}
              onCreatePreset={handleCreatePreset}
              onLaunch={() => handleCommandAction("launch")}
              onRetile={() => handleCommandAction("retile")}
              onNotice={showNote}
              onOpenEditModal={handleOpenEditModal}
            />
          </div>
        ) : activeTab === "windows" ? (
          <div className="flex flex-col gap-5 flex-1">
            <WindowsTab
              lang={lang}
              windows={windows}
              onOpenAddModal={handleOpenAddModal}
              onEditWindow={handleOpenEditModal}
              onDeleteWindow={deleteWindow}
            />
            <DangerZone lang={lang} onFactoryReset={handleFactoryReset} />
          </div>
        ) : (
          <div className="flex flex-col gap-5 flex-1">
            <ConfigProfileManager
              lang={lang}
              profiles={state.profiles || []}
              activeProfileId={state.activeProfileId}
              onSelectProfile={handleSelectProfile}
              onCreateProfile={handleCreateProfile}
              onDeleteProfile={handleDeleteProfile}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <RegisterModal
        lang={lang}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onSaveWindow={handleSaveWindow}
        onBulkSave={handleBulkSave}
        onExportFile={handleExportFile}
        onImportFile={handleImportFile}
      />
    </div>
  );
}
