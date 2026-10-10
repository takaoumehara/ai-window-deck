import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCcw, ArrowLeft, ArrowRight, Grid, Play, Undo, Expand } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { useShortcuts } from "@/hooks/useShortcuts";

export function CommandBar({ lang, onAction }) {
  const t = (key) => getTranslation(lang, key);
  const shortcuts = useShortcuts();

  return (
    <section className="mb-5 flex flex-col gap-2.5" aria-label={t("commandsLabel")}>
      {/* Primary Hero Row (2x Height Prominent Cards) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button
          variant="hero"
          size="lg"
          onClick={() => onAction("spotlight")}
          className="h-[58px] justify-start gap-3 px-5 text-[15px]"
        >
          <Maximize className="w-5 h-5 text-white" />
          <div className="flex items-center gap-2">
            <span>{t("spotlight")}</span>
            <span className="key-cap">{shortcuts["toggle-spotlight"]}</span>
          </div>
        </Button>

        <Button
          variant="heroAlt"
          size="lg"
          onClick={() => onAction("home")}
          className="h-[58px] justify-start gap-3 border-zinc-700 px-5 text-[15px] hover:border-zinc-600"
        >
          <RotateCcw className="w-5 h-5 text-zinc-300" />
          <div className="flex items-center gap-2">
            <span>{t("restore")}</span>
            <span className="key-cap">{shortcuts["restore-home"]}</span>
          </div>
        </Button>
      </div>

      {/* Secondary Uniform Commands Row */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/75 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("prev")}
          className="h-9 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("prev")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("next")}
          className="h-9 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("next")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("retile")}
          className="h-9 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          <Grid className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("retile")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("launch")}
          className="h-9 gap-2 border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800"
        >
          <Play className="w-3.5 h-3.5 text-blue-400" />
          <span>{t("launchAll")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("undo")}
          className="h-9 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          <Undo className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("undo")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("fullscreen")}
          className="h-9 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          <Expand className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("fullscreenWindow")}</span>
        </Button>
      </div>
    </section>
  );
}
