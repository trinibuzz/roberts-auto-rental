
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function isAuthorized() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return false;
  return Boolean(await verifyToken(token));
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, message: "Not authorized." },
        { status: 401 }
      );
    }

    const bookingId = Number(params.id);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { checkout_mileage, fuel_level, damage_notes, staff_notes } = body;

    const [bookingRows] = await db.query(
      "SELECT id, vehicle_id FROM bookings WHERE id = ? LIMIT 1",
      [bookingId]
    );

    const booking = (bookingRows as any[])[0];

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    await db.query(
      `INSERT INTO booking_checkout_records (
        booking_id,
        checkout_mileage,
        fuel_level,
        damage_notes,
        staff_notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        bookingId,
        checkout_mileage || null,
        fuel_level || null,
        damage_notes || null,
        staff_notes || null,
      ]
    );

    await db.query("UPDATE bookings SET status = ? WHERE id = ?", [
      "rented",
      bookingId,
    ]);

    if (booking.vehicle_id) {
      await db.query("UPDATE vehicles SET status = ? WHERE id = ?", [
        "rented",
        booking.vehicle_id,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle checked out successfully.",
    });
  } catch (error) {
    console.error("REP CHECKOUT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to complete check-out." },
      { status: 500 }
    );
  }
}
