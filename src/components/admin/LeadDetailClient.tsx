"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadNote, LeadTask, LeadStatus, NoteType } from "@/types/database";
import {
  addNoteAction,
  addTaskAction,
  completeTaskAction,
  changeLeadStatusAction,
  saveBuyerInfoAction,
} from "@/lib/actions/crm";

// ============================================================
// Pipeline stages
// ============================================================

const PIPELINE: { status: LeadStatus; label: string; color: string; dotColor: string }[] = [
  { status: "New", label: "New", color: "text-blue-400", dotColor: "bg-blue-400" },
  { status: "Contacted", label: "Contacted", color: "text-amber-400", dotColor: "bg-amber-400" },
  { status: "Qualified", label: "Qualified", color: "text-cyan-400", dotColor: "bg-cyan-400" },
  { status: "Appointment", label: "Appointment", color: "text-purple-400", dotColor: "bg-purple-400" },
  { status: "Negotiation", label: "Negotiation", color: "text-orange-400", dotColor: "bg-orange-400" },
  { status: "Sold", label: "Sold", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  { status: "Lost", label: "Lost", color: "text-red-400", dotColor: "bg-red-400" },
];

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact",
  financing_inquiry: "Financing",
  vehicle_inquiry: "Vehicle",
  schedule_visit: "Visit",
};

