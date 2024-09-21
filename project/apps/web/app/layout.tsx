"use client";
import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

import AsyncLayoutDynamic from "@/containers/async-layout-dynamic";

export const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "h-full bg-[url('/graph-paper.svg')] bg-repeat font-mono antialiased",
          fontSans.variable,
        )}
      >
         <div className="bg-[#ffffffd6] min-h-screen flex flex-col justify-between">
          <AsyncLayoutDynamic>
          {children}
          </AsyncLayoutDynamic>
          </div>
      </body>
    </html>
  );
}
