"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw, Eye, X, ChevronDown, ChevronUp, Printer, Download } from "lucide-react";
import { decodeCompletedLinkFromUrl, type CompletedLinkData } from "@/lib/documents/customerPortal";
import { ContractData } from "@/lib/documents/finance";
import { RentalData } from "@/lib/documents/rental";
import { BillOfSaleData } from "@/lib/documents/billOfSale";
import { Form130UData } from "@/lib/documents/form130U";
import { SignatureData } from "@/lib/documents/shared";
import ContractPreview from "@/components/documents/ContractPreview";
import RentalPreview from "@/components/documents/RentalPreview";
import BillOfSalePreview, { type BuyerAcknowledgments, emptyAcknowledgments } from "@/components/documents/BillOfSalePreview";
import Form130UPreview from "@/components/documents/Form130UPreview";

interface Agreement {
  id: string;
  document_type: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  vehicle_description: string | null;
  vehicle_vin: string | null;
  status: "pending" | "completed";
  sent_at: string;
  completed_at: string | null;
  acknowledgments: Record<string, boolean>;
  has_buyer_signature: boolean;
  has_cobuyer_signature: boolean;
  has_dealer_signature: boolean;
  has_buyer_id: boolean;
}

// Full agreement data fetched on-demand (includes customer data columns)
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

function formatAddress(address: string | null, city: string | null, state: string | null, zip: string | null): string | null {
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;
  if (city && state) return `${address || ''}, ${city}, ${state} ${zip || ''}`.trim();
  return parts.join(', ');
}

// Full-screen document viewer modal
function DocumentViewerModal({ data, onClose }: { data: CompletedLinkData; onClose: () => void }) {
  const mergedData = { ...data.dd, ...data.cd };
  const signatures: SignatureData = {
    buyerIdPhoto: data.bi || '',
    buyerSignature: data.bs || '',
    buyerSignatureDate: data.bsd || '',
    coBuyerSignature: data.cs || '',
    coBuyerSignatureDate: data.csd || '',
    dealerSignature: data.ds || '',
    dealerSignatureDate: data.dsd || '',
  };
  const acknowledgments: BuyerAcknowledgments = data.ack ? {
    inspected: !!data.ack.inspected,
    asIs: !!data.ack.asIs,
    receivedCopy: !!data.ack.receivedCopy,
    allSalesFinal: !!data.ack.allSalesFinal,
    odometerInformed: !!data.ack.odometerInformed,
    responsibility: !!data.ack.responsibility,
    financingSeparate: !!data.ack.financingSeparate,
  } : emptyAcknowledgments;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col" onClick={onClose}>
      <div className="bg-[#111] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center space-x-3">
          <FileText size={16} className="text-tj-gold" />
          <span className="text-sm font-semibold text-tj-cream">
            {docTypeLabels[data.s] || data.s} — Full Document
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-white/10 text-tj-gold rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-white/15 transition-all flex items-center space-x-1 border border-tj-gold/20">
            <Download size={12} /><span>PDF</span>
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-tj-gold text-white rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-tj-gold/90 transition-all flex items-center space-x-1">
            <Printer size={12} /><span>Print</span>
          </button>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-8" onClick={e => e.stopPropagation()}>
        <div className="max-w-5xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:border-none print:rounded-none print-doc">
          {data.s === 'financing' && <ContractPreview data={mergedData as unknown as ContractData} signatures={signatures} />}
          {data.s === 'rental' && <RentalPreview data={mergedData as unknown as RentalData} signatures={signatures} />}
          {data.s === 'billOfSale' && <BillOfSalePreview data={mergedData as unknown as BillOfSaleData} signatures={signatures} acknowledgments={acknowledgments} />}
          {data.s === 'form130U' && <Form130UPreview data={mergedData as unknown as Form130UData} signatures={signatures} />}
        </div>
      </div>
    </div>
  );
}

