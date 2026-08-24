import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
  const connection = await db.getConnection();

  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, message: "Not authorized. Please sign in again." },
        { status: 401 }
      );
    }

    const bookingId = Number(params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const checkoutMileage = Number(body.checkout_mileage || 0);
    const fuelLevel = String(body.fuel_level || "").trim();
    const spareTyrePresent = String(body.spare_tyre_present || "");
    const jackPresent = String(body.jack_present || "");

    if (!Number.isFinite(checkoutMileage) || checkoutMileage <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid checkout mileage is required." },
        { status: 400 }
      );
    }

    if (!fuelLevel) {
      return NextResponse.json(
        { success: false, message: "Fuel level is required." },
        { status: 400 }
      );
    }

    if (spareTyrePresent !== "Yes" || jackPresent !== "Yes") {
      return NextResponse.json(
        {
          success: false,
          message: "The spare tyre and jack must both be verified.",
        },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query(
      `SELECT id, vehicle_id, status
       FROM bookings
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
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
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    if (String(booking.status || "").toLowerCase() === "rented") {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "This booking is already checked out." },
        { status: 409 }
      );
    }

    const [mediaRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM booking_checkout_media
       WHERE booking_id = ?`,
      [bookingId]
    );

    const mediaTotal = Number(
      (mediaRows as Array<{ total: number | string }>)[0]?.total || 0
    );

    if (mediaTotal < 1) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "At least one inspection photo or video is required.",
        },
        { status: 400 }
      );
    }

    const [signatureRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM customer_signatures
       WHERE booking_id = ?
         AND signature_data IS NOT NULL
         AND signature_data <> ''`,
      [bookingId]
    );

    const signatureTotal = Number(
      (signatureRows as Array<{ total: number | string }>)[0]?.total || 0
    );

    if (signatureTotal < 1) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Customer signature is required." },
        { status: 400 }
      );
    }

    const [existingRows] = await connection.query(
      `SELECT id
       FROM booking_checkout_records
       WHERE booking_id = ?
       LIMIT 1`,
      [bookingId]
    );

    if ((existingRows as Array<{ id: number }>).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "A checkout record already exists." },
        { status: 409 }
      );
    }

    await connection.query(
      `INSERT INTO booking_checkout_records (
        booking_id,
        checkout_mileage,
        fuel_level,
        damage_notes,
        staff_notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        bookingId,
        checkoutMileage,
        fuelLevel,
        String(body.damage_notes || "").trim() || null,
        String(body.staff_notes || "").trim() || null,
      ]
    );

    await connection.query(
      "UPDATE bookings SET status = ? WHERE id = ?",
      ["rented", bookingId]
    );

    if (booking.vehicle_id) {
      await connection.query(
        `UPDATE vehicles
         SET status = ?, current_mileage = ?
         WHERE id = ?`,
        ["rented", checkoutMileage, booking.vehicle_id]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Vehicle checked out successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("REP CHECKOUT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to complete check-out." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}