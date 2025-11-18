import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { ConditionalChatWidgets } from "@/components/ConditionalChatWidgets";
import { PowerHourOverlay } from "@/components/PowerHourOverlay";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className="overflow-x-hidden" lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Iconify CORS errors - icons may not load but page will work
              (function() {
                if (typeof window === 'undefined') return;
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.error = function() {
                  const msg = String(arguments[0] || '');
                  if (msg.includes('iconify') || msg.includes('CORS') || msg.includes('Access-Control-Allow-Origin') || msg.includes('api.iconify') || msg.includes('api.simplesvg') || msg.includes('api.unisvg')) {
                    return; // Suppress Iconify CORS errors
                  }
                  originalError.apply(console, arguments);
                };
                
                console.warn = function() {
                  const msg = String(arguments[0] || '');
                  if (msg.includes('iconify') || msg.includes('CORS') || msg.includes('Access-Control-Allow-Origin')) {
                    return; // Suppress Iconify CORS warnings
                  }
                  originalWarn.apply(console, arguments);
                };
                
                // Suppress unhandled promise rejections for Iconify
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = String(event.reason || '');
                  if (reason.includes('iconify') || reason.includes('CORS') || reason.includes('api.iconify')) {
                    event.preventDefault();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={clsx(
          "min-h-screen bg-finance-black text-white font-sans antialiased overflow-x-hidden w-full max-w-full",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <PowerHourOverlay />
          <div className="relative flex min-h-screen flex-col z-10 w-full max-w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 w-full max-w-full overflow-x-hidden">
              <div className="mx-auto flex w-full max-w-6xl flex-col">
                {children}
              </div>
            </main>
          </div>
          <ConditionalChatWidgets />
        </Providers>
      </body>
    </html>
  );
}
