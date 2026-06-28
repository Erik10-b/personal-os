import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal OS",
  description: "Privater Organizer für Finanzielles, Erik, Termine, Arbeit/Master und Fußball",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
