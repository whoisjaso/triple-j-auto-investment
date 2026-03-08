import type { Vehicle } from "@/types/database";

const formatMileage = (mileage: number) =>
  new Intl.NumberFormat("en-US").format(mileage);

export default function VehicleSpecs({ vehicle }: { vehicle: Vehicle }) {
  const specs: { label: string; value: string; mono?: boolean }[] = [];

  if (vehicle.bodyStyle) specs.push({ label: "Body Style", value: vehicle.bodyStyle });
  if (vehicle.exteriorColor) specs.push({ label: "Exterior Color", value: vehicle.exteriorColor });
  if (vehicle.interiorColor) specs.push({ label: "Interior Color", value: vehicle.interiorColor });
  if (vehicle.engine) specs.push({ label: "Engine", value: vehicle.engine });
  if (vehicle.transmission) specs.push({ label: "Transmission", value: vehicle.transmission });
  if (vehicle.drivetrain) specs.push({ label: "Drivetrain", value: vehicle.drivetrain });
  if (vehicle.fuelType) specs.push({ label: "Fuel Type", value: vehicle.fuelType });
  specs.push({ label: "Mileage", value: `${formatMileage(vehicle.mileage)} miles` });
  specs.push({ label: "VIN", value: vehicle.vin, mono: true });

  return (
    <div>
      <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
        Specifications
      </h2>
      <dl className="grid grid-cols-2 gap-x-6">
        {specs.map((spec) => (
          <div key={spec.label} className="py-2.5 border-b border-white/[0.04]">
            <dt className="font-accent text-[9px] uppercase tracking-[0.2em] text-white/25">
              {spec.label}
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
