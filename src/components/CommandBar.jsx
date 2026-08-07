import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCcw, ArrowLeft, ArrowRight, Grid, Play, Undo, Expand } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function CommandBar({ lang, onAction }) {
  const t = (key) => getTranslation(lang, key);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Primary Hero Row (2x Height Prominent Cards) */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="hero"
          size="lg"
          onClick={() => onAction("spotlight")}
          className="h-16 flex items-center justify-center gap-3 text-base"
        >
          <Maximize className="w-5 h-5 text-white" />
          <div className="flex items-center gap-2">
            <span>{t("spotlight")}</span>
            <span className="key-cap">⌥ X</span>
          </div>
        </Button>

        <Button
          variant="heroAlt"
          size="lg"
          onClick={() => onAction("home")}
          className="h-16 flex items-center justify-center gap-3 text-base border-zinc-700 hover:border-zinc-500"
        >
          <RotateCcw className="w-5 h-5 text-zinc-300" />
          <div className="flex items-center gap-2">
            <span>{t("restore")}</span>
            <span className="key-cap">⌥ Z</span>
          </div>
        </Button>
      </div>

      {/* Secondary Uniform Commands Row */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("prev")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("prev")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("next")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("next")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("retile")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <Grid className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("retile")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("launch")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <Play className="w-3.5 h-3.5 text-blue-400" />
          <span>{t("launchAll")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("undo")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <Undo className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("undo")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("fullscreenWindow")}
          className="h-9 px-3 gap-2 bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          <Expand className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("fullscreenWindow")}</span>
        </Button>
      </div>
    </div>
  );
}
