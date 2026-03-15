"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw, Eye, X } from "lucide-react";

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
  completed_link: string | null;
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

export default function AgreementTracker() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [idPhotoModal, setIdPhotoModal] = useState<{ photo: string; name: string } | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);

  const fetchIdPhoto = async (agreementId: string, buyerName: string) => {
    setLoadingPhoto(agreementId);
    try {
      const res = await fetch(`/api/documents/agreements/${agreementId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.buyer_id_photo) {
        setIdPhotoModal({ photo: data.buyer_id_photo, name: buyerName || "Customer" });
      } else {
        alert("No ID photo available for this agreement.");
      }
    } catch {
      alert("Failed to load ID photo.");
    } finally {
      setLoadingPhoto(null);
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
          {filtered.map((agreement) => (
            <div
              key={agreement.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.04] transition-all"
            >
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
                {agreement.completed_link && (
                  <a
                    href={agreement.completed_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-white/30 hover:text-tj-gold hover:bg-white/[0.03] transition-all"
                    title="View completed document"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
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
              <div className="flex flex-wrap gap-2">
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
            </div>
          ))}
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
    </div>
  );
}
