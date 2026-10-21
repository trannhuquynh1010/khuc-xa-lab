import { isTeacherAuthenticated } from "@/lib/auth";
import OpticsAiReview from "@/app/OpticsAiReview";
import Link from "next/link";

export default async function OpticsAiPreviewPage() {
  if (process.env.NODE_ENV === "production" && !await isTeacherAuthenticated()) return <main className="teacher-shell"><h1>Xem thử bài Ôn tập Quang học giữa kì 1</h1><Link href="/giao-vien">Đăng nhập giáo viên để xem thử</Link></main>;
  return <main className="teacher-shell"><Link href="/giao-vien?tab=optics-ai-review">← Bảng giáo viên</Link><OpticsAiReview preview /></main>;
}
