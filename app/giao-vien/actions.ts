"use server";

import { createTeacherSession, destroyTeacherSession, isCorrectTeacherPassword, isTeacherAuthenticated } from "@/lib/auth";
import { isActivityKey } from "@/lib/activities";
import { isClassName, isRefractionQuizClassName } from "@/lib/classes";
import { forceSubmitPracticeClass, resetSchoolYearData, setActivityOpen, setCurrentVoltagePracticeOpen, setOhmsLawPracticeOpen, setPracticeScoresReleased, setPrismColorOpen, setRefractionApplicationOpen, setRefractionConstructionOpen, setRefractionQuizScoresReleased, setResistanceFactorsPracticeOpen, setResistivityOpen } from "@/lib/db";
import { isPracticeKey } from "@/lib/practice-attempt-types";
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
}

export async function toggleRefractionConstruction(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setRefractionConstructionOpen(formData.get("nextOpen") === "true");
}

export async function toggleRefractionApplication(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setRefractionApplicationOpen(formData.get("nextOpen") === "true");
}

export async function togglePrismColor(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setPrismColorOpen(formData.get("nextOpen") === "true");
}

export async function toggleCurrentVoltagePractice(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setCurrentVoltagePracticeOpen(formData.get("nextOpen") === "true");
}

export async function toggleOhmsLawPractice(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setOhmsLawPracticeOpen(formData.get("nextOpen") === "true");
}

export async function toggleResistivity(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setResistivityOpen(formData.get("nextOpen") === "true");
}

export async function toggleResistanceFactorsPractice(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  await setResistanceFactorsPracticeOpen(formData.get("nextOpen") === "true");
}

export async function toggleRefractionQuizScores(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  const schoolYear = formData.get("schoolYear");
  const className = formData.get("className");
  if (!isSchoolYear(schoolYear) || !isRefractionQuizClassName(className)) return;

  const nextReleased = formData.get("nextReleased") === "true";
  await Promise.all([
    setRefractionQuizScoresReleased(schoolYear, className, nextReleased),
    setPracticeScoresReleased(schoolYear, "refraction-application", className, nextReleased),
  ]);
  revalidatePath("/giao-vien");
}

export async function forceSubmitPractice(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  const schoolYear = formData.get("schoolYear");
  const className = formData.get("className");
  const practiceKey = formData.get("practiceKey");
  if (!isSchoolYear(schoolYear) || !isClassName(className) || !isPracticeKey(practiceKey)) return;
  if (practiceKey === "refraction-application" && !isRefractionQuizClassName(className)) return;

  await forceSubmitPracticeClass(schoolYear, practiceKey, className);
  revalidatePath("/giao-vien");
}

export async function togglePracticeScores(formData: FormData) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");

  const schoolYear = formData.get("schoolYear");
  const className = formData.get("className");
  const practiceKey = formData.get("practiceKey");
  if (!isSchoolYear(schoolYear) || !isClassName(className) || !isPracticeKey(practiceKey)) return;
  if (practiceKey === "refraction-application" && !isRefractionQuizClassName(className)) return;

  const nextReleased = formData.get("nextReleased") === "true";
  await setPracticeScoresReleased(schoolYear, practiceKey, className, nextReleased);
  if (practiceKey === "refraction-application") {
    await setRefractionQuizScoresReleased(schoolYear, className, nextReleased);
  }
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
