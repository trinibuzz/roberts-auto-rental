import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string | null;
};

const authCookieNames = [
  "robers_token",
  "roberts_token",
  "admin_token",
  "roberts_rep_token",
  "token",
];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function getRedirectForRole(role: string) {
  return role === "rep" ? "/rep" : "/admin/dashboard";
}

function clearAuthCookies(response: NextResponse) {
  authCookieNames.forEach((name) => {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });
}

export async function POST(request: NextRequest) {
  let pool: ReturnType<typeof createPool> | null = null;

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    pool = createPool();

    const [rows] = await pool.execute(
      `
        SELECT id, name, email, password, role, status
        FROM users
        WHERE LOWER(email) = ?
        LIMIT 1
      `,
      [email]
    );

    const user = (rows as UserRow[])[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (String(user.status || "active").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "This user account is disabled. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    // Keep the existing comparison until the database passwords are migrated.
    if (String(user.password || "") !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const cleanRole = String(user.role || "staff").toLowerCase();
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: cleanRole,
      },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      redirectTo: getRedirectForRole(cleanRole),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: cleanRole,
      },
    });

    // Remove any session left by the previous account before setting the new one.
    clearAuthCookies(response);

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    if (cleanRole === "rep") {
      response.cookies.set("roberts_rep_token", token, cookieOptions);
    } else {
      // Retain the legacy admin cookie names until all admin pages use admin_token.
      response.cookies.set("admin_token", token, cookieOptions);
      response.cookies.set("roberts_token", token, cookieOptions);
      response.cookies.set("robers_token", token, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong during login." },
      { status: 500 }
    );
  } finally {
    if (pool) await pool.end();
  }
}