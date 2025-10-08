import "./globals.css";
import { Cantarell } from "@/lib/fonts";
import { type ReactNode, Suspense } from "react";

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