const NOTE_TYPES: { value: NoteType; label: string; icon: string }[] = [
  { value: "call", label: "Call", icon: "M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" },
  { value: "text", label: "Text", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { value: "email", label: "Email", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
  { value: "visit", label: "Visit", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { value: "note", label: "Note", icon: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

// ============================================================
// Component
// ============================================================

interface Props {
  lead: Lead;
  notes: LeadNote[];
  tasks: LeadTask[];
}

export default function LeadDetailClient({ lead, notes, tasks }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Note form
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("note");

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Buyer info modal (shown when marking as Sold)
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === lead.status) return;

    // Intercept "Sold" — show buyer info modal first
    if (newStatus === "Sold") {
      setBuyerName(lead.buyerName || lead.name);
      setBuyerPhone(lead.buyerPhone || lead.phone);
      setShowBuyerModal(true);
      return;
    }

    const fd = new FormData();
    fd.set("leadId", lead.id);
    fd.set("newStatus", newStatus);
    startTransition(async () => {
      await changeLeadStatusAction(fd);
      router.refresh();
    });
  }

  function handleConfirmSold() {
    if (!buyerName.trim() || !buyerPhone.trim()) return;
    const fd = new FormData();
    fd.set("leadId", lead.id);
    fd.set("buyerName", buyerName.trim());
    fd.set("buyerPhone", buyerPhone.trim());
    startTransition(async () => {
      await saveBuyerInfoAction(fd);
      setShowBuyerModal(false);
      router.refresh();
    });
  }

  function handleAddNote() {
    if (!noteContent.trim()) return;
    const fd = new FormData();
    fd.set("leadId", lead.id);
    fd.set("content", noteContent);
    fd.set("noteType", noteType);
    startTransition(async () => {
      await addNoteAction(fd);
      setNoteContent("");
      router.refresh();
    });
  }

  function handleAddTask() {
    if (!taskTitle.trim()) return;
    const fd = new FormData();
    fd.set("leadId", lead.id);
    fd.set("title", taskTitle);
    if (taskDueDate) fd.set("dueDate", taskDueDate);
    startTransition(async () => {
      await addTaskAction(fd);
      setTaskTitle("");
      setTaskDueDate("");
      router.refresh();
    });
  }

  function handleCompleteTask(taskId: string) {
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("leadId", lead.id);
    startTransition(async () => {
      await completeTaskAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* ══════════ LEAD INFO ══════════ */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-2 text-tj-gold hover:text-tj-gold/80 transition-colors text-sm font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {lead.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
            </a>

            {lead.email && (
              <p className="text-xs text-white/30">{lead.email}</p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-white/20">
              <span className="px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] font-accent uppercase tracking-[0.1em]">
                {SOURCE_LABELS[lead.source] ?? lead.source}
              </span>
              <span>{formatDate(lead.createdAt)}</span>
              <span className="text-white/10">{relativeTime(lead.createdAt)}</span>
            </div>

            {lead.message && (
              <p className="text-sm text-white/40 mt-2 leading-relaxed">
                {lead.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ BUYER INFO (shown when sold) ══════════ */}
      {lead.status === "Sold" && lead.buyerName && (
        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-5">
          <h2 className="font-accent text-[10px] uppercase tracking-[0.2em] text-emerald-400/50 mb-3">
            Buyer Information
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400/60" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-sm text-tj-cream/80 font-medium">{lead.buyerName}</span>
            </div>
            <a
              href={`tel:${lead.buyerPhone}`}
              className="inline-flex items-center gap-2 text-emerald-400/80 hover:text-emerald-400 transition-colors text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {(lead.buyerPhone ?? "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
            </a>
            <button
              onClick={() => {
                setBuyerName(lead.buyerName || "");
                setBuyerPhone(lead.buyerPhone || "");
                setShowBuyerModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-accent uppercase tracking-[0.1em] text-white/20 border border-white/[0.04] hover:text-white/40 hover:border-white/[0.08] transition-all ml-auto"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STATUS PIPELINE ══════════ */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
        <h2 className="font-accent text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
          Pipeline Stage
        </h2>
        <div className="flex gap-2 overflow-x-auto max-md:flex-nowrap max-md:pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {PIPELINE.map((stage) => {
            const isActive = lead.status === stage.status;
            return (
              <button
                key={stage.status}
                onClick={() => handleStatusChange(stage.status)}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-accent uppercase tracking-[0.1em] border transition-all duration-300 disabled:opacity-40 shrink-0 ${
                  isActive
                    ? `${stage.color} border-current/20 bg-current/[0.08]`
                    : "text-white/20 border-white/[0.04] hover:border-white/[0.08] hover:text-white/40 hover:bg-white/[0.02]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? stage.dotColor : "bg-white/10"
                  }`}
                />
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════ NOTES ══════════ */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
        <h2 className="font-accent text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
          Notes
        </h2>

        {/* Add Note Form */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {NOTE_TYPES.map((nt) => (
              <button
                key={nt.value}
                type="button"
                onClick={() => setNoteType(nt.value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-accent uppercase tracking-[0.1em] border transition-all ${
                  noteType === nt.value
                    ? "text-tj-gold border-tj-gold/20 bg-tj-gold/[0.06]"
                    : "text-white/20 border-white/[0.04] hover:text-white/40"
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={nt.icon} />
                </svg>
                {nt.label}
              </button>
            ))}
          </div>

          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-tj-cream/80 placeholder:text-white/15 focus:outline-none focus:border-tj-gold/20 resize-none"
          />

          <button
            onClick={handleAddNote}
            disabled={isPending || !noteContent.trim()}
            className="self-start inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-tj-gold/90 to-tj-gold/70 text-black text-[11px] font-medium hover:from-tj-gold hover:to-tj-gold/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>

        {/* Notes Timeline */}
        {notes.length === 0 ? (
          <p className="text-white/10 text-xs py-2">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const ntConfig = NOTE_TYPES.find((t) => t.value === note.noteType);
              return (
                <div
                  key={note.id}
                  className="flex gap-3 py-2 border-t border-white/[0.03] first:border-t-0"
                >
                  <div className="shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20" aria-hidden="true">
                      <path d={ntConfig?.icon ?? NOTE_TYPES[4].icon} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/50 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-white/15">
                      <span className="uppercase tracking-[0.1em] font-accent">
                        {ntConfig?.label ?? "Note"}
                      </span>
                      <span>&middot;</span>
                      <span>{relativeTime(note.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ TASKS ══════════ */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
        <h2 className="font-accent text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
          Follow-up Tasks
        </h2>

        {/* Add Task Form */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="New task..."
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-tj-cream/80 placeholder:text-white/15 focus:outline-none focus:border-tj-gold/20"
          />
          <input
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/40 focus:outline-none focus:border-tj-gold/20 w-full sm:w-auto"
          />
          <button
            onClick={handleAddTask}
            disabled={isPending || !taskTitle.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-tj-gold/90 to-tj-gold/70 text-black text-[11px] font-medium hover:from-tj-gold hover:to-tj-gold/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Add Task
          </button>
        </div>

        {/* Task List */}
        {tasks.length === 0 ? (
          <p className="text-white/10 text-xs py-2">No follow-up tasks</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.completed);
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    task.completed
                      ? "border-white/[0.02] bg-white/[0.005] opacity-50"
                      : overdue
                      ? "border-red-400/10 bg-red-400/[0.02]"
                      : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                >
                  {/* Complete button */}
                  {!task.completed ? (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={isPending}
                      className="shrink-0 mt-0.5 w-4 h-4 rounded border border-white/[0.15] hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] transition-all disabled:opacity-40"
                      aria-label="Complete task"
                    />
                  ) : (
                    <div className="shrink-0 mt-0.5 w-4 h-4 rounded bg-emerald-400/20 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        task.completed
                          ? "text-white/25 line-through"
                          : "text-white/60"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      {task.dueDate && (
                        <span
                          className={
                            overdue
                              ? "text-red-400 font-medium"
                              : task.completed
                              ? "text-white/15"
                              : "text-white/20"
                          }
                        >
                          {overdue && "Overdue: "}
                          {new Date(task.dueDate + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                      {task.completed && task.completedAt && (
                        <span className="text-white/10">
                          Done {relativeTime(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ BUYER INFO MODAL ══════════ */}
      {showBuyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBuyerModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-400/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-tj-cream">Mark as Sold</h3>
                <p className="text-[11px] text-white/30">Enter the buyer&apos;s information</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-accent uppercase tracking-[0.2em] text-white/30 mb-1.5">
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-tj-cream/80 placeholder:text-white/15 focus:outline-none focus:border-emerald-400/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-accent uppercase tracking-[0.2em] text-white/30 mb-1.5">
                  Buyer Phone
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-tj-cream/80 placeholder:text-white/15 focus:outline-none focus:border-emerald-400/30 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowBuyerModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-[11px] font-accent uppercase tracking-[0.1em] text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-white/[0.1] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSold}
                disabled={isPending || !buyerName.trim() || !buyerPhone.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/90 to-emerald-600/80 text-white text-[11px] font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : "Confirm Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
