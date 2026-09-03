"use server";

import { createTeacherSession, destroyTeacherSession, isCorrectTeacherPassword, isTeacherAuthenticated } from "@/lib/auth";
import { isActivityKey } from "@/lib/activities";
import { isRefractionQuizClassName } from "@/lib/classes";
import { resetSchoolYearData, setActivityOpen, setPrismColorOpen, setRefractionApplicationOpen, setRefractionConstructionOpen, setRefractionQuizScoresReleased } from "@/lib/db";
import { isSchoolYear } from "@/lib/school-years";
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

export async function toggleRefractionConstruction(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setRefractionConstructionOpen(formData.get("nextOpen") === "true");
  revalidatePath("/");
  revalidatePath("/giao-vien");
}

export async function toggleRefractionApplication(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setRefractionApplicationOpen(formData.get("nextOpen") === "true");
  revalidatePath("/");
  revalidatePath("/giao-vien");
}

export async function togglePrismColor(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setPrismColorOpen(formData.get("nextOpen") === "true");
  revalidatePath("/");
  revalidatePath("/giao-vien");
}

export async function toggleRefractionQuizScores(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  const schoolYear = formData.get("schoolYear");
  const className = formData.get("className");
  if (!isSchoolYear(schoolYear) || !isRefractionQuizClassName(className)) return;

  await setRefractionQuizScoresReleased(schoolYear, className, formData.get("nextReleased") === "true");
  revalidatePath("/giao-vien");
}

export async function resetYearData(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");
  const schoolYear = formData.get("schoolYear");
  if (!isSchoolYear(schoolYear)) return;

  await resetSchoolYearData(schoolYear);
  revalidatePath("/giao-vien");
  revalidatePath("/giao-vien/trinh-chieu", "layout");
}
