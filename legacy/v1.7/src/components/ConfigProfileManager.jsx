import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sliders, Download, Upload, Check, Plus, Trash2 } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function ConfigProfileManager({
  lang,
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onExportBackup,
  onImportBackup,
}) {
  const t = (key, values) => getTranslation(lang, key, values);
  const [newProfileName, setNewProfileName] = useState("");

  const handleCreate = () => {
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim());
    setNewProfileName("");
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-zinc-800 bg-zinc-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>{t("profilesTitle")}</span>
          </CardTitle>
          <p className="text-xs text-zinc-400">{t("profilesSubtitle")}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Create New Profile Form */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={t("profileNamePlaceholder")}
              aria-label={t("profileNameLabel")}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-xs text-zinc-100"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreate}
              className="h-9 text-xs gap-1.5 border-zinc-700 text-zinc-200 hover:bg-zinc-800 shrink-0 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("createProfileBtn")}</span>
            </Button>
          </div>

          {/* Profile List */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
            {(profiles || []).map((prof) => {
              const isActive = prof.id === activeProfileId;

              return (
                <div
                  key={prof.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isActive
                      ? "border-blue-500 bg-blue-500/10 shadow-md"
                      : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-zinc-100 truncate">
                      {prof.name || t("profileNameDefault")}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t("activeProfileTag")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectProfile(prof.id)}
                        className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        {t("activateProfileBtn")}
                      </Button>
                    )}
                    {profiles.length > 1 && !isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteProfile(prof.id)}
                        aria-label={t("deleteProfile", { name: prof.name || t("profileNameDefault") })}
                        title={t("deleteProfile", { name: prof.name || t("profileNameDefault") })}
                        className="h-7 w-7 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Backup Export & Import */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportBackup}
              className="h-9 text-xs gap-2 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 font-bold"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{t("downloadBackupBtn")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onImportBackup}
              className="h-9 text-xs gap-2 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 font-bold"
            >
              <Upload className="w-3.5 h-3.5 text-green-400" />
              <span>{t("restoreBackupBtn")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
