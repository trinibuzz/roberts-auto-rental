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
    const vehicleId = Number(body.vehicle_id || 0);
    const customerId = Number(body.customer_id || 0);
    const inspectionType = String(body.inspection_type || "").trim();
    const mileage = body.mileage ? Number(body.mileage) : null;
    const fuelLevel = String(body.fuel_level || "").trim();
    const exteriorCondition = String(body.exterior_condition || "").trim();
    const interiorCondition = String(body.interior_condition || "").trim();
    const damageNotes = String(body.damage_notes || "").trim();

    if (!bookingId || !vehicleId || !customerId) {
      return NextResponse.json(
        { message: "Booking, vehicle, and customer are required." },
        { status: 400 }
      );
    }

    if (!["checkout", "return"].includes(inspectionType)) {
      return NextResponse.json(
        { message: "Inspection type must be checkout or return." },
        { status: 400 }
      );
    }

    const pool = createPool();

    await pool.execute(
      `
        INSERT INTO rep_vehicle_inspections (
          booking_id,
          vehicle_id,
          customer_id,
          inspection_type,
          mileage,
          fuel_level,
          exterior_condition,
          interior_condition,
          damage_notes,
          rep_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingId,
        vehicleId,
        customerId,
        inspectionType,
        mileage,
        fuelLevel,
        exteriorCondition,
        interiorCondition,
        damageNotes,
        user.name || "Sales Rep",
      ]
    );

    return NextResponse.json({
      message: "Inspection saved successfully.",
    });
  } catch (error) {
    console.error("REP INSPECTION ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while saving inspection." },
      { status: 500 }
    );
  }
}