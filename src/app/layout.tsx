import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argumentation B2 - Professeur IA",
  description: "Mentor interactif pour s'entraîner à l'argumentation de niveau B2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
