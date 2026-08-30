import Link from "next/link";
import StudentWorkspace from "./StudentWorkspace";

export default function Home() {
  return (
    <main className="page-shell">
      <StudentWorkspace />
      <footer>
        <Link href="/giao-vien">Giáo viên →</Link>
      </footer>
    </main>
  );
}
