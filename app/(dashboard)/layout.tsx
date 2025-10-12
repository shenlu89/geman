import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/app/actions/auth";
import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
