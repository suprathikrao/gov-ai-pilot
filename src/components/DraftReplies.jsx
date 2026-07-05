import React, { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, MessageSquareText } from "lucide-react";
import { t } from "../data/theme";
import { DEPARTMENTS, departmentName } from "../data/departments";

/* ----------------------------------------------------------------
   DRAFT REPLIES — reusable response templates.
   `officer` gates what an officer may edit: Admins manage all;
   others manage general templates + their own department's.
------------------------------------------------------------------ */
export default function DraftReplies({ replies, setReplies, officer, onInsert }) {
  const [filterDept, setFilterDept] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: "", departmentId: officer.departmentId || "", body: "" });
  const [creating, setCreating] = useState(false);

  const canManage = (r) => officer.role === "Admin" || r.departmentId === null || r.departmentId === officer.departmentId;

  const visible = replies.filter((r) => {
    if (officer.role !== "Admin" && r.departmentId && r.departmentId !== officer.departmentId) return false;
    if (filterDept === "all") return true;
    return r.departmentId === filterDept;
  });

  function startEdit(r) {
    setEditingId(r.id);
    setDraft({ title: r.title, departmentId: r.departmentId || "", body: r.body });
    setCreating(false);
  }

  function saveEdit(id) {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setReplies((rs) =>
      rs.map((r) => (r.id === id ? { ...r, title: draft.title, departmentId: draft.departmentId || null, body: draft.body } : r))
    );
    setEditingId(null);
  }

  function saveNew() {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setReplies((rs) => [
      ...rs,
      { id: `dr-${Date.now()}`, title: draft.title, departmentId: draft.departmentId || null, body: draft.body },
    ]);
    setCreating(false);
    setDraft({ title: "", departmentId: officer.departmentId || "", body: "" });
  }

  function remove(id) {
    setReplies((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <div className="rounded-sm" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: t.teal }}>
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: t.paper }}>
          <MessageSquareText size={14} /> Draft Replies
        </span>
        <button
          onClick={() => { setCreating(true); setEditingId(null); setDraft({ title: "", departmentId: officer.departmentId || "", body: "" }); }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: t.marigold, color: t.tealDeep }}
        >
          <Plus size={12} /> New template
        </button>
      </div>

      <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: t.line }}>
        <label className="text-[11px]" style={{ color: t.slate }}>Filter:</label>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-sm px-2 py-1 text-xs"
          style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
        >
          <option value="all">All categories</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {creating && (
        <TemplateForm draft={draft} setDraft={setDraft} onSave={saveNew} onCancel={() => setCreating(false)} />
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
        {visible.length === 0 && <p className="text-xs" style={{ color: t.slate }}>No templates in this category yet.</p>}
        {visible.map((r) =>
          editingId === r.id ? (
            <TemplateForm key={r.id} draft={draft} setDraft={setDraft} onSave={() => saveEdit(r.id)} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={r.id} className="rounded-sm px-3 py-2" style={{ background: t.paperDeep, border: `1px solid ${t.line}` }}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: t.ink }}>{r.title}</span>
                <span className="text-[10px]" style={{ color: t.slate }}>
                  {r.departmentId ? departmentName(r.departmentId) : "General"}
                </span>
              </div>
              <p className="mb-2 text-[11px] leading-relaxed" style={{ color: t.slate }}>{r.body}</p>
              <div className="flex items-center gap-3 text-[11px]">
                <button onClick={() => onInsert(r.body)} className="font-medium" style={{ color: t.teal }}>Insert</button>
                {canManage(r) && (
                  <>
                    <button onClick={() => startEdit(r)} className="flex items-center gap-1" style={{ color: t.slate }}>
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => remove(r.id)} className="flex items-center gap-1" style={{ color: t.coral }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TemplateForm({ draft, setDraft, onSave, onCancel }) {
  return (
    <div className="mx-4 mb-3 space-y-2 rounded-sm px-3 py-3" style={{ background: t.paperDeep, border: `1px solid ${t.line}` }}>
      <input
        value={draft.title}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        placeholder="Template title"
        className="w-full rounded-sm px-2 py-1.5 text-xs outline-none"
        style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
      />
      <select
        value={draft.departmentId}
        onChange={(e) => setDraft((d) => ({ ...d, departmentId: e.target.value }))}
        className="w-full rounded-sm px-2 py-1.5 text-xs"
        style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
      >
        <option value="">General (all departments)</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <textarea
        value={draft.body}
        onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        placeholder="Reply text..."
        rows={3}
        className="w-full rounded-sm px-2 py-1.5 text-xs outline-none"
        style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
      />
      <div className="flex items-center gap-3">
        <button onClick={onSave} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: t.sage }}>
          <Check size={12} /> Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 text-[11px]" style={{ color: t.slate }}>
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );
}
