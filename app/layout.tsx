import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Force dynamic rendering to prevent header access issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  metadataBase: new URL("https://trash2treasure.co.in"),
  title: {
    default: "Trash2Treasure | Gamified Waste Management & Recycling Rewards",
    template: "%s | Trash2Treasure",
  },
  description: "Gamified waste management platform that rewards users for responsible recycling.",
  keywords: ["recycling", "waste management", "sustainability", "environment", "eco", "Trash2Treasure"],
  authors: [{ name: "Trash2Treasure Team" }],
  creator: "Trash2Treasure",
  publisher: "Trash2Treasure",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trash2treasure.co.in",
    title: "Trash2Treasure | Gamified Waste Management",
    description: "Gamified waste management platform that rewards users for responsible recycling.",
    siteName: "Trash2Treasure",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Trash2Treasure - Turn Your Trash Into Treasure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trash2Treasure | Gamified Waste Management",
    description: "Gamified waste management platform that rewards users for responsible recycling.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load Inter font for premium typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-50" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
