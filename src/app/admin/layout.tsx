import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin | Triple J Auto Investment",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <AdminSidebar />
      <main className="md:ml-60 min-h-screen pb-24 md:pb-0">{children}</main>
    </div>
  );
}
