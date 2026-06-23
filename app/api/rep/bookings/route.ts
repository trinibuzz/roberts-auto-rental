import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
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
      underage_override,
    } = body;

    if (!customer_id || !vehicle_id || !pickup_date || !return_date) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer, vehicle, pickup and return dates are required.",
        },
        { status: 400 }
      );
    }

    const bookingNumber = `RB-${Date.now()}`;

    const [result] = await db.query(
      `INSERT INTO bookings (
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
        notes,
        underage_override
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        customer_id,
        vehicle_id,
        pickup_date,
        pickup_time || null,
        return_date,
        return_time || null,
        daily_rate || 0,
        number_of_days || 1,
        deposit || 0,
        discount || 0,
        extra_charges || 0,
        total_amount || 0,
        amount_paid || 0,
        balance || 0,
        status || "confirmed",
        notes || null,
        underage_override ? 1 : 0,
      ]
    );

    const insertResult = result as { insertId: number };

    return NextResponse.json({
      success: true,
      bookingId: insertResult.insertId,
      bookingNumber,
    });
  } catch (error: any) {
    console.error("REP CREATE BOOKING ERROR:", error);

    if (error?.code === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database is missing a booking field. Run the SQL update included with this feature.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create booking." },
      { status: 500 }
    );
  }
}
