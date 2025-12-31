import type { Metadata } from "next";
import { Varela_Round, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const varelaRound = Varela_Round({
  variable: "--font-varela-round",
  subsets: ["latin", "hebrew"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CasaTrack - Property Management",
  description: "Track and manage your property search with CasaTrack",
  openGraph: {
    title: "CasaTrack - Property Management",
    description: "Track and manage your property search with CasaTrack",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CasaTrack - Property Management",
    description: "Track and manage your property search with CasaTrack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <html lang="en" className={varelaRound.variable}>
      <body
        className={`${varelaRound.variable} ${jetbrainsMono.variable} antialiased`}
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
