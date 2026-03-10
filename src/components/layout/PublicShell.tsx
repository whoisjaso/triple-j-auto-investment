"use client";

import { usePathname } from "next/navigation";
import SmoothScrollProvider from "@/components/scroll/SmoothScrollProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <SmoothScrollProvider>
      <Navbar />
      {children}
      <Footer />
    </SmoothScrollProvider>
  );
}
