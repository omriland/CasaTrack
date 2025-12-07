import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Space_Grotesk, Assistant } from "next/font/google";
import "./globals.css";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
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
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function initMap() {
                console.log('Google Maps API loaded successfully');
                window.googleMapsLoaded = true;
                window.dispatchEvent(new Event('google-maps-loaded'));
              }
            `,
          }}
        />
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=he&callback=initMap`}
        ></script>
      </head>
      <body
        className={`${outfitSans.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${assistant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
