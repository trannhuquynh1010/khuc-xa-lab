import LabForm from "./LabForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">THÍ NGHIỆM VẬT LÍ</p>
        <h1>Khúc xạ ánh sáng</h1>
        <p>Nhập kết quả đo của nhóm và quan sát mối liên hệ giữa các đại lượng.</p>
      </header>
      <LabForm />
      <footer>
        <Link href="/giao-vien">Dành cho giáo viên</Link>
      </footer>
    </main>
  );
}
