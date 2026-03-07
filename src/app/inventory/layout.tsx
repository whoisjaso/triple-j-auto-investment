import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
  description:
    "Browse our collection of quality pre-owned vehicles. Toyota, Honda, Nissan, Ford, Chevrolet, and more. Financing available. Triple J Auto Investment, Houston TX.",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
