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
    const amount = Number(body.amount || 0);
    const paymentMethod = String(body.payment_method || "").trim();
    const paymentDate = body.payment_date || null;
    const referenceNumber = String(body.reference_number || "").trim();
    const notes = String(body.notes || "").trim();

    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Payment amount must be greater than 0." },
        { status: 400 }
      );
    }

    const pool = createPool();

    const [bookingRows] = await pool.execute(
      `
        SELECT
          id,
          customer_id,
          vehicle_id,
          total_amount,
          amount_paid,
          balance
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
      total_amount: number;
      amount_paid: number;
      balance: number;
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
        INSERT INTO rep_payments (
          booking_id,
          customer_id,
          vehicle_id,
          amount,
          payment_method,
          payment_date,
          reference_number,
          notes,
          rep_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingId,
        booking.customer_id,
        booking.vehicle_id,
        amount,
        paymentMethod,
        paymentDate || null,
        referenceNumber,
        notes,
        user.name || "Sales Rep",
      ]
    );

    const newAmountPaid = Number(booking.amount_paid || 0) + amount;
    const newBalance = Math.max(Number(booking.total_amount || 0) - newAmountPaid, 0);

    await pool.execute(
      `
        UPDATE bookings
        SET amount_paid = ?, balance = ?
        WHERE id = ?
      `,
      [newAmountPaid, newBalance, bookingId]
    );

    return NextResponse.json({
      message: "Payment recorded successfully.",
      amount_paid: newAmountPaid,
      balance: newBalance,
    });
  } catch (error) {
    console.error("REP PAYMENT ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while recording payment." },
      { status: 500 }
    );
  }
}