import { useTranslations } from "next-intl";
import type { Vehicle } from "@/types/database";

const formatMileage = (mileage: number) =>
  new Intl.NumberFormat("en-US").format(mileage);

export default function VehicleSpecs({ vehicle }: { vehicle: Vehicle }) {
  const t = useTranslations("vehicle");

  const specs: { labelKey: string; value: string; mono?: boolean }[] = [];

  if (vehicle.bodyStyle) specs.push({ labelKey: "bodyStyle", value: vehicle.bodyStyle });
  if (vehicle.exteriorColor) specs.push({ labelKey: "exteriorColor", value: vehicle.exteriorColor });
  if (vehicle.interiorColor) specs.push({ labelKey: "interiorColor", value: vehicle.interiorColor });
  if (vehicle.engine) specs.push({ labelKey: "engine", value: vehicle.engine });
  if (vehicle.transmission) specs.push({ labelKey: "transmission", value: vehicle.transmission });
  if (vehicle.drivetrain) specs.push({ labelKey: "drivetrain", value: vehicle.drivetrain });
  if (vehicle.fuelType) specs.push({ labelKey: "fuelType", value: vehicle.fuelType });
  specs.push({ labelKey: "mileage", value: `${formatMileage(vehicle.mileage)} ${t("miles")}` });
  specs.push({ labelKey: "vin", value: vehicle.vin, mono: true });

  return (
    <div>
      <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
        {t("specifications")}
      </h2>
      <dl className="grid grid-cols-2 gap-x-6">
        {specs.map((spec) => (
          <div key={spec.labelKey} className="py-2.5 border-b border-white/[0.04]">
            <dt className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25">
              {t(spec.labelKey)}
            </dt>
            <dd
              className={`mt-0.5 text-sm text-tj-cream/80 ${spec.mono ? "font-mono tracking-wider text-xs" : ""}`}
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
