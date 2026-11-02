import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Placement Management System (CPMS)",
  description:
    "Centralized portal for student placement drives, eligibility tracking, application management, and recruitment administration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
