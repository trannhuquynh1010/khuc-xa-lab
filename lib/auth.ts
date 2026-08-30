import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "khuc_xa_teacher";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_TEACHER_PASSWORD_HASH = "b683f18318d71be622df6b2b49e968c4dcab82abe3a06ece41c42e31cec31f78";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isCorrectTeacherPassword(password: string) {
  const passwordHash = createHash("sha256").update(password).digest("hex");
  return safeEqual(passwordHash, DEFAULT_TEACHER_PASSWORD_HASH);
}

export async function createTeacherSession() {
  const issuedAt = String(Math.floor(Date.now() / 1000));
  const value = `${issuedAt}.${sign(issuedAt)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroyTeacherSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isTeacherAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature || !safeEqual(signature, sign(issuedAt))) return false;

  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age <= SESSION_SECONDS;
}
