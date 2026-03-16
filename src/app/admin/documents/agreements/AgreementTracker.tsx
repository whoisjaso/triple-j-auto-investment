"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText, CheckCircle, Clock, AlertCircle, RefreshCw, Eye, X,
  ChevronDown, ChevronUp, RotateCcw, Search, Printer, Send, MailCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PrintButton from "@/components/documents/PrintButton";
import {
  decodeCompletedLinkFromUrl,
  type CompletedLinkData,
} from "@/lib/documents/customerPortal";
import { ContractData } from "@/lib/documents/finance";
import { RentalData } from "@/lib/documents/rental";
import { BillOfSaleData } from "@/lib/documents/billOfSale";
import { Form130UData } from "@/lib/documents/form130U";
import { SignatureData } from "@/lib/documents/shared";
import ContractPreview from "@/components/documents/ContractPreview";
import RentalPreview from "@/components/documents/RentalPreview";
import BillOfSalePreview, {
  type BuyerAcknowledgments,
  emptyAcknowledgments,
} from "@/components/documents/BillOfSalePreview";
import Form130UPreview from "@/components/documents/Form130UPreview";

/* ═══════════════ TYPES ═══════════════ */

interface Agreement {
  id: string;
  document_type: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  vehicle_description: string | null;
  vehicle_vin: string | null;
  status: "pending" | "completed" | "finalized";
  sent_at: string;
  completed_at: string | null;
  finalized_at?: string | null;    // requires migration-14
  last_emailed_at?: string | null; // requires migration-14
  acknowledgments: Record<string, boolean>;
  has_buyer_signature: boolean;
  has_cobuyer_signature: boolean;
  has_dealer_signature: boolean;
  has_buyer_id: boolean;
}

interface AgreementDetail {
  buyer_address?: string | null;
  buyer_city?: string | null;
  buyer_state?: string | null;
  buyer_zip?: string | null;
  buyer_license?: string | null;
  buyer_license_state?: string | null;
  co_buyer_name?: string | null;
  co_buyer_email?: string | null;
  co_buyer_phone?: string | null;
  co_buyer_address?: string | null;
  co_buyer_city?: string | null;
  co_buyer_state?: string | null;
  co_buyer_zip?: string | null;
  co_buyer_license?: string | null;
  co_buyer_license_state?: string | null;
  buyer_id_photo?: string | null;
  completed_link?: string | null;
}

interface CustomerDeal {
  key: string;
  customerName: string;
  status: "pending" | "completed" | "finalized";
  agreements: Agreement[];
  latestSentAt: string;
  vehicleDescription: string | null;
}

/* ═══════════════ CONSTANTS ═══════════════ */

const docTypeLabels: Record<string, string> = {
  billOfSale: "Bill of Sale",
  financing: "Financing",
  rental: "Rental",
  form130U: "Form 130-U",
};

const ackLabels: Record<string, string> = {
  inspected: "Vehicle Inspected",
  asIs: "As-Is Understood",
  receivedCopy: "Copy Received",
  allSalesFinal: "Sales Final",
  odometerInformed: "Odometer Informed",
  responsibility: "Responsibility Accepted",
  financingSeparate: "Financing Separate",
};

/* ═══════════════ UTILITIES ═══════════════ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getCheckpoints(a: Agreement): { label: string; done: boolean }[] {
  const items: { label: string; done: boolean }[] = [
    { label: "Buyer Signature", done: a.has_buyer_signature },
    { label: "Dealer Signature", done: a.has_dealer_signature },
  ];
  if (a.has_cobuyer_signature) {
    items.push({ label: "Co-Buyer Signature", done: true });
  }
  items.push({ label: "ID Photo", done: a.has_buyer_id });
  if (a.acknowledgments) {
    for (const [key, val] of Object.entries(a.acknowledgments)) {
      items.push({ label: ackLabels[key] || key, done: !!val });
    }
  }
  return items;
}

function getCompletionStats(a: Agreement): { done: number; total: number } {
  const cps = getCheckpoints(a);
  return { done: cps.filter((c) => c.done).length, total: cps.length };
}

function groupByCustomer(agreements: Agreement[]): CustomerDeal[] {
  const groups = new Map<string, Agreement[]>();
  for (const a of agreements) {
    const key = a.buyer_name?.trim().toLowerCase() || `__anon_${a.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  return Array.from(groups.entries()).map(([key, agrs]) => {
    const allDone = agrs.every((a) => a.status === "completed" || a.status === "finalized");
    const anyFinalized = agrs.some((a) => a.status === "finalized");
    const latestSentAt = agrs.reduce(
      (latest, a) => (a.sent_at > latest ? a.sent_at : latest),
      agrs[0].sent_at
    );
    const vehicleAgreement = agrs.find((a) => a.vehicle_description);
    return {
      key,
      customerName: agrs[0].buyer_name || "Unnamed Customer",
      status: (anyFinalized ? "finalized" : allDone ? "completed" : "pending") as
        | "completed"
        | "pending"
        | "finalized",
      agreements: agrs,
      latestSentAt,
      vehicleDescription: vehicleAgreement?.vehicle_description || null,
    };
  });
}

function formatAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): string | null {
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;
  if (city && state)
    return `${address || ""}, ${city}, ${state} ${zip || ""}`.trim();
  return parts.join(", ");
}

/* ═══════════════ DOCUMENT VIEWER MODAL ═══════════════ */

