import Link from "next/link";
import StudentWorkspace from "./StudentWorkspace";

export default function Home() {
  return (
    <main className="page-shell">
      <StudentWorkspace />
      <footer>
        <Link href="/giao-vien">Dành cho giáo viên</Link>
      </footer>
    </main>
  );
}
