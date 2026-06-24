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
  const cleanRole = String(role || "").toLowerCase();

  if (cleanRole === "rep") {
    return "/rep";
  }

  return "/admin/dashboard";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const pool = createPool();

    const [rows] = await pool.execute(
      `
        SELECT id, name, email, password, role, status
        FROM users
        WHERE LOWER(email) = ?
        LIMIT 1
      `,
      [email]
    );

    const users = rows as UserRow[];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const status = String(user.status || "active").toLowerCase();

    if (status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "This user account is disabled. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    const savedPassword = String(user.password || "");

    if (savedPassword !== password) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
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

    const redirectTo = getRedirectForRole(cleanRole);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: cleanRole,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    response.cookies.set("robers_token", token, cookieOptions);
    response.cookies.set("roberts_token", token, cookieOptions);
    response.cookies.set("admin_token", token, cookieOptions);
    response.cookies.set("roberts_rep_token", token, cookieOptions);

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}
