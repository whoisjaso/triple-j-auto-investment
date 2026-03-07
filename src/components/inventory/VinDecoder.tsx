"use client";

import { useState } from "react";

interface DecodedVehicle {
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  bodyStyle: string | null;
  vehicleType: string | null;
  doors: number | null;
  drivetrain: string | null;
  transmission: string | null;
  fuelType: string | null;
  engine: string | null;
  engineHP: number | null;
  turbo: boolean;
  manufacturer: string | null;
  plantCountry: string | null;
  errorCode: string;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5 border-b border-white/[0.04]">
      <dt className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-tj-cream/80">{value}</dd>
    </div>
  );
}

export default function VinDecoder({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const [vin, setVin] = useState("");
  const [result, setResult] = useState<DecodedVehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(alwaysOpen);

  const isValid = VIN_REGEX.test(vin);

  const handleDecode = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/vin-decode?vin=${encodeURIComponent(vin.toUpperCase())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to decode VIN");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !loading) {
      handleDecode();
    }
  };

  return (
    <div className={alwaysOpen ? "" : "border border-white/[0.06] rounded-sm bg-white/[0.02]"}>
      {/* Toggle header — hidden when alwaysOpen */}
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 md:px-5 min-h-[52px] text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-tj-gold/50"
            >
              <rect x="2" y="6" width="20" height="12" rx="1" />
              <path d="M6 10h2M10 10h4M16 10h2M6 14h12" />
            </svg>
            <span className="font-accent text-[11px] uppercase tracking-[0.25em] text-tj-cream/60">
              VIN Decoder
            </span>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Decoder content */}
      {open && (
        <div className={alwaysOpen ? "" : "border-t border-white/[0.04] p-4 md:p-5"}>
          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block font-accent text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1.5">
                Vehicle Identification Number
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => {
                  const v = e.target.value
                    .replace(/[^A-HJ-NPR-Za-hj-npr-z0-9]/g, "")
                    .slice(0, 17);
                  setVin(v.toUpperCase());
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter 17-character VIN"
                maxLength={17}
                className="w-full bg-transparent border-b border-white/10 focus:border-tj-gold/30 text-tj-cream text-sm font-mono tracking-wider pb-1.5 outline-none placeholder:text-white/15 transition-colors min-h-[44px]"
              />
              {vin.length > 0 && vin.length < 17 && (
                <p className="mt-1 font-accent text-[9px] text-white/20">
                  {17 - vin.length} characters remaining
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDecode}
              disabled={!isValid || loading}
              className="self-end px-6 py-2 min-h-[44px] border border-tj-gold/30 text-tj-gold/80 font-accent text-[10px] uppercase tracking-[0.25em] rounded-sm transition-all duration-300 hover:bg-tj-gold/10 hover:border-tj-gold/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-tj-gold/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="31.4"
                      strokeDashoffset="10"
                    />
                  </svg>
                  Decoding
                </span>
              ) : (
                "Decode"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 border border-red-500/20 rounded-sm bg-red-500/5">
              <p className="font-accent text-[10px] uppercase tracking-[0.15em] text-red-400/80">
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6">
              {/* Vehicle title */}
              <div className="mb-4 pb-4 border-b border-white/[0.06]">
                <h3 className="font-serif text-xl md:text-2xl text-tj-cream">
                  {result.year} {result.make} {result.model}
                </h3>
                {result.manufacturer && (
                  <p className="mt-1 font-accent text-[10px] uppercase tracking-[0.2em] text-white/30">
                    by {result.manufacturer}
                  </p>
                )}
                {result.errorCode &&
                  result.errorCode !== "0" &&
                  !result.errorCode.startsWith("0") && (
                    <p className="mt-2 font-accent text-[9px] text-tj-gold/50">
                      Note: Some data may be incomplete for this VIN
                    </p>
                  )}
              </div>

              {/* Specs grid */}
              <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6">
                {result.bodyStyle && (
                  <SpecItem label="Body Style" value={result.bodyStyle} />
                )}
                {result.engine && (
                  <SpecItem label="Engine" value={result.engine} />
                )}
                {result.engineHP && (
                  <SpecItem
                    label="Horsepower"
                    value={`${result.engineHP} HP`}
                  />
                )}
                {result.transmission && (
                  <SpecItem
                    label="Transmission"
                    value={result.transmission}
                  />
                )}
                {result.drivetrain && (
                  <SpecItem label="Drivetrain" value={result.drivetrain} />
                )}
                {result.fuelType && (
                  <SpecItem label="Fuel Type" value={result.fuelType} />
                )}
                {result.doors && (
                  <SpecItem label="Doors" value={result.doors.toString()} />
                )}
                {result.turbo && <SpecItem label="Turbo" value="Yes" />}
                {result.plantCountry && (
                  <SpecItem label="Made In" value={result.plantCountry} />
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
