import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import { UserProvider } from "@/contexts/user-context";
import { Providers } from "@/components/providers";
import { AdaptiveHeader } from "@/components/shared";
import { FeedbackButtonWrapper } from "@/components/feedback/feedback-button-wrapper";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "פולס - פלטפורמת סקרים דמוקרטית",
  description: "פלטפורמת סקרים משתתפת למעורבות דמוקרטית",
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
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
