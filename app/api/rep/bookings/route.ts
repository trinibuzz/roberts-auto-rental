import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SignedInUser = {
  id?: number | string;
};

const allowedPaymentMethods = new Set([
  "cash",
  "bank_transfer",
  "card",
  "online_payment",
  "cheque",
  "other",
]);

async function getSignedInUser() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return null;
  return (await verifyToken(token)) as SignedInUser | null;
}

export async function POST(request: Request) {
  const connection = await db.getConnection();

  try {
    const user = await getSignedInUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authorized. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const customerId = Number(body.customer_id || 0);
    const vehicleId = Number(body.vehicle_id || 0);
    const amountPaid = Math.max(0, Number(body.amount_paid || 0));
    const paymentMethod = String(body.payment_method || "cash").toLowerCase();
    const paymentReference = String(body.payment_reference || "").trim();

    if (!customerId || !vehicleId || !body.pickup_date || !body.return_date) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer, vehicle, pickup and return dates are required.",
        },
        { status: 400 }
      );
    }

    if (amountPaid > 0 && !allowedPaymentMethods.has(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Select a valid payment method." },
        { status: 400 }
      );
    }

    const bookingNumber = `RB-${Date.now()}`;
    await connection.beginTransaction();

    const [result] = await connection.query(
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
        customerId,
        vehicleId,
        body.pickup_date,
        body.pickup_time || null,
        body.return_date,
        body.return_time || null,
        Number(body.daily_rate || 0),
        Math.max(1, Number(body.number_of_days || 1)),
        Number(body.deposit || 0),
        Number(body.discount || 0),
        Number(body.extra_charges || 0),
        Number(body.total_amount || 0),
        amountPaid,
        Number(body.balance || 0),
        body.status || "confirmed",
        body.notes || null,
        String(body.underage_override || "0") === "1" ? 1 : 0,
      ]
    );

    const bookingId = Number((result as { insertId: number }).insertId);

    if (amountPaid > 0) {
      const recordedBy = Number(user.id || 0) || null;

      await connection.query(
        `INSERT INTO payments (
          booking_id,
          customer_id,
          amount,
          payment_method,
          payment_reference,
          recorded_by,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          customerId,
          amountPaid,
          paymentMethod,
          paymentReference || null,
          recordedBy,
          "Initial payment recorded during rep booking.",
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      bookingId,
      bookingNumber,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("REP CREATE BOOKING ERROR:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "This booking or payment already exists." },
        { status: 400 }
      );
    }

    if (error?.code === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json(
        {
          success: false,
          message: "The database is missing a required booking or payment field.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create booking." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}