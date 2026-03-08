import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financing | Triple J Auto Investment",
  description:
    "Flexible Buy Here Pay Here financing at Triple J Auto Investment. No credit check required, flexible down payments, in-house financing. Houston, TX.",
};

export default function FinancingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
