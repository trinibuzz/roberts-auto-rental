import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Roberts Auto Rental - Rep App",
    short_name: "Roberts Rep",
    description:
      "Sales representative app for Roberts Auto Rental bookings, inspections, payments, signatures, check-out, and check-in.",
    start_url: "/rep",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#07111f",
    icons: [
      {
        src: "/icons/roberts-rep-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/roberts-rep-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/roberts-rep-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
