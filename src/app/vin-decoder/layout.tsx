import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIN Decoder",
  description:
    "Look up any vehicle by VIN. Instantly decode make, model, year, engine, transmission, and more using the official NHTSA database. Triple J Auto Investment, Houston TX.",
};

export default function VinDecoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
