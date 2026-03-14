import type { Metadata, Viewport } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin | Triple J Auto Investment",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] md:min-h-screen max-md:h-[100dvh] max-md:overflow-hidden max-md:flex max-md:flex-col">
      <AdminSidebar />
      <main className="md:ml-60 min-h-screen md:pb-0 max-md:flex-1 max-md:overflow-y-auto max-md:pb-16 max-md:min-h-0">{children}</main>
    </div>
  );
}