function DocumentViewerModal({
  data,
  onClose,
}: {
  data: CompletedLinkData;
  onClose: () => void;
}) {
  const mergedData = { ...data.dd, ...data.cd };
  const signatures: SignatureData = {
    buyerIdPhoto: data.bi || "",
    buyerSignature: data.bs || "",
    buyerSignatureDate: data.bsd || "",
    coBuyerSignature: data.cs || "",
    coBuyerSignatureDate: data.csd || "",
    dealerSignature: data.ds || "",
    dealerSignatureDate: data.dsd || "",
  };
  const acknowledgments: BuyerAcknowledgments = data.ack
    ? {
        inspected: !!data.ack.inspected,
        asIs: !!data.ack.asIs,
        receivedCopy: !!data.ack.receivedCopy,
        allSalesFinal: !!data.ack.allSalesFinal,
        odometerInformed: !!data.ack.odometerInformed,
        responsibility: !!data.ack.responsibility,
        financingSeparate: !!data.ack.financingSeparate,
      }
    : emptyAcknowledgments;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <FileText size={16} className="text-tj-gold" />
          <span className="text-sm font-semibold text-tj-cream">
            {docTypeLabels[data.s] || data.s} — Full Document
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <PrintButton variant="pdf" size="sm" />
          <PrintButton variant="print" size="sm" />
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-auto p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:border-none print:rounded-none print-doc">
          {data.s === "financing" && (
            <ContractPreview
              data={mergedData as unknown as ContractData}
              signatures={signatures}
            />
          )}
          {data.s === "rental" && (
            <RentalPreview
              data={mergedData as unknown as RentalData}
              signatures={signatures}
            />
          )}
          {data.s === "billOfSale" && (
            <BillOfSalePreview
              data={mergedData as unknown as BillOfSaleData}
              signatures={signatures}
              acknowledgments={acknowledgments}
            />
          )}
          {data.s === "form130U" && (
            <Form130UPreview
              data={mergedData as unknown as Form130UData}
              signatures={signatures}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export default function AgreementTracker() {
  const router = useRouter();

  /* ── State ── */
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "finalized">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Detail & modal state
  const [detailCache, setDetailCache] = useState<
    Record<string, AgreementDetail>
  >({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [idPhotoModal, setIdPhotoModal] = useState<{
    photo: string;
    name: string;
  } | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
  const [docViewerData, setDocViewerData] = useState<CompletedLinkData | null>(
    null
  );
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  /* ── Data Fetching ── */

  const fetchAgreements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/agreements");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setAgreements(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[AgreementTracker] fetch error:", e);
      setError(e instanceof Error ? e.message : "Failed to load agreements");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (
    agreementId: string
  ): Promise<AgreementDetail | null> => {
    if (detailCache[agreementId]) return detailCache[agreementId];
    try {
      const res = await fetch(`/api/documents/agreements/${agreementId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const detail: AgreementDetail = {
        buyer_address: data.buyer_address || null,
        buyer_city: data.buyer_city || null,
        buyer_state: data.buyer_state || null,
        buyer_zip: data.buyer_zip || null,
        buyer_license: data.buyer_license || null,
        buyer_license_state: data.buyer_license_state || null,
        co_buyer_name: data.co_buyer_name || null,
        co_buyer_email: data.co_buyer_email || null,
        co_buyer_phone: data.co_buyer_phone || null,
        co_buyer_address: data.co_buyer_address || null,
        co_buyer_city: data.co_buyer_city || null,
        co_buyer_state: data.co_buyer_state || null,
        co_buyer_zip: data.co_buyer_zip || null,
        co_buyer_license: data.co_buyer_license || null,
        co_buyer_license_state: data.co_buyer_license_state || null,
        buyer_id_photo: data.buyer_id_photo || null,
        completed_link: data.completed_link || null,
      };
      setDetailCache((prev) => ({ ...prev, [agreementId]: detail }));
      return detail;
    } catch {
      return null;
    }
  };

  const handleExpand = async (dealKey: string, dealAgreements: Agreement[]) => {
    if (expandedKey === dealKey) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(dealKey);
    const toFetch = dealAgreements.filter(
      (a) => (a.status === "completed" || a.status === "finalized") && !detailCache[a.id]
    );
    if (toFetch.length > 0) {
      setLoadingDetail(dealKey);
      await Promise.all(toFetch.map((a) => fetchDetail(a.id)));
      setLoadingDetail(null);
    }
  };

  const fetchIdPhoto = async (agreementId: string, buyerName: string) => {
    setLoadingPhoto(agreementId);
    try {
      const detail = await fetchDetail(agreementId);
      if (detail?.buyer_id_photo) {
        setIdPhotoModal({
          photo: detail.buyer_id_photo,
          name: buyerName || "Customer",
        });
      } else {
        alert("No ID photo available for this agreement.");
      }
    } catch {
      alert("Failed to load ID photo.");
    } finally {
      setLoadingPhoto(null);
    }
  };

  const fetchAndViewDocument = async (agreementId: string) => {
    setLoadingDoc(agreementId);
    try {
      const detail = await fetchDetail(agreementId);
      if (detail?.completed_link) {
        const decoded = decodeCompletedLinkFromUrl(detail.completed_link);
        if (decoded) {
          setDocViewerData(decoded);
        } else {
          alert(
            "Could not decode the completed document. The link may be corrupted."
          );
        }
      } else {
        alert(
          "No completed document available. The customer hasn't submitted yet."
        );
      }
    } catch {
      alert("Failed to load document.");
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleFinalize = async (agreementId: string) => {
    if (finalizingId) return; // prevent double-click
    if (!confirm("Generate PDF copies and email buyer? This may take 15-30 seconds.")) return;
    setFinalizingId(agreementId);
    try {
      const res = await fetch("/api/documents/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId }),
      });
      const result = await res.json();
      if (res.ok || res.status === 207) {
        const msgs = ["Document finalized!"];
        if (result.emailSent) msgs.push("Email sent to buyer.");
        if (result.warnings?.length) msgs.push("Warnings: " + result.warnings.join(", "));
        alert(msgs.join("\n"));
        fetchAgreements(); // refresh list
      } else {
        alert(result.error || "Finalization failed");
      }
    } catch (e) {
      alert("Finalization failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setFinalizingId(null);
    }
  };

  const handleResend = async (agreementId: string) => {
    if (resendingId) return;
    if (!confirm("Resend buyer copy via email?")) return;
    setResendingId(agreementId);
    try {
      const res = await fetch("/api/documents/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Email resent successfully!");
        fetchAgreements();
      } else {
        alert(result.error || "Resend failed");
      }
    } catch (e) {
      alert("Resend failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setResendingId(null);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  /* ── Computed ── */

  const allDeals = useMemo(() => groupByCustomer(agreements), [agreements]);

  const customerDeals = useMemo(() => {
    let deals = [...allDeals];

    if (filter !== "all") {
      deals = deals.filter((d) => d.status === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      deals = deals.filter((d) => d.customerName.toLowerCase().includes(q));
    }

    deals.sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.latestSentAt).getTime() -
            new Date(a.latestSentAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.latestSentAt).getTime() -
            new Date(b.latestSentAt).getTime()
          );
        case "name":
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return deals;
  }, [allDeals, filter, search, sort]);

  const pendingCount = allDeals.filter((d) => d.status === "pending").length;
  const completedCount = allDeals.filter(
    (d) => d.status === "completed"
  ).length;

  /* ═══════════════ RENDER ═══════════════ */

  return (
    <div>
      {/* ══════════ SCREEN LAYOUT ══════════ */}
      <div className="space-y-5" data-print-hide>
        {/* ── Stat Cards ── */}
        <div className="flex gap-4">
          <div className="flex-1 bg-white/[0.03] border-l-[3px] border-l-amber-500 rounded-lg px-4 py-3">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40">
              Pending
            </div>
            <div className="text-2xl font-serif text-amber-400 mt-0.5">
              {pendingCount}
            </div>
          </div>
          <div className="flex-1 bg-white/[0.03] border-l-[3px] border-l-emerald-500 rounded-lg px-4 py-3">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40">
              Completed
            </div>
            <div className="text-2xl font-serif text-emerald-400 mt-0.5">
              {completedCount}
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Segmented tabs */}
          <div className="bg-white/[0.03] p-1 rounded-lg border border-white/[0.06] flex gap-0.5">
            {(["all", "pending", "completed", "finalized"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 ${
                  filter === f
                    ? "bg-tj-green text-white shadow-sm"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search + Sort + Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-tj-cream placeholder:text-white/20 focus:outline-none focus:border-tj-gold/30 w-44 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-white/60 focus:outline-none focus:border-tj-gold/30 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
              title="Print tracker"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={fetchAgreements}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-tj-gold/30 border-t-tj-gold rounded-full animate-spin" />
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && customerDeals.length === 0 && (
          <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
            <FileText size={40} className="mx-auto text-white/15 mb-4" />
            <p className="text-white/40 text-sm font-medium">
              {filter === "all" && !search
                ? "No agreements yet"
                : "No matching agreements"}
            </p>
            <p className="text-white/20 text-xs mt-1">
              {filter === "all" && !search
                ? "Send a document to a customer to get started."
                : "Try adjusting your filters or search."}
            </p>
          </div>
        )}

        {/* ── Customer Cards ── */}
        {!loading && customerDeals.length > 0 && (
          <div className="space-y-3">
            {customerDeals.map((deal) => {
              const isExpanded = expandedKey === deal.key;

              return (
                <div
                  key={deal.key}
                  className={`bg-white/[0.03] rounded-lg overflow-hidden transition-all duration-200 hover:bg-white/[0.05] border-l-[3px] ${
                    deal.status === "completed"
                      ? "border-l-emerald-500"
                      : "border-l-amber-500"
                  }`}
                  style={{
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* ── Card Content ── */}
                  <div className="px-5 py-4">
                    {/* Row 1: Name + Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[15px] font-semibold text-tj-cream truncate pr-3">
                        {deal.customerName}
                      </h3>
                      <span
                        className={`shrink-0 text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
                          deal.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>

                    {/* Row 2: Vehicle + Date */}
                    <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                      {deal.vehicleDescription && (
                        <span className="text-white/50">
                          {deal.vehicleDescription}
                        </span>
                      )}
                      <span>Sent {timeAgo(deal.latestSentAt)}</span>
                    </div>

                    {/* Row 3: Document Progress Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {deal.agreements.map((a) => {
                        const { done, total } = getCompletionStats(a);
                        const isComplete = a.status === "completed";
                        return (
                          <span
                            key={a.id}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${
                              isComplete
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle size={10} />
                            ) : (
                              <Clock size={10} />
                            )}
                            {docTypeLabels[a.document_type] ||
                              a.document_type}
                            {!isComplete && (
                              <span className="opacity-70">
                                {done}/{total}
                              </span>
                            )}
                          </span>
                        );
                      })}

                      {/* Expand toggle */}
                      <button
                        onClick={() =>
                          handleExpand(deal.key, deal.agreements)
                        }
                        className="ml-auto p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                        title={isExpanded ? "Collapse" : "Expand details"}
                      >
                        {loadingDetail === deal.key ? (
                          <div className="w-3.5 h-3.5 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                        ) : isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded Detail Panel ── */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] bg-white/[0.02]">
                      {deal.agreements.map((agreement, idx) => {
                        const detail = detailCache[agreement.id];
                        const checkpoints = getCheckpoints(agreement);

                        return (
                          <div
                            key={agreement.id}
                            className={`px-5 py-4 ${
                              idx < deal.agreements.length - 1
                                ? "border-b border-white/[0.04]"
                                : ""
                            }`}
                          >
                            {/* Document header + actions */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText
                                  size={13}
                                  className="text-white/30"
                                />
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                                  {docTypeLabels[agreement.document_type] ||
                                    agreement.document_type}
                                </span>
                                <span
                                  className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                                    agreement.status === "finalized"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : agreement.status === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-amber-500/10 text-amber-400"
                                  }`}
                                >
                                  {agreement.status}
                                </span>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                {agreement.status === "completed" &&
                                  agreement.document_type === "rental" && (
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/admin/documents/rental?renew=${agreement.id}`
                                        )
                                      }
                                      className="p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-400 hover:bg-white/[0.04] transition-all"
                                      title="Renew rental"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                  )}
                                {(agreement.status === "completed" || agreement.status === "finalized") && (
                                  <button
                                    onClick={() =>
                                      fetchAndViewDocument(agreement.id)
                                    }
                                    className="p-1.5 rounded-md text-tj-gold/60 hover:text-tj-gold hover:bg-white/[0.04] transition-all"
                                    title="View full document"
                                  >
                                    {loadingDoc === agreement.id ? (
                                      <div className="w-3.5 h-3.5 border border-tj-gold/30 border-t-tj-gold rounded-full animate-spin" />
                                    ) : (
                                      <FileText size={13} />
                                    )}
                                  </button>
                                )}
                                {agreement.status === "completed" && agreement.buyer_email && (
                                  <button
                                    onClick={() => handleFinalize(agreement.id)}
                                    disabled={!!finalizingId}
                                    className="p-1.5 rounded-md text-blue-400/60 hover:text-blue-400 hover:bg-white/[0.04] transition-all disabled:opacity-30"
                                    title="Finalize & Send PDF to buyer"
                                  >
                                    {finalizingId === agreement.id ? (
                                      <div className="w-3.5 h-3.5 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                    ) : (
                                      <Send size={13} />
                                    )}
                                  </button>
                                )}
                                {agreement.status === "finalized" && (
                                  <button
                                    onClick={() => handleResend(agreement.id)}
                                    disabled={!!resendingId}
                                    className="p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-400 hover:bg-white/[0.04] transition-all disabled:opacity-30"
                                    title={`Resend email${agreement.last_emailed_at ? ` (last sent ${timeAgo(agreement.last_emailed_at)})` : ''}`}
                                  >
                                    {resendingId === agreement.id ? (
                                      <div className="w-3.5 h-3.5 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                    ) : (
                                      <MailCheck size={13} />
                                    )}
                                  </button>
                                )}
                                {agreement.has_buyer_id && (
                                  <button
                                    onClick={() =>
                                      fetchIdPhoto(
                                        agreement.id,
                                        agreement.buyer_name || "Customer"
                                      )
                                    }
                                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                                    title="View ID photo"
                                  >
                                    {loadingPhoto === agreement.id ? (
                                      <div className="w-3.5 h-3.5 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                                    ) : (
                                      <Eye size={13} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Checkpoint grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                              {checkpoints.map((cp) => (
                                <div
                                  key={cp.label}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  {cp.done ? (
                                    <CheckCircle
                                      size={13}
                                      className="text-emerald-400 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-[13px] h-[13px] rounded-full border border-white/15 shrink-0" />
                                  )}
                                  <span
                                    className={
                                      cp.done
                                        ? "text-white/70"
                                        : "text-white/30"
                                    }
                                  >
                                    {cp.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Customer details (loaded from detail API) */}
                      {(() => {
                        const firstCompleted = deal.agreements.find(
                          (a) =>
                            a.status === "completed" && detailCache[a.id]
                        );
                        const detail = firstCompleted
                          ? detailCache[firstCompleted.id]
                          : null;
                        if (!detail) return null;

                        const address = formatAddress(
                          detail.buyer_address ?? null,
                          detail.buyer_city ?? null,
                          detail.buyer_state ?? null,
                          detail.buyer_zip ?? null
                        );
                        const hasAny =
                          deal.agreements[0]?.buyer_email ||
                          address ||
                          detail.buyer_license ||
                          detail.co_buyer_name;
                        if (!hasAny) return null;

                        return (
                          <div className="px-5 py-4 border-t border-white/[0.06]">
                            <div className="text-[9px] font-semibold tracking-widest uppercase text-white/25 mb-3">
                              Customer Details
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {deal.agreements[0]?.buyer_email && (
                                <div>
                                  <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                    Email
                                  </span>
                                  <p className="text-white/60 mt-0.5">
                                    {deal.agreements[0].buyer_email}
                                  </p>
                                </div>
                              )}
                              {deal.agreements[0]?.buyer_phone && (
                                <div>
                                  <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                    Phone
                                  </span>
                                  <p className="text-white/60 mt-0.5">
                                    {deal.agreements[0].buyer_phone}
                                  </p>
                                </div>
                              )}
                              {address && (
                                <div className="md:col-span-2">
                                  <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                    Address
                                  </span>
                                  <p className="text-white/60 mt-0.5">
                                    {address}
                                  </p>
                                </div>
                              )}
                              {detail.buyer_license && (
                                <div>
                                  <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                    License
                                  </span>
                                  <p className="text-white/60 mt-0.5 font-mono uppercase">
                                    {detail.buyer_license}
                                    {detail.buyer_license_state &&
                                      ` (${detail.buyer_license_state})`}
                                  </p>
                                </div>
                              )}

                              {/* Co-Buyer */}
                              {detail.co_buyer_name && (
                                <>
                                  <div className="col-span-full border-t border-white/[0.04] pt-3 mt-1">
                                    <span className="text-white/25 text-[9px] uppercase tracking-wider font-bold">
                                      Co-Buyer
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                      Name
                                    </span>
                                    <p className="text-white/60 mt-0.5">
                                      {detail.co_buyer_name}
                                    </p>
                                  </div>
                                  {detail.co_buyer_phone && (
                                    <div>
                                      <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                        Phone
                                      </span>
                                      <p className="text-white/60 mt-0.5">
                                        {detail.co_buyer_phone}
                                      </p>
                                    </div>
                                  )}
                                  {detail.co_buyer_email && (
                                    <div>
                                      <span className="text-white/25 text-[9px] uppercase tracking-wider">
                                        Email
                                      </span>
                                      <p className="text-white/60 mt-0.5">
                                        {detail.co_buyer_email}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Loading detail indicator */}
                      {loadingDetail === deal.key && (
                        <div className="flex justify-center py-3">
                          <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ PRINT LAYOUT (hidden on screen, shown in print via CSS) ══════════ */}
      <div className="agreement-print-only" style={{ display: "none" }}>
        <div className="text-center mb-6">
          <h1
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#111",
              marginBottom: "4px",
            }}
          >
            Triple J Auto Investment LLC — Agreement Tracker
          </h1>
          <p style={{ fontSize: "11px", color: "#666" }}>
            Printed on{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <table className="agreement-print-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th className="text-center">Bill of Sale</th>
              <th className="text-center">Rental</th>
              <th className="text-center">Financing</th>
              <th className="text-center">130-U</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {customerDeals.map((deal) => {
              const hasCompletedDoc = (type: string) =>
                deal.agreements.some(
                  (a) => a.document_type === type && a.status === "completed"
                );
              const hasAnyDoc = (type: string) =>
                deal.agreements.some((a) => a.document_type === type);

              const docSymbol = (type: string) => {
                if (hasCompletedDoc(type)) return "✓";
                if (hasAnyDoc(type)) return "○";
                return "—";
              };

              return (
                <tr
                  key={deal.key}
                  className={
                    deal.status === "completed" ? "row-completed" : ""
                  }
                >
                  <td>{deal.customerName}</td>
                  <td>{deal.vehicleDescription || "—"}</td>
                  <td>
                    {deal.status === "completed" ? "Complete" : "Pending"}
                  </td>
                  <td className="text-center">
                    {docSymbol("billOfSale")}
                  </td>
                  <td className="text-center">{docSymbol("rental")}</td>
                  <td className="text-center">{docSymbol("financing")}</td>
                  <td className="text-center">{docSymbol("form130U")}</td>
                  <td>{formatDate(deal.latestSentAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p
          style={{
            fontSize: "9px",
            color: "#888",
            marginTop: "16px",
            borderTop: "0.5px solid #ddd",
            paddingTop: "8px",
          }}
        >
          Total: {customerDeals.length} deals · Completed: {completedCount} ·
          Pending: {pendingCount} · Printed on{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* ID Photo Modal */}
      {idPhotoModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIdPhotoModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-tj-cream">
                  Customer ID
                </h3>
                <p className="text-xs text-white/40">{idPhotoModal.name}</p>
              </div>
              <button
                onClick={() => setIdPhotoModal(null)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
              <img
                src={idPhotoModal.photo}
                alt={`${idPhotoModal.name} ID`}
                className="w-full object-contain max-h-[500px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {docViewerData && (
        <DocumentViewerModal
          data={docViewerData}
          onClose={() => setDocViewerData(null)}
        />
      )}
    </div>
  );
}
