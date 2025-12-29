import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";

export const metadata = {
  title: "Alert Aggregator | No-Code Usage Monitoring",
  description: "Monitor your no-code platform usage across Zapier, Make.com, Airtable, and Bubble. Predict overages before they happen.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
