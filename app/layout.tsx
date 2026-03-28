import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Force dynamic rendering to prevent header access issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Trash2Treasure - T2T Telangana",
  description: "A smart waste-to-credit system that rewards users for responsible recycling",
};

/**
 * Global Clerk Appearance — overrides default Clerk branding across ALL components.
 * Uses the `appearance.elements` API for deep customization.
 */
const clerkAppearance = {
  // ── Variables: quick theming knobs ──
  variables: {
    colorPrimary: "#0D9488",           // Teal-600 (matches your eco brand)
    colorDanger: "#E11D48",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorText: "#1E293B",              // Slate-800
    colorTextSecondary: "#64748B",     // Slate-500
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F8FAFC",   // Slate-50
    colorInputText: "#1E293B",
    borderRadius: "0.75rem",           // rounded-xl
    fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    fontSize: "0.9375rem",
    spacingUnit: "1rem",
  },

  // ── Elements: surgical overrides on specific parts ──
  elements: {
    // Root card — generous padding for breathing room
    rootBox: "w-full",
    card: "shadow-2xl border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-xl p-6",
    
    // Header — extra bottom margin
    headerTitle: "text-2xl font-extrabold text-gray-900 tracking-tight mb-1",
    headerSubtitle: "text-sm text-gray-500 font-medium mb-6",
    
    // Social / OAuth buttons — taller with margin below
    socialButtonsBlockButton:
      "border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-gray-700 shadow-sm hover:shadow h-12 mb-2",
    socialButtonsBlockButtonText: "font-semibold text-sm",
    socialButtonsProviderIcon: "w-5 h-5",
    
    // Divider — vertical margins for separation
    dividerRow: "my-5",
    dividerLine: "bg-gray-200",
    dividerText: "text-gray-400 text-xs uppercase tracking-wider font-semibold px-3",
    
    // Form fields — spacing between label, input, and next field
    formFieldRow: "mb-4",
    formFieldLabel: "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block",
    formFieldInput:
      "rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 text-sm h-12",
    formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
    
    // Primary button — taller with top margin
    formButtonPrimary:
      "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200/50 hover:shadow-xl hover:shadow-teal-200/60 transition-all duration-300 h-12 text-sm tracking-wide hover:-translate-y-0.5 mt-4",
    
    // Secondary actions (links, alternative actions)
    footerActionLink: "text-teal-600 hover:text-teal-700 font-semibold",
    footerActionText: "text-gray-500 text-sm",
    
    // Success page / verification
    otpCodeFieldInput: "rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 h-12",
    
    // Alert / error boxes
    alert: "rounded-xl text-sm mb-4",
    alertText: "text-sm",
    
    // Identity preview (user's email/name shown after first step)
    identityPreview: "rounded-xl border-gray-200 bg-gray-50 mb-4",
    identityPreviewEditButton: "text-teal-600 hover:text-teal-700",
    
    // Hide the "Secured by Clerk" footer branding
    // Note: On the Free plan, this CSS hides it visually but Clerk may still render it.
    // On paid plans, you can set `afterSignInUrl` branding options to fully remove it.
    footer: "hidden",
    footerAction: "mt-6",
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
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={clerkAppearance}
        >
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
