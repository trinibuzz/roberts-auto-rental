import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAMES = [
  "roberts_token",
  "robers_token",
  "admin_token",
  "token",
];

export async function getAuthToken() {
  const cookieStore = await cookies();

  for (const name of COOKIE_NAMES) {
    const token = cookieStore.get(name)?.value;

    if (token) {
      return token;
    }
  }

  return null;
}

export async function isAuthorized() {
  const token = await getAuthToken();

  if (!token) {
    return false;
  }

  try {
    const valid = await verifyToken(token);
    return !!valid;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

export async function requireAuth() {
  const authorized = await isAuthorized();

  if (!authorized) {
    redirect("/admin/login");
  }
}