"use server";

import { createTeacherSession, destroyTeacherSession, isCorrectTeacherPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!isCorrectTeacherPassword(password)) redirect("/giao-vien?error=1");
  await createTeacherSession();
  redirect("/giao-vien");
}

export async function logout() {
  await destroyTeacherSession();
  redirect("/giao-vien");
}

