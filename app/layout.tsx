import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Natural Science - Physics 9 | Lawrence S. Ting School",
  description: "Phòng thí nghiệm số môn Natural Science - Physics 9 của Ms. Quỳnh tại Lawrence S. Ting School.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
