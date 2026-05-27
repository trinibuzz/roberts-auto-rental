import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        payments.*,
        customers.full_name AS customer_name,
        bookings.booking_number,
        bookings.total_amount,
        bookings.amount_paid,
        bookings.balance
      FROM payments
      JOIN customers ON customers.id = payments.customer_id
      JOIN bookings ON bookings.id = payments.booking_id
      ORDER BY payments.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      payments: rows,
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load payments." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const connection = await db.getConnection();

  try {
    const body = await request.json();

    const booking_id = Number(body.booking_id);
    const amount = Number(body.amount || 0);
    const payment_method = body.payment_method || "cash";
    const payment_reference = body.payment_reference || null;
    const notes = body.notes || null;

    if (!booking_id || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking and payment amount are required.",
        },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [bookingRows] = await connection.query(
      `
      SELECT id, customer_id, total_amount, amount_paid, balance
      FROM bookings
      WHERE id = ?
      LIMIT 1
      `,
      [booking_id]
    );

    const bookings = bookingRows as any[];

    if (bookings.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    const oldAmountPaid = Number(booking.amount_paid || 0);
    const totalAmount = Number(booking.total_amount || 0);

    const newAmountPaid = oldAmountPaid + amount;
    const newBalance = Math.max(totalAmount - newAmountPaid, 0);

    await connection.query(
      `
      INSERT INTO payments (
        booking_id,
        customer_id,
        amount,
        payment_method,
        payment_reference,
        received_by,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        booking_id,
        booking.customer_id,
        amount,
        payment_method,
        payment_reference,
        null,
        notes,
      ]
    );

    await connection.query(
      `
      UPDATE bookings
      SET amount_paid = ?, balance = ?
      WHERE id = ?
      `,
      [newAmountPaid, newBalance, booking_id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("ADD PAYMENT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to record payment." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}