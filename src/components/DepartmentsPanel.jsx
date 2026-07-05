import React, { useState } from "react";
import { Building2, Search } from "lucide-react";
import { t } from "../data/theme";
import { DEPARTMENTS } from "../data/departments";
import { INTENTS } from "../data/intents";

/* ----------------------------------------------------------------
   DEPARTMENTS PANEL — citizen-facing browser of all government
   departments and the services routed to each.
------------------------------------------------------------------ */
export default function DepartmentsPanel({ onAskAbout }) {
  const [query, setQuery] = useState("");
  const filtered = DEPARTMENTS.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.blurb.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: t.ink, fontFamily: "'Fraunces', serif" }}>
          Government Departments
        </h2>
        <p className="text-xs" style={{ color: t.slate }}>
          Browse departments and the services each one handles.
        </p>
      </div>

      <div
        className="mb-4 flex items-center gap-2 rounded-sm px-3 py-2"
        style={{ background: t.paper, border: `1px solid ${t.line}` }}
      >
        <Search size={14} style={{ color: t.slate }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search departments..."
          aria-label="Search departments"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: t.ink }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dept) => {
          const services = INTENTS.filter((i) => i.departmentId === dept.id);
          return (
            <div
              key={dept.id}
              className="flex flex-col rounded-sm px-4 py-3"
              style={{ background: t.paper, border: `1px solid ${t.line}` }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Building2 size={15} style={{ color: t.teal }} />
                <span className="text-sm font-semibold" style={{ color: t.ink }}>
                  {dept.name}
                </span>
              </div>
              <p className="mb-2 text-xs" style={{ color: t.slate }}>
                {dept.blurb}
              </p>
              {services.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {services.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onAskAbout(s.label)}
                      className="rounded-full px-2 py-0.5 text-[10px] transition-colors"
                      style={{ background: t.paperDeep, color: t.teal, border: `1px solid ${t.line}` }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
