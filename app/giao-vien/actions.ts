"use server";

import { createTeacherSession, destroyTeacherSession, isCorrectTeacherPassword, isTeacherAuthenticated } from "@/lib/auth";
import { isActivityKey } from "@/lib/activities";
import { setActivityOpen } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

export async function toggleActivity(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  const key = formData.get("activityKey");
  if (!isActivityKey(key)) return;
  await setActivityOpen(key, formData.get("nextOpen") === "true");
  revalidatePath("/");
  revalidatePath("/giao-vien");
}
