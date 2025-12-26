import type { Metadata } from "next";
import { Assistant, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CasaTrack - Property Management",
  description: "Track and manage your property search with CasaTrack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <html lang="en">
      <body
        className={`${assistant.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Script
          id="google-maps-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `function initMap(){console.log('Google Maps API loaded successfully');window.googleMapsLoaded=true;window.dispatchEvent(new Event('google-maps-loaded'));}`,
          }}
        />
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&language=he&loading=async&callback=initMap`}
            strategy="beforeInteractive"
          />
        )}
        {children}
      </body>
    </html>
  );
}
