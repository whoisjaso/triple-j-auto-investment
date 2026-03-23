"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle, VehicleStatus } from "@/types/database";
import { advanceVehicleStatusAction } from "@/lib/actions/pipeline";

const PIPELINE_ORDER: VehicleStatus[] = [
  "Bidding",
  "Purchased",
  "In_Transit",
  "Arrived",
  "Inspection",
  "Available",
];

function getNextStatus(current: VehicleStatus): VehicleStatus | null {
  const idx = PIPELINE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PIPELINE_ORDER.length - 1) return null;
  return PIPELINE_ORDER[idx + 1];
}

interface StageConfig {
  status: VehicleStatus;
  label: string;
  color: string;
  dotColor: string;
}

const STAGES: StageConfig[] = [
  { status: "Bidding", label: "Bidding", color: "text-amber-400", dotColor: "bg-amber-400" },
  { status: "Purchased", label: "Purchased", color: "text-blue-400", dotColor: "bg-blue-400" },
  { status: "In_Transit", label: "In Transit", color: "text-purple-400", dotColor: "bg-purple-400" },
  { status: "Arrived", label: "Arrived", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  { status: "Inspection", label: "Inspection", color: "text-orange-400", dotColor: "bg-orange-400" },
];

function formatCurrency(val: number | null): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SyncResult {
  success?: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  error?: string;
}

interface Props {
  groupedVehicles: Record<string, Vehicle[]>;
  totalCount: number;
}

export default function PipelineClient({ groupedVehicles, totalCount }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/pipeline/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setSyncResult({ created: 0, updated: 0, skipped: 0, errors: [], error: data.error });
      } else {
        setSyncResult(data);
        router.refresh();
      }
    } catch {
      setSyncResult({ created: 0, updated: 0, skipped: 0, errors: [], error: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  function handleAdvance(vehicleId: string, nextStatus: VehicleStatus) {
    const formData = new FormData();
    formData.set("vehicleId", vehicleId);
    formData.set("nextStatus", nextStatus);

    startTransition(async () => {
      await advanceVehicleStatusAction(formData);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Sync Button + Results */}
      <div className="mb-4 md:mb-8">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-tj-gold/90 to-tj-gold/70 text-black text-sm font-medium hover:from-tj-gold hover:to-tj-gold/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Syncing Gmail...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6" />
                <path d="M2.5 22v-6h6" />
                <path d="M2.5 16A10 10 0 0 1 21.5 8" />
                <path d="M21.5 8A10 10 0 0 1 2.5 16" />
              </svg>
              Sync from Gmail
            </>
          )}
        </button>

        {syncResult && (
          <div className={`mt-4 p-4 rounded-xl border ${
            syncResult.error
              ? "border-red-400/20 bg-red-400/[0.04]"
              : "border-emerald-400/20 bg-emerald-400/[0.04]"
          }`}>
            {syncResult.error ? (
              <p className="text-sm text-red-400">{syncResult.error}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {syncResult.created > 0 && (
                  <span className="text-emerald-400">
                    +{syncResult.created} created
                  </span>
                )}
                {syncResult.updated > 0 && (
                  <span className="text-blue-400">
                    {syncResult.updated} updated
                  </span>
                )}
                {syncResult.skipped > 0 && (
                  <span className="text-white/30">
                    {syncResult.skipped} skipped
                  </span>
                )}
                {syncResult.created === 0 && syncResult.updated === 0 && (
                  <span className="text-white/40">No new vehicles to sync</span>
                )}
                {syncResult.errors.length > 0 && (
                  <span className="text-red-400">
                    {syncResult.errors.length} errors
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 && !syncResult && (
        <div className="text-center py-16">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-white/10 mb-4" aria-hidden="true">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <p className="text-white/30 text-sm">No vehicles in pipeline</p>
          <p className="text-white/15 text-xs mt-1">Click &ldquo;Sync from Gmail&rdquo; to check for new purchases</p>
        </div>
      )}

      {/* Stage Sections */}
      {STAGES.map((stage) => {
        const vehicles = groupedVehicles[stage.status] || [];
        if (vehicles.length === 0 && totalCount === 0) return null;

        return (
          <div key={stage.status} className="mb-5 md:mb-8">
            {/* Stage Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
              <h2 className={`font-accent text-xs uppercase tracking-[0.15em] ${stage.color}`}>
                {stage.label}
              </h2>
              <span className="text-[10px] text-white/20 font-accent">
                {vehicles.length}
              </span>
            </div>

            {vehicles.length === 0 ? (
              <p className="text-white/10 text-xs pl-5 py-2">No vehicles</p>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => {
                  const next = getNextStatus(v.status);
                  const isLast = v.status === "Inspection";

                  return (
                    <div
                      key={v.id}
                      className="group rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 p-3 md:p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Vehicle Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-tj-cream/90">
                            {v.year} {v.make} {v.model}
                            {v.trim && (
                              <span className="text-white/30 ml-1">{v.trim}</span>
                            )}
                          </p>
                          <p className="text-[11px] text-white/25 font-mono mt-0.5">
                            <span className="hidden sm:inline">{v.vin}</span>
                            <span className="sm:hidden">...{v.vin.slice(-8)}</span>
                          </p>

                          {/* Details Row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-white/30">
                            {v.purchasePrice != null && (
                              <span>
                                Cost: <span className="text-white/50">{formatCurrency(v.purchasePrice)}</span>
                              </span>
                            )}
                            {v.auctionLocation && (
                              <span>{v.auctionLocation}</span>
                            )}
                            {v.transportCarrier && (
                              <span>
                                Carrier: <span className="text-white/50">{v.transportCarrier}</span>
                              </span>
                            )}
                            {v.transportDeliveryEta && (
                              <span>
                                ETA: <span className="text-white/50">{formatDate(v.transportDeliveryEta)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Advance Button */}
                        {next && (
                          <button
                            onClick={() => handleAdvance(v.id, next)}
                            disabled={isPending}
                            className={`shrink-0 text-[11px] font-accent uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg border transition-all duration-300 disabled:opacity-40 ${
                              isLast
                                ? "border-emerald-400/20 text-emerald-400/70 hover:bg-emerald-400/[0.06] hover:text-emerald-400"
                                : "border-white/[0.06] text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                            }`}
                          >
                            {isLast ? "Publish" : "Advance"} &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
