import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { UserProvider } from "@/contexts/user-context";
import { Providers } from "@/components/providers";
import { AdaptiveHeader } from "@/components/shared";
import { FeedbackButtonWrapper } from "@/components/feedback/feedback-button-wrapper";
import "./theme-utilities.css";
import "./globals.css";

// import "./theme-variables.css";  // Original purple
// import "./theme-blue-foundation-standard.css";
// import "./theme-blue-foundation-brand.css";
// import "./theme-vibrant-spectrum-standard.css";
// import "./theme-vibrant-spectrum-brand.css";
// import "./theme-cyan-centric-standard.css";
 import "./theme-cyan-centric-brand.css";
// import "./theme-natural-gradient-standard.css";
// import "./theme-natural-gradient-brand.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "נקודות חיבור",
  description: "דיונים  ציבוריים שמובילים לפתרונות",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "נקודות חיבור",
    description: "דיונים  ציבוריים שמובילים לפתרונות",
    type: "website",
    locale: "he_IL",
  },
  twitter: {
    card: "summary_large_image",
    title: "נקודות חיבור",
    description: "דיונים  ציבוריים שמובילים לפתרונות",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={heIL}>
      <html lang="he" dir="rtl" suppressHydrationWarning>
        <body
          className={`${rubik.variable} antialiased`}
        >
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider>
              <AdaptiveHeader />
              {children}
              <FeedbackButtonWrapper />
            </UserProvider>
            <Analytics />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
