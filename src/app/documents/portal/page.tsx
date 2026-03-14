import type { Metadata } from "next";
import CustomerPortalClient from "./CustomerPortalClient";

export const metadata: Metadata = {
  title: "Document Portal | Triple J Auto Investment",
  robots: "noindex, nofollow",
};

export default function CustomerPortalPage() {
  return <CustomerPortalClient />;
}
