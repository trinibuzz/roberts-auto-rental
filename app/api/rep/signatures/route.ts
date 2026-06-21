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

    const bookingId = Number(body.booking_id || 0);
    const signedName = String(body.signed_name || "").trim();
    const signatureData = String(body.signature_data || "").trim();

    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking is required." },
        { status: 400 }
      );
    }

    if (!signatureData) {
      return NextResponse.json(
        { message: "Customer signature is required." },
        { status: 400 }
      );
    }

    const pool = createPool();

    const [bookingRows] = await pool.execute(
      `
        SELECT id, customer_id, vehicle_id
        FROM bookings
        WHERE id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const bookings = bookingRows as Array<{
      id: number;
      customer_id: number;
      vehicle_id: number;
    }>;

    const booking = bookings[0];

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    await pool.execute(
      `
        INSERT INTO customer_signatures (
          booking_id,
          customer_id,
          vehicle_id,
          signature_data,
          signed_name,
          rep_name
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        bookingId,
        booking.customer_id,
        booking.vehicle_id,
        signatureData,
        signedName,
        user.name || "Sales Rep",
      ]
    );

    return NextResponse.json({
      message: "Signature saved successfully.",
    });
  } catch (error) {
    console.error("REP SIGNATURE ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while saving signature." },
      { status: 500 }
    );
  }
}