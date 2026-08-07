import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function DangerZone({ lang, onFactoryReset }) {
  const t = (key) => getTranslation(lang, key);
  const [confirming, setConfirming] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let timer;
    if (confirming) {
      timer = setTimeout(() => {
        setConfirming(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [confirming]);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
    } else {
      setConfirming(false);
      onFactoryReset();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    }
  };

  return (
    <Card className="border-red-900/50 bg-red-950/20 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>{t("dangerZoneTitle")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-zinc-300 font-medium">
          {t("dangerZoneSubtitle")}
        </p>

        {resetSuccess && (
          <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{t("resetDoneMsg")}</span>
          </div>
        )}

        <Button
          variant={confirming ? "destructive" : "outline"}
          onClick={handleClick}
          className={`w-full h-11 font-bold text-xs transition-all ${
            confirming
              ? "bg-red-600 text-white animate-pulse"
              : "border-red-900/60 text-red-400 hover:bg-red-950/60 hover:text-red-300"
          }`}
        >
          {confirming
            ? t("dangerZoneConfirmMsg")
            : t("dangerZoneBtnMsg")}
        </Button>
      </CardContent>
    </Card>
  );
}
