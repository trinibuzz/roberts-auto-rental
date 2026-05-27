import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = Number(params.id);
    const body = await request.json();
    const action = body.action;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, message: "Action is required." },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      `
      SELECT 
        bookings.id,
        bookings.vehicle_id,
        bookings.status,
        bookings.pickup_date,
        bookings.return_date,
        vehicles.status AS vehicle_status
      FROM bookings
      JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE bookings.id = ?
      LIMIT 1
      `,
      [bookingId]
    );

    const bookings = bookingRows as any[];

    if (bookings.length === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    if (action === "checkout") {
      if (booking.status === "completed" || booking.status === "cancelled") {
        return NextResponse.json(
          {
            success: false,
            message: "This booking cannot be checked out.",
          },
          { status: 400 }
        );
      }

      if (
        booking.vehicle_status === "maintenance" ||
        booking.vehicle_status === "out_of_service"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This vehicle cannot be checked out because it is not available.",
          },
          { status: 400 }
        );
      }

      await db.query("UPDATE bookings SET status = 'active' WHERE id = ?", [
        bookingId,
      ]);

      await db.query("UPDATE vehicles SET status = 'rented' WHERE id = ?", [
        booking.vehicle_id,
      ]);

      return NextResponse.json({
        success: true,
        message: "Vehicle checked out successfully.",
      });
    }

    if (action === "checkin") {
      if (booking.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: "Only active bookings can be checked in.",
          },
          { status: 400 }
        );
      }

      await db.query("UPDATE bookings SET status = 'completed' WHERE id = ?", [
        bookingId,
      ]);

      await db.query("UPDATE vehicles SET status = 'available' WHERE id = ?", [
        booking.vehicle_id,
      ]);

      return NextResponse.json({
        success: true,
        message: "Vehicle checked in successfully.",
      });
    }

    if (action === "cancel") {
      if (booking.status === "completed") {
        return NextResponse.json(
          {
            success: false,
            message: "Completed bookings cannot be cancelled.",
          },
          { status: 400 }
        );
      }

      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [
        bookingId,
      ]);

      await db.query("UPDATE vehicles SET status = 'available' WHERE id = ?", [
        booking.vehicle_id,
      ]);

      return NextResponse.json({
        success: true,
        message: "Booking cancelled successfully.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("BOOKING STATUS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update booking status." },
      { status: 500 }
    );
  }
}