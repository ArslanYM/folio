import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/motion-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WarpBackground } from "@/components/warp-background";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0E0D0B",
};

export const metadata: Metadata = {
  title: {
    default: "Swatchbook — Website to DESIGN.md",
    template: "%s | Swatchbook",
  },
  description:
    "Turn any website or screenshot into a DESIGN.md design-system spec ready for AI coding tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${GeistSans.variable} ${GeistMono.variable} dark h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-canvas text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <WarpBackground />
        <MotionProvider>
          <TooltipProvider>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <SiteFooter />
          </TooltipProvider>
        </MotionProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          containerAriaLabel="Notifications"
          toastOptions={{
            style: {
              background: "#17150F",
              border: "1px solid #2E2A21",
              color: "#F2EDE2",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
