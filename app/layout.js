import "./globals.css";

export const metadata = {
  title: "4-Day Week Finder",
  description:
    "Aggregated search for 4-day work week, remote, and part-time jobs.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "4-Day Finder",
  },
};

export const viewport = {
  themeColor: "#020617",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
