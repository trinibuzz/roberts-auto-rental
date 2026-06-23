
import { NextResponse } from "next/server";

// Fix: current rep login uses email/password, so this route no longer checks the wrong PIN cookie.
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = Number(params.id);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `SELECT
        bookings.*,
        customers.full_name,
        customers.phone,
        customers.customer_photo,
        vehicles.vehicle_name,
        vehicles.plate_number,
        vehicles.vehicle_photo
      FROM bookings
      LEFT JOIN customers ON customers.id = bookings.customer_id
      LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE bookings.id = ?
      LIMIT 1`,
      [bookingId]
    );

    const bookings = rows as any[];

    if (!bookings[0]) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const [mediaRows] = await db.query(
      `SELECT * FROM booking_checkout_media WHERE booking_id = ? ORDER BY created_at DESC`,
      [bookingId]
    );

    return NextResponse.json({
      success: true,
      booking: bookings[0],
      media: mediaRows,
    });
  } catch (error) {
    console.error("REP GET BOOKING ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load booking." },
      { status: 500 }
    );
  }
}
