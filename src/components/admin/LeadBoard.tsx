"use client";

import Link from "next/link";
import type { Lead, LeadStatus } from "@/types/database";

const PIPELINE: { status: LeadStatus; label: string; color: string; dotColor: string; bgColor: string }[] = [
  { status: "New", label: "New", color: "text-blue-400", dotColor: "bg-blue-400", bgColor: "bg-blue-400/10" },
  { status: "Contacted", label: "Contacted", color: "text-amber-400", dotColor: "bg-amber-400", bgColor: "bg-amber-400/10" },
  { status: "Qualified", label: "Qualified", color: "text-cyan-400", dotColor: "bg-cyan-400", bgColor: "bg-cyan-400/10" },
  { status: "Appointment", label: "Appt", color: "text-purple-400", dotColor: "bg-purple-400", bgColor: "bg-purple-400/10" },
  { status: "Negotiation", label: "Negotiation", color: "text-orange-400", dotColor: "bg-orange-400", bgColor: "bg-orange-400/10" },
  { status: "Sold", label: "Sold", color: "text-emerald-400", dotColor: "bg-emerald-400", bgColor: "bg-emerald-400/10" },
  { status: "Lost", label: "Lost", color: "text-red-400", dotColor: "bg-red-400", bgColor: "bg-red-400/10" },
];

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact",
  financing_inquiry: "Financing",
  vehicle_inquiry: "Vehicle",
  schedule_visit: "Visit",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

interface Props {
  leads: Lead[];
}

export default function LeadBoard({ leads }: Props) {
  const grouped = new Map<LeadStatus, Lead[]>();
  for (const stage of PIPELINE) {
    grouped.set(stage.status, []);
  }
  for (const lead of leads) {
    grouped.get(lead.status)?.push(lead);
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-7">
        {PIPELINE.map((stage) => {
          const stageLeads = grouped.get(stage.status) || [];
          return (
            <div
              key={stage.status}
              className="w-[260px] md:w-auto shrink-0 md:shrink flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                <span className={`text-[10px] font-accent uppercase tracking-[0.15em] ${stage.color}`}>
                  {stage.label}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stage.bgColor} ${stage.color} font-medium`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-thin">
                {stageLeads.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/[0.04] p-4 text-center">
                    <p className="text-[10px] text-white/10">No leads</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/admin/leads/${lead.id}`}
                      className="block rounded-lg border border-white/[0.04] bg-white/[0.015] p-3 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-200 group"
                    >
                      <p className="text-sm text-tj-cream/80 font-medium truncate group-hover:text-tj-cream transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5 truncate">
                        {formatPhone(lead.phone)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25 font-accent uppercase tracking-[0.1em]">
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </span>
                        <span className="text-[9px] text-white/15 ml-auto">
                          {relativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
