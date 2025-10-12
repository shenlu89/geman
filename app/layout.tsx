import "./globals.css";
import { type ReactNode, Suspense } from "react";
import { Cantarell } from "@/lib/fonts";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`flex flex-col bg-slate-50 h-screen ${Cantarell.className}`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
