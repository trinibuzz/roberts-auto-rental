import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SignedInUser = {
  name?: string;
};

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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSignedInUser();

    if (!user) {
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
    const signedName = String(body.signed_name || "").trim();
    const signatureData = String(body.signature_data || "");
    const repSignatureData = String(body.rep_signature_data || "");

    if (!signedName) {
      return NextResponse.json(
        { success: false, message: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!signatureData.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { success: false, message: "A valid customer signature is required." },
        { status: 400 }
      );
    }

    if (!repSignatureData.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid representative signature is required.",
        },
        { status: 400 }
      );
    }

    if (
      signatureData.length > 2_500_000 ||
      repSignatureData.length > 2_500_000
    ) {
      return NextResponse.json(
        { success: false, message: "The signature image is too large." },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      `SELECT id, customer_id, vehicle_id, status
       FROM bookings
       WHERE id = ?
       LIMIT 1`,
      [bookingId]
    );

    const booking = (
      bookingRows as Array<{
        id: number;
        customer_id: number;
        vehicle_id: number;
        status: string | null;
      }>
    )[0];

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    if (String(booking.status || "").toLowerCase() === "rented") {
      return NextResponse.json(
        { success: false, message: "This vehicle is already checked out." },
        { status: 409 }
      );
    }

    await db.query("DELETE FROM customer_signatures WHERE booking_id = ?", [
      bookingId,
    ]);

    await db.query(
      `INSERT INTO customer_signatures (
        booking_id,
        customer_id,
        vehicle_id,
        signature_data,
        signed_name,
        rep_name,
        rep_signature_data,
        rep_signed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        bookingId,
        booking.customer_id,
        booking.vehicle_id,
        signatureData,
        signedName,
        String(user.name || "Representative"),
        repSignatureData,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Customer signature saved.",
    });
  } catch (error) {
    console.error("REP SIGNATURE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save customer signature." },
      { status: 500 }
    );
  }
}
