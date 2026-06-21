import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

type RepUser = {
  id: number;
  email: string;
  name: string;
  role: string;
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

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const repCookie = cookies.find((cookie) =>
    cookie.startsWith("roberts_rep_token=")
  );

  if (!repCookie) return null;

  return repCookie.split("=")[1];
}

function verifyRep(request: NextRequest) {
  const token = getTokenFromCookie(request.headers.get("cookie"));

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as RepUser;

    const allowedRoles = ["admin", "staff", "rep"];

    if (!allowedRoles.includes(String(decoded.role || "").toLowerCase())) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyRep(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const fullName = String(body.full_name || "").trim();
    const phone = String(body.phone || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const address = String(body.address || "").trim();
    const dateOfBirth = body.date_of_birth || null;
    const licenseNumber = String(body.license_number || "").trim();
    const licenseExpiry = body.license_expiry || null;
    const idNumber = String(body.id_number || "").trim();
    const emergencyContactName = String(
      body.emergency_contact_name || ""
    ).trim();
    const emergencyContactPhone = String(
      body.emergency_contact_phone || ""
    ).trim();
    const notes = String(body.notes || "").trim();

    if (!fullName || !phone) {
      return NextResponse.json(
        { message: "Customer name and phone number are required." },
        { status: 400 }
      );
    }

    const pool = createPool();

    const [result] = await pool.execute(
      `
        INSERT INTO customers (
          full_name,
          phone,
          whatsapp,
          email,
          address,
          date_of_birth,
          license_number,
          license_expiry,
          id_number,
          emergency_contact_name,
          emergency_contact_phone,
          notes,
          is_blacklisted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
      [
        fullName,
        phone,
        whatsapp,
        email,
        address,
        dateOfBirth || null,
        licenseNumber,
        licenseExpiry || null,
        idNumber,
        emergencyContactName,
        emergencyContactPhone,
        notes,
      ]
    );

    const insertResult = result as { insertId: number };

    return NextResponse.json({
      message: "Customer created successfully.",
      customer_id: insertResult.insertId,
    });
  } catch (error) {
    console.error("REP CREATE CUSTOMER ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while creating customer." },
      { status: 500 }
    );
  }
}