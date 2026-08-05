import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PwaRegister from "./components/PwaRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Roberts Auto Rental",
    template: "%s | Roberts Auto Rental",
  },
  description:
    "Roberts Auto Rental sales representative app for bookings, inspections, payments, signatures, check-out, and check-in.",
  applicationName: "Roberts Rep",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/roberts-rep-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/roberts-rep-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/roberts-rep-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Roberts Rep",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07111f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
