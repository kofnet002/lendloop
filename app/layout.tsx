import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Big_Shoulders, Big_Shoulders_Stencil, Instrument_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import "./globals.css";

const display = Big_Shoulders_Stencil({ variable: "--font-display", subsets: ["latin"] });
const numeric = Big_Shoulders({ variable: "--font-numeric", subsets: ["latin"] });
const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "LendLoop", template: "%s · LendLoop" },
  description: "Borrow what you need. Lend what you don't. A neighborhood tool-lending board.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${numeric.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider
          appearance={{ variables: { colorPrimary: "#1b2733", borderRadius: "0.5rem" } }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
