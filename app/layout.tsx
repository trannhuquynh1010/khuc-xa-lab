import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm số Vật lí",
  description: "Nhập số liệu, quan sát đồ thị và nộp kết quả thí nghiệm Vật lí.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
