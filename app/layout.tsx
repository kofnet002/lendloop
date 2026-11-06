import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Lexend } from "next/font/google";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import "./globals.css";

const sans = Lexend({ variable: "--font-lexend", subsets: ["latin"] });
const numeric = Big_Shoulders({ variable: "--font-numeric", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "LendLoop · Borrow, use, return", template: "%s · LendLoop" },
  description:
    "Your neighborhood tool-lending board. Borrow what you need, lend what you don't, and let the reminders do the nagging.",
  applicationName: "LendLoop",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f2b47" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1a2b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${numeric.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: "#0f2b47", borderRadius: "0.6rem", fontFamily: "inherit" },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
