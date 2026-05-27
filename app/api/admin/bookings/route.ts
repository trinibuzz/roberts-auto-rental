import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        bookings.*,
        customers.full_name AS customer_name,
        vehicles.vehicle_name,
        vehicles.plate_number
      FROM bookings
      JOIN customers ON customers.id = bookings.customer_id
      JOIN vehicles ON vehicles.id = bookings.vehicle_id
      ORDER BY bookings.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      bookings: rows,
    });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer_id = Number(body.customer_id);
    const vehicle_id = Number(body.vehicle_id);

    const pickup_date = body.pickup_date;
    const pickup_time = body.pickup_time || null;
    const return_date = body.return_date;
    const return_time = body.return_time || null;

    const daily_rate = Number(body.daily_rate || 0);
    const number_of_days = Number(body.number_of_days || 1);
    const deposit = Number(body.deposit || 0);
    const discount = Number(body.discount || 0);
    const extra_charges = Number(body.extra_charges || 0);
    const total_amount = Number(body.total_amount || 0);
    const amount_paid = Number(body.amount_paid || 0);
    const balance = Number(body.balance || 0);
    const status = body.status || "confirmed";
    const notes = body.notes || null;

    if (!customer_id || !vehicle_id || !pickup_date || !return_date) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer, vehicle, pickup date, and return date are required.",
        },
        { status: 400 }
      );
    }

    const pickupDateObj = new Date(pickup_date);
    const returnDateObj = new Date(return_date);

    if (returnDateObj < pickupDateObj) {
      return NextResponse.json(
        {
          success: false,
          message: "Return date cannot be before pickup date.",
        },
        { status: 400 }
      );
    }

    const [vehicleRows] = await db.query(
      "SELECT id, status FROM vehicles WHERE id = ? LIMIT 1",
      [vehicle_id]
    );

    const vehicles = vehicleRows as any[];

    if (vehicles.length === 0) {
      return NextResponse.json(
        { success: false, message: "Selected vehicle was not found." },
        { status: 404 }
      );
    }

    const vehicle = vehicles[0];

    if (
      vehicle.status === "maintenance" ||
      vehicle.status === "out_of_service" ||
      vehicle.status === "overdue"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This vehicle cannot be booked because it is not available.",
        },
        { status: 400 }
      );
    }

    /*
      IMPORTANT DOUBLE-BOOKING RULE:

      Existing booking overlaps new booking when:
      existing pickup_date <= new return_date
      AND
      existing return_date >= new pickup_date

      We ignore only cancelled and completed bookings.
    */
    const [overlapRows] = await db.query(
      `
      SELECT 
        bookings.id,
        bookings.booking_number,
        bookings.pickup_date,
        bookings.return_date,
        bookings.status
      FROM bookings
      WHERE bookings.vehicle_id = ?
      AND bookings.status NOT IN ('cancelled', 'completed')
      AND DATE(bookings.pickup_date) <= DATE(?)
      AND DATE(bookings.return_date) >= DATE(?)
      LIMIT 1
      `,
      [vehicle_id, return_date, pickup_date]
    );

    const overlaps = overlapRows as any[];

    if (overlaps.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This vehicle is not available for the selected dates.",
          existing_booking: overlaps[0],
        },
        { status: 400 }
      );
    }

    const bookingNumber = `RA-${Date.now()}`;

    await db.query(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingNumber,
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
        notes,
      ]
    );

    if (status === "active") {
      await db.query("UPDATE vehicles SET status = 'rented' WHERE id = ?", [
        vehicle_id,
      ]);
    }

    if (status === "confirmed" || status === "pending") {
      await db.query("UPDATE vehicles SET status = 'reserved' WHERE id = ?", [
        vehicle_id,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking_number: bookingNumber,
    });
  } catch (error) {
    console.error("ADD BOOKING ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create booking." },
      { status: 500 }
    );
  }
}