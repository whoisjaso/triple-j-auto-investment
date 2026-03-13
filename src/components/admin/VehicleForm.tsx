"use client";

import { useActionState, useState, useRef } from "react";
import type { Vehicle } from "@/types/database";
import type { VehicleFormState } from "@/lib/actions/vehicles";
import PhotoCapture from "./PhotoCapture";

interface VehicleFormProps {
  vehicle?: Vehicle;
  action: (
    prevState: VehicleFormState,
    formData: FormData
  ) => Promise<VehicleFormState>;
}

export default function VehicleForm({ vehicle, action }: VehicleFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeSuccess, setDecodeSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleDecode = async () => {
    const form = formRef.current;
    if (!form) return;
    const vinInput = form.elements.namedItem("vin") as HTMLInputElement;
    const vin = vinInput?.value.trim().toUpperCase();

    if (!vin || vin.length !== 17) {
      setDecodeError("Enter a valid 17-character VIN.");
      setDecodeSuccess(false);
      return;
    }

    setDecoding(true);
    setDecodeError(null);
    setDecodeSuccess(false);

    try {
      const res = await fetch(
        `/api/vin-decode?vin=${encodeURIComponent(vin)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setDecodeError(data.error || "VIN decode failed.");
        return;
      }

      const fields: Record<string, string> = {
        make: data.make || "",
        model: data.model || "",
        year: data.year?.toString() || "",
        engine: data.engine || "",
        transmission: data.transmission || "",
        drivetrain: data.drivetrain || "",
        bodyStyle: data.bodyStyle || "",
        fuelType: data.fuelType || "",
      };

      for (const [name, value] of Object.entries(fields)) {
        const input = form.elements.namedItem(name) as HTMLInputElement;
        if (input && value) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
          )?.set;
          setter?.call(input, value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }

      setDecodeSuccess(true);
    } catch {
      setDecodeError("Failed to decode VIN. Try again.");
    } finally {
      setDecoding(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-tj-cream/90 placeholder:text-white/15 focus:border-tj-gold/30 focus:bg-white/[0.05] focus:outline-none transition-all duration-300 min-h-[44px] text-sm";
  const labelClass =
    "block text-[10px] font-accent text-white/30 uppercase tracking-[0.15em] mb-1.5";
  const sectionClass =
    "font-serif text-sm text-tj-cream/70 tracking-wide mb-3 mt-8 first:mt-0";

  return (
    <form ref={formRef} action={formAction} className="space-y-5 max-w-2xl">
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}

      {state.error && (
        <div
          className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3"
          role="alert"
        >
          <p className="text-red-400/80 text-sm">{state.error}</p>
        </div>
      )}

      {/* Photos — front and center, Instagram-style */}
      <p className={sectionClass}>Photos</p>
      <PhotoCapture
        initialPhotos={vehicle?.gallery}
        coverPhoto={vehicle?.imageUrl}
      />

      {/* VIN Section */}
      <p className={sectionClass}>VIN Lookup</p>
      <div>
        <label htmlFor="vin" className={labelClass}>
          VIN
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="vin"
            name="vin"
            defaultValue={vehicle?.vin || ""}
            maxLength={17}
            className={`${inputClass} flex-1 uppercase`}
            placeholder="17-character VIN"
          />
          <button
            type="button"
            onClick={handleDecode}
            disabled={decoding}
            className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/70 text-[10px] font-accent uppercase tracking-[0.1em] rounded-xl border border-white/[0.06] transition-all duration-300 min-h-[44px] whitespace-nowrap disabled:opacity-40"
          >
            {decoding ? "Decoding\u2026" : "Decode VIN"}
          </button>
        </div>
        {decodeError && (
          <p className="text-red-400/70 text-xs mt-1.5">{decodeError}</p>
        )}
        {decodeSuccess && (
          <p className="text-emerald-400/70 text-xs mt-1.5">
            VIN decoded \u2014 fields auto-filled.
          </p>
        )}
      </div>

      {/* Basic Info */}
      <p className={sectionClass}>Basic Information</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="make" className={labelClass}>
            Make <span className="text-red-400/60">*</span>
          </label>
          <input
            type="text"
            id="make"
            name="make"
            defaultValue={vehicle?.make || ""}
            required
            className={inputClass}
            placeholder="e.g. Toyota"
          />
        </div>
        <div>
          <label htmlFor="model" className={labelClass}>
            Model <span className="text-red-400/60">*</span>
          </label>
          <input
            type="text"
            id="model"
            name="model"
            defaultValue={vehicle?.model || ""}
            required
            className={inputClass}
            placeholder="e.g. Camry SE"
          />
        </div>
        <div>
          <label htmlFor="year" className={labelClass}>
            Year <span className="text-red-400/60">*</span>
          </label>
          <input
            type="number"
            id="year"
            name="year"
            defaultValue={vehicle?.year || ""}
            min={1900}
            max={2030}
            required
            className={inputClass}
            placeholder="e.g. 2019"
          />
        </div>
        <div>
          <label htmlFor="price" className={labelClass}>
            Price <span className="text-red-400/60">*</span>
          </label>
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm"
              aria-hidden="true"
            >
              $
            </span>
            <input
              type="number"
              id="price"
              name="price"
              defaultValue={vehicle?.price || ""}
              min={0}
              step={100}
              required
              className={`${inputClass} pl-7`}
              placeholder="e.g. 6995"
            />
          </div>
        </div>
        <div>
          <label htmlFor="mileage" className={labelClass}>
            Mileage
          </label>
          <input
            type="number"
            id="mileage"
            name="mileage"
            defaultValue={vehicle?.mileage || ""}
            min={0}
            className={inputClass}
            placeholder="e.g. 89432"
          />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={vehicle?.status || "Available"}
            className={inputClass}
          >
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Specs */}
      <p className={sectionClass}>Specifications</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="engine" className={labelClass}>
            Engine
          </label>
          <input
            type="text"
            id="engine"
            name="engine"
            defaultValue={vehicle?.engine || ""}
            className={inputClass}
            placeholder="e.g. 2.5L 4-Cylinder"
          />
        </div>
        <div>
          <label htmlFor="transmission" className={labelClass}>
            Transmission
          </label>
          <input
            type="text"
            id="transmission"
            name="transmission"
            defaultValue={vehicle?.transmission || ""}
            className={inputClass}
            placeholder="e.g. Automatic"
          />
        </div>
        <div>
          <label htmlFor="drivetrain" className={labelClass}>
            Drivetrain
          </label>
          <input
            type="text"
            id="drivetrain"
            name="drivetrain"
            defaultValue={vehicle?.drivetrain || ""}
            className={inputClass}
            placeholder="e.g. FWD"
          />
        </div>
        <div>
          <label htmlFor="bodyStyle" className={labelClass}>
            Body Style
          </label>
          <input
            type="text"
            id="bodyStyle"
            name="bodyStyle"
            defaultValue={vehicle?.bodyStyle || ""}
            className={inputClass}
            placeholder="e.g. Sedan"
          />
        </div>
        <div>
          <label htmlFor="fuelType" className={labelClass}>
            Fuel Type
          </label>
          <input
            type="text"
            id="fuelType"
            name="fuelType"
            defaultValue={vehicle?.fuelType || ""}
            className={inputClass}
            placeholder="e.g. Gasoline"
          />
        </div>
        <div>
          <label htmlFor="exteriorColor" className={labelClass}>
            Exterior Color
          </label>
          <input
            type="text"
            id="exteriorColor"
            name="exteriorColor"
            defaultValue={vehicle?.exteriorColor || ""}
            className={inputClass}
            placeholder="e.g. Silver"
          />
        </div>
        <div>
          <label htmlFor="interiorColor" className={labelClass}>
            Interior Color
          </label>
          <input
            type="text"
            id="interiorColor"
            name="interiorColor"
            defaultValue={vehicle?.interiorColor || ""}
            className={inputClass}
            placeholder="e.g. Black"
          />
        </div>
      </div>

      {/* Buyer Information */}
      <p className={sectionClass}>Buyer Information</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="buyerName" className={labelClass}>
            Buyer Name
          </label>
          <input
            type="text"
            id="buyerName"
            name="buyerName"
            defaultValue={vehicle?.buyerName || ""}
            className={inputClass}
            placeholder="Full name"
          />
        </div>
        <div>
          <label htmlFor="buyerPhone" className={labelClass}>
            Buyer Phone
          </label>
          <input
            type="tel"
            id="buyerPhone"
            name="buyerPhone"
            defaultValue={vehicle?.buyerPhone || ""}
            className={inputClass}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      {/* Description */}
      <p className={sectionClass}>Description</p>
      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={vehicle?.description || ""}
          rows={4}
          className={`${inputClass} min-h-[100px]`}
          placeholder="Vehicle description..."
        />
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-tj-gold/90 to-tj-gold-light/90 hover:from-tj-gold hover:to-tj-gold-light text-black font-accent text-xs uppercase tracking-[0.15em] rounded-xl min-h-[48px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Saving\u2026"
            : vehicle
              ? "Save Changes"
              : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
