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
import { BulkPlacementChoice } from "@/components/BulkPlacementChoice";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { useExtensionState } from "@/hooks/useExtensionState";
import { useRegisteredWindows } from "@/hooks/useRegisteredWindows";
import { useTheme } from "@/contexts/ThemeContext";
import { computeDynamicLayout } from "@/lib/layout-model";
import { getTranslation, browserLanguage } from "@/lib/i18n";
import { applyCanvasWindowEdit, resolveRegisteredWindowId } from "@/lib/window-sync";
import { appendSlot } from "@/lib/canvas-layout";

// Shown on a fresh install so the canvas is not blank.
const SAMPLE_SLOTS = [
  { id: "slot-1", name: "Research", urls: "https://example.com/docs" },
  { id: "slot-2", name: "Chat AI", urls: "https://claude.ai" },
];

export function App() {
  const { state, updateState, loading, defaultState } = useExtensionState();
  const { windows, addWindow, updateWindow, deleteWindow, setWindows } = useRegisteredWindows();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState("arrange"); // "arrange" | "windows" | "profiles"

  // canvasSlots stays null until saved settings have loaded; see the loading
  // effect below. Rendering earlier let the canvas persist the sample slots
  // over the user's saved layouts.
  const activePresetObj = state.presets?.[state.activePreset || 0];
  const [canvasSlots, setCanvasSlotsRaw] = useState(null);

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
  const [editingSource, setEditingSource] = useState(null);
  const [notification, setNotification] = useState(null);
  const [bulkItems, setBulkItems] = useState([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Until the user picks a language, follow the browser UI language.
  const lang = state.language || browserLanguage();
  const t = (key, values) => getTranslation(lang, key, values);

  // The options page opens dist/index.html in a full tab: give it the page
  // layout instead of the fixed 780px popup width.
  const isOptionsTab = typeof chrome !== "undefined"
    && typeof chrome.extension?.getViews === "function"
    && !chrome.extension.getViews({ type: "popup" }).includes(window);
  const isPageMode = typeof window !== "undefined" && (window.location.search.includes("mode=page")
    || (isOptionsTab && !window.location.search.includes("mode=dock")));
  const isDockMode = typeof window !== "undefined" && window.location.search.includes("mode=dock");

  // Dynamically set document body class for container scaling
  useEffect(() => {
    const bgColor = theme === 'dark' ? 'var(--cie-paper)' : 'var(--cie-ink)';
    const textColor = theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)';
    
    if (isPageMode) {
      document.body.className = "mode-page font-sans antialiased";
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = textColor;
    } else if (isDockMode) {
      document.body.className = "mode-dock font-sans antialiased";
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = textColor;
    } else {
      document.body.className = "mode-popup font-sans antialiased";
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = textColor;
    }
  }, [isPageMode, isDockMode, theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t("docTitle");
  }, [lang]);

  // Saved settings arrive asynchronously. Only once they are in do we know
  // whether this is a first run, and which canvas the active layout holds.
  useEffect(() => {
    if (loading) return;
    setOnboardingOpen(!state.onboardingSeen);
    const saved = state.presets?.[state.activePreset || 0]?.slots;
    setCanvasSlotsRaw(Array.isArray(saved) && saved.length ? saved : SAMPLE_SLOTS);
  }, [loading]);

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

  // Report a failed background action instead of failing silently.
  const failed = (res) => !res?.ok || Boolean(chrome.runtime.lastError);
  const outcomeNote = (res, okKey) => {
    if (!failed(res)) return t(okKey);
    return res?.reason ? t("nothingToDoMsg") : t("actionFailedMsg");
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
            showNote(outcomeNote(res, "launchedMsg"));
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
            const error = chrome.runtime.lastError;
            showNote(res?.ok ? t("actionExecutedMsg") : error ? t("actionFailedMsg") : t("deckWindowsMissing"));
          }
        );
      } else {
        chrome.runtime.sendMessage({ type: actionType }, (res) => {
          showNote(outcomeNote(res, "actionExecutedMsg"));
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
    const newPreset = { name: newName, columns: 2, rows: 2, layoutFamily: "auto", slots: [] };
    const nextPresets = [...state.presets, newPreset];
    updateState({ presets: nextPresets, activePreset: nextPresets.length - 1 });
    setCanvasSlotsRaw([]);
    showNote(t("presetCreatedMsg"));
  };

  const layoutFamily = activePresetObj?.layoutFamily || "auto";
  const handleLayoutFamilyChange = (nextFamily) => {
    const presetIdx = state.activePreset || 0;
    const nextPresets = [...(state.presets || [])];
    if (!nextPresets[presetIdx]) return;
    nextPresets[presetIdx] = { ...nextPresets[presetIdx], layoutFamily: nextFamily };
    updateState({ presets: nextPresets });
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
          showNote(t("importFailedMsg"));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setEditingSource(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item, source) => {
    setEditingItem(item);
    setEditingSource(source);
    setModalOpen(true);
  };

  const handleSaveWindow = ({ id, name, urls }) => {
    if (editingSource === "canvas") {
      const saved = applyCanvasWindowEdit({ windows, canvasSlots, editingItem, name, urls });
      if (saved.registeredWindowId) {
        setWindows(saved.windows);
        setCanvasSlots(saved.canvasSlots);
        return;
      }

      const createdWindow = addWindow({ name, urls, color: "auto" });
      setCanvasSlots((prev) => prev.map((slot) => (
        slot.id === editingItem.id
          ? { ...slot, registeredWindowId: createdWindow.id, name, urls }
          : slot
      )));
    } else if (id) {
      updateWindow(id, { name, urls });
      setCanvasSlots((prev) => prev.map((slot) => (
        resolveRegisteredWindowId(slot, windows) === id
          ? { ...slot, registeredWindowId: id, name, urls }
          : slot
      )));
    } else {
      const createdWindow = addWindow({ name, urls, color: "auto" });
      setCanvasSlots((prev) => [...prev, {
        id: `slot-${Date.now()}`,
        registeredWindowId: createdWindow.id,
        name,
        urls,
      }]);
    }
  };

  const parseBulkItems = (text) => {
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

    return newItems;
  };

  const handleBulkSave = (text) => {
    const newItems = parseBulkItems(text);
    if (newItems.length) setBulkItems(newItems);
  };

  const commitBulkItems = (placement) => {
    if (!bulkItems.length) return;
    setWindows([...windows, ...bulkItems]);
    if (placement === "auto") {
      setCanvasSlots((previous) => bulkItems.reduce((slots, item) => appendSlot(slots, item, layoutFamily), previous));
    } else {
      const newName = String.fromCharCode(65 + state.presets.length);
      const nextPreset = { name: newName, columns: 2, rows: 2, layoutFamily: "auto", slots: [] };
      updateState({ presets: [...state.presets, nextPreset], activePreset: state.presets.length });
      setCanvasSlotsRaw([]);
      setActiveTab("arrange");
    }
    setBulkItems([]);
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

  if (loading || canvasSlots === null) {
    return <div className="min-h-screen" style={{ background: 'var(--cie-paper)' }} aria-busy="true" />;
  }

  return (
    <div className={`min-h-screen p-4 sm:p-5 ${isPageMode ? "w-full" : ""}`} style={{
      backgroundColor: theme === 'dark' ? 'var(--cie-paper)' : 'var(--cie-ink)',
      color: theme === 'dark' ? 'var(--cie-ink)' : 'var(--cie-paper)',
      fontFamily: 'var(--cie-sans)'
    }}>
      <a className="skip-link" href="#workspace-main">{t("skipToMain")}</a>
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
          showGuide={onboardingOpen}
        />

        {/* Notification Banner */}
        <div aria-live="polite" aria-atomic="true">
        {notification && (
          <div className="mb-4 rounded-xl p-3 text-center text-xs font-semibold shadow-lg animate-in fade-in" style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn)',
            color: 'var(--cie-ink)'
          }}>
            {notification}
          </div>
        )}
        </div>

        {/* Navigation Tabs */}
        <nav className="mb-5 flex" style={{ borderBottom: '1px solid var(--cie-stroke)' }} aria-label={t("sectionsNavLabel")}>
          <button
            onClick={() => setActiveTab("arrange")}
            aria-current={activeTab === "arrange" ? "page" : undefined}
            className="px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              borderBottom: activeTab === "arrange" ? '2px solid var(--cie-ink)' : '2px solid transparent',
              color: activeTab === "arrange" ? 'var(--cie-ink)' : 'var(--cie-ink-mute)',
              fontFamily: 'var(--cie-sans)'
            }}
          >
            {t("arrangeTab")}
          </button>
          <button
            onClick={() => setActiveTab("windows")}
            aria-current={activeTab === "windows" ? "page" : undefined}
            className="px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              borderBottom: activeTab === "windows" ? '2px solid var(--cie-ink)' : '2px solid transparent',
              color: activeTab === "windows" ? 'var(--cie-ink)' : 'var(--cie-ink-mute)',
              fontFamily: 'var(--cie-sans)'
            }}
          >
            {t("windowsTab")}
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            aria-current={activeTab === "profiles" ? "page" : undefined}
            className="px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              borderBottom: activeTab === "profiles" ? '2px solid var(--cie-ink)' : '2px solid transparent',
              color: activeTab === "profiles" ? 'var(--cie-ink)' : 'var(--cie-ink-mute)',
              fontFamily: 'var(--cie-sans)'
            }}
          >
            {t("profilesTab")}
          </button>
        </nav>

        {/* Main View Panels */}
        <main id="workspace-main" tabIndex="-1">
        {activeTab === "arrange" ? (
          <div className="flex flex-1 flex-wrap gap-4 md:flex-nowrap">
            {/* Left Windows Library Sidebar */}
            <WindowsSidebar
              lang={lang}
              windows={windows}
              canvasSlots={canvasSlots}
              onOpenAddModal={handleOpenAddModal}
              onEditWindow={(item) => handleOpenEditModal(item, "library")}
              onDeleteWindow={deleteWindow}
              showGuide={onboardingOpen}
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
              onOpenEditModal={(item) => handleOpenEditModal(item, "canvas")}
              layoutFamily={layoutFamily}
              onLayoutFamilyChange={handleLayoutFamilyChange}
              showGuide={onboardingOpen}
            />
          </div>
        ) : activeTab === "windows" ? (
          <div className="flex flex-col gap-5 flex-1">
            <WindowsTab
              lang={lang}
              windows={windows}
              onOpenAddModal={handleOpenAddModal}
              onEditWindow={(item) => handleOpenEditModal(item, "library")}
              onDeleteWindow={deleteWindow}
              onNotice={showNote}
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
        </main>
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
      <BulkPlacementChoice lang={lang} count={bulkItems.length} open={bulkItems.length > 0} onAutoPlace={() => commitBulkItems("auto")} onLibraryOnly={() => commitBulkItems("manual")} onClose={() => setBulkItems([])} />
      <OnboardingGuide lang={lang} open={onboardingOpen} onComplete={() => { setOnboardingOpen(false); updateState({ onboardingSeen: true }); }} onReplay={() => setOnboardingOpen(true)} />
    </div>
  );
}
