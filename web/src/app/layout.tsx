import "./globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';

export const metadata = {
  title: "expo-kafka-location",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
