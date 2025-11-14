import { type ReactNode, Suspense } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex relative flex-col items-center flex-1 m-auto w-full max-w-6xl p-4">
      <Suspense fallback={null}>{children}</Suspense>
    </main>
  );
}
