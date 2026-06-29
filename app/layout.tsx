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
  description: "Gamified waste management platform that rewards users for responsible recycling. Join Telangana's green revolution and turn your trash into treasure!",
  keywords: [
    "recycling rewards",
    "waste management app",
    "eco rewards",
    "trash to treasure",
    "recycling",
    "waste management",
    "sustainability",
    "environment",
    "eco",
    "Telangana recycling",
    "Trash2Treasure"
  ],
  authors: [{ name: "Trash2Treasure Team", url: "https://trash2treasure.co.in" }],
  creator: "Trash2Treasure",
  publisher: "Trash2Treasure",
  applicationName: "Trash2Treasure",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    description: "Gamified waste management platform that rewards users for responsible recycling. Join Telangana's green revolution!",
    siteName: "Trash2Treasure",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Trash2Treasure - Turn Your Trash Into Treasure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trash2Treasure | Gamified Waste Management",
    description: "Gamified waste management platform that rewards users for responsible recycling.",
    images: ["/twitter-image"],
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
