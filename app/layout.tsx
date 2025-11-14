import "./globals.css";
import { type ReactNode, Suspense } from "react";
import { Outfit, Roboto_Mono } from "next/font/google";
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${robotoMono.variable} font-sans antialiased h-screen flex flex-col bg-gray-50`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
