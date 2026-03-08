import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Triple J Auto Investment",
  description:
    "Get in touch with Triple J Auto Investment in Houston, TX. Call (832) 400-9760 or fill out our contact form. We're here to help you find your next vehicle.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
