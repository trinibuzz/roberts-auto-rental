import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function isAuthorized() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return false;

  return Boolean(await verifyToken(token));
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authorized. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const bookingId = Number(params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking ID.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          bookings.*,
          customers.full_name,
          customers.phone,
          customers.customer_photo,
          vehicles.vehicle_name,
          vehicles.plate_number,
          vehicles.vehicle_photo
        FROM bookings
        LEFT JOIN customers
          ON customers.id = bookings.customer_id
        LEFT JOIN vehicles
          ON vehicles.id = bookings.vehicle_id
        WHERE bookings.id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const bookings = rows as any[];
    const booking = bookings[0];

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const [mediaRows] = await db.query(
      `
        SELECT
          id,
          booking_id,
          media_type,
          media_url,
          note,
          created_at
        FROM booking_checkout_media
        WHERE booking_id = ?
        ORDER BY created_at DESC
      `,
      [bookingId]
    );

    return NextResponse.json({
      success: true,
      booking,
      media: mediaRows,
    });
  } catch (error) {
    console.error("REP GET BOOKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load booking.",
      },
      { status: 500 }
    );
  }
}