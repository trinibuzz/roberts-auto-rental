import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RentalStatus = "approved" | "review_required" | "do_not_rent";

type SignedInUser = {
  id?: number | string;
};

type ExistingCustomer = {
  id: number;
  rental_status?: string | null;
  restriction_reason?: string | null;
  restriction_notes?: string | null;
  is_blacklisted?: number | boolean | null;
};

const allowedStatuses = new Set<RentalStatus>([
  "approved",
  "review_required",
  "do_not_rent",
]);

async function getSignedInUser() {
  const token =
    cookies().get("admin_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return null;

  const user = await verifyToken(token);
  return user ? (user as SignedInUser) : null;
}

function cleanOptional(value: unknown) {
  const cleaned = String(value ?? "").trim();
  return cleaned || null;
}

function normalizeStatus(value: unknown): RentalStatus {
  const cleaned = String(value || "approved").toLowerCase() as RentalStatus;
  return allowedStatuses.has(cleaned) ? cleaned : "approved";
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await getSignedInUser())) {
      return NextResponse.json(
        { success: false, message: "Not authorized." },
        { status: 401 }
      );
    }

    const customerId = Number(params.id);

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      "SELECT * FROM customers WHERE id = ? LIMIT 1",
      [customerId]
    );

    const customers = rows as any[];

    if (!customers[0]) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: customers[0],
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load customer." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await db.getConnection();

  try {
    const signedInUser = await getSignedInUser();

    if (!signedInUser) {
      return NextResponse.json(
        { success: false, message: "Not authorized." },
        { status: 401 }
      );
    }

    const customerId = Number(params.id);

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      full_name,
      phone,
      whatsapp,
      email,
      customer_photo,
      address,
      date_of_birth,
      license_number,
      license_expiry,
      id_number,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      restriction_reason,
      restriction_notes,
    } = body;

    if (!String(full_name || "").trim() || !String(phone || "").trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name and phone number are required.",
        },
        { status: 400 }
      );
    }

    const rentalStatus = normalizeStatus(body.rental_status);
    const cleanedReason =
      rentalStatus === "approved" ? null : cleanOptional(restriction_reason);
    const cleanedRestrictionNotes =
      rentalStatus === "approved" ? null : cleanOptional(restriction_notes);

    if (rentalStatus !== "approved" && !cleanedReason) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a reason for Review Required or Do Not Rent.",
        },
        { status: 400 }
      );
    }

    const changedByNumber = Number(signedInUser.id || 0);
    const changedBy = changedByNumber > 0 ? changedByNumber : null;
    const isBlacklisted = rentalStatus === "do_not_rent" ? 1 : 0;

    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT id, rental_status, restriction_reason, restriction_notes, is_blacklisted
       FROM customers
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [customerId]
    );

    const existing = (existingRows as ExistingCustomer[])[0];

    if (!existing) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    const previousStatus = normalizeStatus(
      existing.rental_status ||
        (existing.is_blacklisted ? "do_not_rent" : "approved")
    );

    const statusDetailsChanged =
      previousStatus !== rentalStatus ||
      String(existing.restriction_reason || "") !==
        String(cleanedReason || "") ||
      String(existing.restriction_notes || "") !==
        String(cleanedRestrictionNotes || "");

    const [result] = await connection.query(
      `UPDATE customers
       SET
        full_name = ?,
        phone = ?,
        whatsapp = ?,
        email = ?,
        customer_photo = ?,
        address = ?,
        date_of_birth = ?,
        license_number = ?,
        license_expiry = ?,
        id_number = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        notes = ?,
        is_blacklisted = ?,
        rental_status = ?,
        restriction_reason = ?,
        restriction_notes = ?,
        restricted_at = CASE WHEN ? = 'approved' THEN NULL ELSE NOW() END,
        restricted_by = CASE WHEN ? = 'approved' THEN NULL ELSE ? END
       WHERE id = ?`,
      [
        String(full_name).trim(),
        String(phone).trim(),
        cleanOptional(whatsapp),
        cleanOptional(email),
        cleanOptional(customer_photo),
        cleanOptional(address),
        cleanOptional(date_of_birth),
        cleanOptional(license_number),
        cleanOptional(license_expiry),
        cleanOptional(id_number),
        cleanOptional(emergency_contact_name),
        cleanOptional(emergency_contact_phone),
        cleanOptional(notes),
        isBlacklisted,
        rentalStatus,
        cleanedReason,
        cleanedRestrictionNotes,
        rentalStatus,
        rentalStatus,
        changedBy,
        customerId,
      ]
    );

    const updateResult = result as { affectedRows?: number };

    if (!updateResult.affectedRows) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    if (statusDetailsChanged) {
      await connection.query(
        `INSERT INTO customer_rental_status_history (
          customer_id,
          previous_status,
          new_status,
          reason,
          notes,
          changed_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          previousStatus,
          rentalStatus,
          cleanedReason,
          cleanedRestrictionNotes,
          changedBy,
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Customer and rental status updated successfully.",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("UPDATE CUSTOMER ERROR:", error);

    if (error?.code === "ER_BAD_FIELD_ERROR" || error?.code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json(
        {
          success: false,
          message: "Run the customer rental-status SQL update before using this page.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update customer." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
