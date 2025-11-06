import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Force dynamic rendering to prevent header access issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Trash2Treasure - T2T Telangana",
  description: "A smart waste-to-credit system that rewards users for responsible recycling",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-slate-50">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
