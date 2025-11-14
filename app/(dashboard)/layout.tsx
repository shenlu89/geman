import { type ReactNode, Suspense } from "react";

import Header from "@/components/header";
import { Footer } from "@/components/footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex relative flex-col items-center flex-1 m-auto w-full max-w-6xl p-4">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
      <Footer />
    </>
  );
}
