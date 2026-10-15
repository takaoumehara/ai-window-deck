import React from "react";
import { AlertTriangle, Check, Hand, Loader2 } from "lucide-react";

const ICONS = { working: Loader2, "needs-you": Hand, done: Check, error: AlertTriangle };
export const AI_LABELS = { working: "aiWorking", "needs-you": "aiNeedsYou", done: "aiDone", error: "aiError" };

/**
 * A pane's AI status as icon + word on a status fill (index.css .deck-ai-badge).
 * `iconOnly` keeps the word for screen readers and the tooltip.
 */
export function AiBadge({ t, status, site, iconOnly = false, className = "" }) {
  const Icon = ICONS[status];
  if (!Icon) return null;
  const label = t(AI_LABELS[status]);
  const title = site ? `${site} · ${label}` : label;
  return (
    <span className={`deck-ai-badge deck-ai-badge--${status} ${iconOnly ? "deck-ai-badge--icon" : ""} ${className}`} title={title}>
      <Icon className={`h-3 w-3 shrink-0 ${status === "working" ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
      <span className={iconOnly ? "sr-only" : ""}>{iconOnly ? title : label}</span>
    </span>
  );
}
