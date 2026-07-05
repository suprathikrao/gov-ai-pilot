import React from "react";
import { Languages } from "lucide-react";
import { t } from "../data/theme";

/* ----------------------------------------------------------------
   UNDERSTANDING STRIP — signature element
   Shows the citizen exactly what the AI understood, transparently
------------------------------------------------------------------ */
export default function UnderstandingStrip({ result, language }) {
  const confident = result.confidence >= 70;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-1">
      <span
        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          background: confident ? "rgba(107,143,113,0.15)" : "rgba(198,93,75,0.15)",
          color: confident ? t.sage : t.coral,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: confident ? t.sage : t.coral }} />
        {confident ? result.intent.label : "Low confidence — escalating"}
      </span>
      <span className="text-[10px]" style={{ color: t.slate }}>
        {result.confidence}% match
      </span>
      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: t.paperDeep, color: t.slate }}>
        <Languages size={10} /> {language}
      </span>
    </div>
  );
}
