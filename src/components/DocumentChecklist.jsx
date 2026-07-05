import React, { useState } from "react";
import { ClipboardList, Building2, FileCheck2, BadgeCheck } from "lucide-react";
import { t } from "../data/theme";
import { departmentName } from "../data/departments";

/* ----------------------------------------------------------------
   DOCUMENT CHECKLIST — interactive, ties to "helps prepare forms"
------------------------------------------------------------------ */
export default function DocumentChecklist({ intent }) {
  const [checked, setChecked] = useState({});
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div
      className="mt-2 max-w-lg overflow-hidden rounded-sm"
      style={{ background: t.paper, border: `1px solid ${t.line}` }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ background: t.teal }}>
        <div className="flex items-center gap-2">
          <ClipboardList size={15} color={t.marigoldSoft} />
          <span className="text-sm font-semibold" style={{ color: t.paper }}>
            {intent.label}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: t.marigoldSoft }}>
          {done}/{intent.documents.length} ready
        </span>
      </div>

      <div className="px-4 py-3 text-xs" style={{ color: t.slate }}>
        <div className="mb-2 flex items-center gap-1.5">
          <Building2 size={13} style={{ color: t.teal }} />
          Routes to: <span style={{ color: t.ink, fontWeight: 600 }}>{departmentName(intent.departmentId)}</span>
        </div>
        <div className="mb-3 flex items-center gap-1.5">
          <FileCheck2 size={13} style={{ color: t.teal }} />
          Typical timeline: <span style={{ color: t.ink, fontWeight: 600 }}>{intent.timeline}</span>
        </div>

        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.slate }}>
          Tick what you already have
        </p>
        <div className="space-y-1.5">
          {intent.documents.map((doc, i) => (
            <label key={i} className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: t.ink }}>
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="h-3.5 w-3.5 accent-current"
                style={{ color: t.sage }}
              />
              {doc}
            </label>
          ))}
        </div>
      </div>

      {done === intent.documents.length && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
          style={{ background: "rgba(107,143,113,0.12)", color: t.sage }}
        >
          <BadgeCheck size={14} /> All documents ready — you can submit now.
        </div>
      )}
    </div>
  );
}