export default function AgreementTracker() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [idPhotoModal, setIdPhotoModal] = useState<{ photo: string; name: string } | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, AgreementDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [docViewerData, setDocViewerData] = useState<CompletedLinkData | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  // Fetch full agreement details (customer data, ID photo, completed_link)
  const fetchDetail = async (agreementId: string): Promise<AgreementDetail | null> => {
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
      setDetailCache(prev => ({ ...prev, [agreementId]: detail }));
      return detail;
    } catch {
      return null;
    }
  };

  const fetchIdPhoto = async (agreementId: string, buyerName: string) => {
    setLoadingPhoto(agreementId);
    try {
      const detail = await fetchDetail(agreementId);
      if (detail?.buyer_id_photo) {
        setIdPhotoModal({ photo: detail.buyer_id_photo, name: buyerName || "Customer" });
      } else {
        alert("No ID photo available for this agreement.");
      }
    } catch {
      alert("Failed to load ID photo.");
    } finally {
      setLoadingPhoto(null);
    }
  };

  const handleExpand = async (agreementId: string) => {
    if (expandedId === agreementId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(agreementId);
    if (!detailCache[agreementId]) {
      setLoadingDetail(agreementId);
      await fetchDetail(agreementId);
      setLoadingDetail(null);
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
          alert("Could not decode the completed document. The link may be corrupted.");
        }
      } else {
        alert("No completed document available. The customer hasn't submitted yet.");
      }
    } catch {
      alert("Failed to load document.");
    } finally {
      setLoadingDoc(null);
    }
  };

  const fetchAgreements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/agreements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAgreements(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agreements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const filtered = agreements.filter((a) =>
    filter === "all" ? true : a.status === filter
  );

  const pendingCount = agreements.filter((a) => a.status === "pending").length;
  const completedCount = agreements.filter(
    (a) => a.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-1">
            Total
          </div>
          <div className="text-2xl font-serif text-tj-cream">
            {agreements.length}
          </div>
        </div>
        <div className="bg-amber-500/[0.05] border border-amber-500/10 rounded-xl p-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-amber-400/70 mb-1">
            Pending
          </div>
          <div className="text-2xl font-serif text-amber-400">
            {pendingCount}
          </div>
        </div>
        <div className="bg-emerald-500/[0.05] border border-emerald-500/10 rounded-xl p-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-emerald-400/70 mb-1">
            Completed
          </div>
          <div className="text-2xl font-serif text-emerald-400">
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs + Refresh */}
      <div className="flex items-center justify-between">
        <div className="bg-white/[0.03] p-1 rounded-full border border-white/[0.06] flex gap-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all ${
                filter === f
                  ? "bg-tj-gold text-white shadow-md"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={fetchAgreements}
          className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-all"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
          <FileText size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-white/40 text-sm">
            {filter === "all"
              ? "No document agreements yet. Send a document to a customer to get started."
              : `No ${filter} agreements.`}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-tj-gold/30 border-t-tj-gold rounded-full animate-spin" />
        </div>
      )}

      {/* Agreement Cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((agreement) => {
            const isExpanded = expandedId === agreement.id;
            const detail = detailCache[agreement.id];

            return (
              <div
                key={agreement.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.04] transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {agreement.status === "completed" ? (
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle size={16} className="text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                          <Clock size={16} className="text-amber-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-tj-cream">
                            {docTypeLabels[agreement.document_type] ||
                              agreement.document_type}
                          </span>
                          <span
                            className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                              agreement.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {agreement.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          Sent {timeAgo(agreement.sent_at)}
                          {agreement.completed_at &&
                            ` · Completed ${timeAgo(agreement.completed_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {agreement.status === "completed" && (
                        <button
                          onClick={() => fetchAndViewDocument(agreement.id)}
                          className="p-2 rounded-lg text-tj-gold/70 hover:text-tj-gold hover:bg-white/[0.03] transition-all"
                          title="View full document"
                        >
                          {loadingDoc === agreement.id ? (
                            <div className="w-4 h-4 border border-tj-gold/30 border-t-tj-gold rounded-full animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                        </button>
                      )}
                      {detail?.completed_link && (
                        <a
                          href={detail.completed_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-white/30 hover:text-tj-gold hover:bg-white/[0.03] transition-all"
                          title="Open completed link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Buyer & Vehicle Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                    {agreement.buyer_name && (
                      <div>
                        <span className="text-white/30 text-[9px] uppercase tracking-wider">
                          Buyer
                        </span>
                        <p className="text-white/70 mt-0.5">
                          {agreement.buyer_name}
                        </p>
                      </div>
                    )}
                    {agreement.buyer_phone && (
                      <div>
                        <span className="text-white/30 text-[9px] uppercase tracking-wider">
                          Phone
                        </span>
                        <p className="text-white/70 mt-0.5">
                          {agreement.buyer_phone}
                        </p>
                      </div>
                    )}
                    {agreement.vehicle_description && (
                      <div>
                        <span className="text-white/30 text-[9px] uppercase tracking-wider">
                          Vehicle
                        </span>
                        <p className="text-white/70 mt-0.5">
                          {agreement.vehicle_description}
                        </p>
                      </div>
                    )}
                    {agreement.vehicle_vin && (
                      <div>
                        <span className="text-white/30 text-[9px] uppercase tracking-wider">
                          VIN
                        </span>
                        <p className="text-white/70 mt-0.5 font-mono uppercase">
                          {agreement.vehicle_vin}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Signature & Acknowledgment Status */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span
                      className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border ${
                        agreement.has_buyer_signature
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/[0.02] border-white/[0.06] text-white/30"
                      }`}
                    >
                      Buyer Sig {agreement.has_buyer_signature ? "✓" : "—"}
                    </span>
                    <span
                      className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border ${
                        agreement.has_dealer_signature
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/[0.02] border-white/[0.06] text-white/30"
                      }`}
                    >
                      Dealer Sig {agreement.has_dealer_signature ? "✓" : "—"}
                    </span>
                    {agreement.has_buyer_id ? (
                      <button
                        onClick={() => fetchIdPhoto(agreement.id, agreement.buyer_name || "Customer")}
                        className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        {loadingPhoto === agreement.id ? (
                          <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        ) : (
                          <Eye size={10} />
                        )}
                        <span>View ID</span>
                      </button>
                    ) : (
                      <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border bg-white/[0.02] border-white/[0.06] text-white/30">
                        ID Photo —
                      </span>
                    )}
                    {agreement.acknowledgments &&
                      Object.entries(agreement.acknowledgments).map(
                        ([key, val]) => (
                          <span
                            key={key}
                            className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border ${
                              val
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            {ackLabels[key] || key} {val ? "✓" : "✗"}
                          </span>
                        )
                      )}
                  </div>

                  {/* Expand button for customer details */}
                  {agreement.status === "completed" && (
                    <button
                      onClick={() => handleExpand(agreement.id)}
                      className="flex items-center space-x-1 text-[9px] font-semibold tracking-wider uppercase text-white/40 hover:text-white/70 transition-all mt-1"
                    >
                      {loadingDetail === agreement.id ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      <span>{isExpanded ? 'Hide' : 'Show'} Customer Details</span>
                    </button>
                  )}
                </div>

                {/* Expanded Customer Details */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    {loadingDetail === agreement.id ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                      </div>
                    ) : detail ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {agreement.buyer_email && (
                          <div>
                            <span className="text-white/30 text-[9px] uppercase tracking-wider">Email</span>
                            <p className="text-white/70 mt-0.5">{agreement.buyer_email}</p>
                          </div>
                        )}
                        {formatAddress(detail.buyer_address ?? null, detail.buyer_city ?? null, detail.buyer_state ?? null, detail.buyer_zip ?? null) && (
                          <div className="md:col-span-2">
                            <span className="text-white/30 text-[9px] uppercase tracking-wider">Address</span>
                            <p className="text-white/70 mt-0.5">
                              {formatAddress(detail.buyer_address ?? null, detail.buyer_city ?? null, detail.buyer_state ?? null, detail.buyer_zip ?? null)}
                            </p>
                          </div>
                        )}
                        {detail.buyer_license && (
                          <div>
                            <span className="text-white/30 text-[9px] uppercase tracking-wider">License / ID</span>
                            <p className="text-white/70 mt-0.5 font-mono uppercase">
                              {detail.buyer_license}
                              {detail.buyer_license_state && ` (${detail.buyer_license_state})`}
                            </p>
                          </div>
                        )}

                        {/* Co-Buyer Section */}
                        {detail.co_buyer_name && (
                          <>
                            <div className="md:col-span-4 border-t border-white/[0.04] pt-3 mt-1">
                              <span className="text-white/30 text-[9px] uppercase tracking-wider font-bold">Co-Buyer / Co-Renter</span>
                            </div>
                            <div>
                              <span className="text-white/30 text-[9px] uppercase tracking-wider">Name</span>
                              <p className="text-white/70 mt-0.5">{detail.co_buyer_name}</p>
                            </div>
                            {detail.co_buyer_phone && (
                              <div>
                                <span className="text-white/30 text-[9px] uppercase tracking-wider">Phone</span>
                                <p className="text-white/70 mt-0.5">{detail.co_buyer_phone}</p>
                              </div>
                            )}
                            {detail.co_buyer_email && (
                              <div>
                                <span className="text-white/30 text-[9px] uppercase tracking-wider">Email</span>
                                <p className="text-white/70 mt-0.5">{detail.co_buyer_email}</p>
                              </div>
                            )}
                            {formatAddress(detail.co_buyer_address ?? null, detail.co_buyer_city ?? null, detail.co_buyer_state ?? null, detail.co_buyer_zip ?? null) && (
                              <div>
                                <span className="text-white/30 text-[9px] uppercase tracking-wider">Address</span>
                                <p className="text-white/70 mt-0.5">
                                  {formatAddress(detail.co_buyer_address ?? null, detail.co_buyer_city ?? null, detail.co_buyer_state ?? null, detail.co_buyer_zip ?? null)}
                                </p>
                              </div>
                            )}
                            {detail.co_buyer_license && (
                              <div>
                                <span className="text-white/30 text-[9px] uppercase tracking-wider">License / ID</span>
                                <p className="text-white/70 mt-0.5 font-mono uppercase">
                                  {detail.co_buyer_license}
                                  {detail.co_buyer_license_state && ` (${detail.co_buyer_license_state})`}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-white/30 text-xs text-center py-2">No additional details available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ID Photo Modal */}
      {idPhotoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIdPhotoModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-tj-cream">Customer ID</h3>
                <p className="text-xs text-white/40">{idPhotoModal.name}</p>
              </div>
              <button onClick={() => setIdPhotoModal(null)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
              <img src={idPhotoModal.photo} alt={`${idPhotoModal.name} ID`} className="w-full object-contain max-h-[500px]" />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {docViewerData && (
        <DocumentViewerModal data={docViewerData} onClose={() => setDocViewerData(null)} />
      )}
    </div>
  );
}
