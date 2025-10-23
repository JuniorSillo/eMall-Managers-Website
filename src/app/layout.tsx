import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eMall Manager",
  description: "Shop and Mall Management System",
  viewport: "width=device-width, initial-scale=1.0", // Fixes mobile scaling/zoom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* Optional: Manual <head> for more control (uncomment if metadata doesn't suffice) */}
        {/* <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head> */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}