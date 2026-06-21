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

function createBookingNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `ROB-${year}${month}${day}-${random}`;
}

function calculateDays(pickupDate: string, returnDate: string) {
  const pickup = new Date(`${pickupDate}T00:00:00`);
  const returned = new Date(`${returnDate}T00:00:00`);

  const diff = returned.getTime() - pickup.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 1);
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

    const customerId = Number(body.customer_id || 0);
    const vehicleId = Number(body.vehicle_id || 0);
    const pickupDate = String(body.pickup_date || "").trim();
    const pickupTime = String(body.pickup_time || "").trim();
    const returnDate = String(body.return_date || "").trim();
    const returnTime = String(body.return_time || "").trim();
    const deposit = Number(body.deposit || 0);
    const discount = Number(body.discount || 0);
    const extraCharges = Number(body.extra_charges || 0);
    const amountPaid = Number(body.amount_paid || 0);
    const notes = String(body.notes || "").trim();

    if (!customerId || !vehicleId || !pickupDate || !returnDate) {
      return NextResponse.json(
        { message: "Customer, vehicle, pickup date, and return date are required." },
        { status: 400 }
      );
    }

    const pool = createPool();

    const [vehicleRows] = await pool.execute(
      `
        SELECT id, daily_rate, status
        FROM vehicles
        WHERE id = ?
        LIMIT 1
      `,
      [vehicleId]
    );

    const vehicles = vehicleRows as Array<{
      id: number;
      daily_rate: number;
      status: string;
    }>;

    const vehicle = vehicles[0];

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found." },
        { status: 404 }
      );
    }

    const blockedStatuses = ["maintenance", "out_of_service", "overdue"];

    if (blockedStatuses.includes(String(vehicle.status || "").toLowerCase())) {
      return NextResponse.json(
        { message: "This vehicle is not available for booking." },
        { status: 400 }
      );
    }

    const [overlapRows] = await pool.execute(
      `
        SELECT id
        FROM bookings
        WHERE vehicle_id = ?
        AND status IN ('pending', 'confirmed', 'active', 'overdue')
        AND DATE(pickup_date) <= DATE(?)
        AND DATE(return_date) >= DATE(?)
        LIMIT 1
      `,
      [vehicleId, returnDate, pickupDate]
    );

    const overlaps = overlapRows as Array<{ id: number }>;

    if (overlaps.length > 0) {
      return NextResponse.json(
        { message: "This vehicle is not available for the selected dates." },
        { status: 400 }
      );
    }

    const dailyRate = Number(body.daily_rate || vehicle.daily_rate || 0);
    const numberOfDays = calculateDays(pickupDate, returnDate);
    const subtotal = numberOfDays * dailyRate;
    const totalAmount = subtotal + extraCharges - discount;
    const balance = totalAmount - amountPaid;

    const bookingNumber = createBookingNumber();

    const [result] = await pool.execute(
      `
        INSERT INTO bookings (
          booking_number,
          customer_id,
          vehicle_id,
          pickup_date,
          pickup_time,
          return_date,
          return_time,
          daily_rate,
          number_of_days,
          deposit,
          discount,
          extra_charges,
          total_amount,
          amount_paid,
          balance,
          status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
      `,
      [
        bookingNumber,
        customerId,
        vehicleId,
        pickupDate,
        pickupTime || null,
        returnDate,
        returnTime || null,
        dailyRate,
        numberOfDays,
        deposit,
        discount,
        extraCharges,
        totalAmount,
        amountPaid,
        balance,
        notes,
      ]
    );

    await pool.execute(
      `
        UPDATE vehicles
        SET status = 'reserved'
        WHERE id = ?
      `,
      [vehicleId]
    );

    const insertResult = result as { insertId: number };

  return NextResponse.json({
  message: "Booking created successfully.",
  booking_id: insertResult.insertId,
  bookingId: insertResult.insertId,
  booking_number: bookingNumber,
  bookingNumber: bookingNumber,
});
  } catch (error) {
    console.error("REP CREATE BOOKING ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while creating booking." },
      { status: 500 }
    );
  }
}