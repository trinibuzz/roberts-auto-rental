import jwt from "jsonwebtoken";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "temporary_secret_change_this";

export function createToken(user: AdminUser) {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminUser;
  } catch {
    return null;
  }
}