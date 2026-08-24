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

export async function POST(
  request: Request,
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

    const body = await request.json();

    const checkoutMileage = Number(body.checkout_mileage || 0);
    const fuelLevel = String(body.fuel_level || "").trim();
    const damageNotes = String(body.damage_notes || "").trim();
    const staffNotes = String(body.staff_notes || "").trim();
    const spareTyrePresent = String(
      body.spare_tyre_present || ""
    ).trim();
    const jackPresent = String(body.jack_present || "").trim();

    if (!checkoutMileage || checkoutMileage <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Mileage out is required before check-out.",
        },
        { status: 400 }
      );
    }

    if (spareTyrePresent !== "Yes") {
      return NextResponse.json(
        {
          success: false,
          message:
            "The spare tyre must be verified before completing check-out.",
        },
        { status: 400 }
      );
    }

    if (jackPresent !== "Yes") {
      return NextResponse.json(
        {
          success: false,
          message:
            "The jack must be verified before completing check-out.",
        },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      `
        SELECT id, vehicle_id, status
        FROM bookings
        WHERE id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const booking = (
      bookingRows as Array<{
        id: number;
        vehicle_id: number | null;
        status: string | null;
      }>
    )[0];

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    if (String(booking.status || "").toLowerCase() === "rented") {
      return NextResponse.json(
        {
          success: false,
          message: "This vehicle has already been checked out.",
        },
        { status: 409 }
      );
    }

    const [mediaRows] = await db.query(
      `
        SELECT COUNT(*) AS media_count
        FROM booking_checkout_media
        WHERE booking_id = ?
      `,
      [bookingId]
    );

    const mediaCount = Number(
      (
        mediaRows as Array<{
          media_count: number | string;
        }>
      )[0]?.media_count || 0
    );

    if (mediaCount < 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Take or upload at least one vehicle photo or video before check-out.",
        },
        { status: 400 }
      );
    }

    const equipmentNotes = [
      staffNotes,
      "Safety equipment verification:",
      `Spare tyre in vehicle: ${spareTyrePresent}`,
      `Jack in vehicle: ${jackPresent}`,
    ]
      .filter(Boolean)
      .join("\n");

    await db.query(
      `
        INSERT INTO booking_checkout_records (
          booking_id,
          checkout_mileage,
          fuel_level,
          damage_notes,
          staff_notes
        ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        bookingId,
        checkoutMileage,
        fuelLevel || null,
        damageNotes || null,
        equipmentNotes,
      ]
    );

    await db.query(
      `
        UPDATE bookings
        SET status = ?
        WHERE id = ?
      `,
      ["rented", bookingId]
    );

    if (booking.vehicle_id) {
      await db.query(
        `
          UPDATE vehicles
          SET
            status = ?,
            current_mileage = ?
          WHERE id = ?
        `,
        ["rented", checkoutMileage, booking.vehicle_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle checked out successfully.",
    });
  } catch (error) {
    console.error("REP CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete check-out.",
      },
      { status: 500 }
    );
  }
}