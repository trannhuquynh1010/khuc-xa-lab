import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm Khúc xạ ánh sáng",
  description: "Nhập số liệu thí nghiệm và quan sát đồ thị khúc xạ ánh sáng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

