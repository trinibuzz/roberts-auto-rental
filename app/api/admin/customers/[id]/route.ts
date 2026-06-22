import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = Number(params.id);

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID." },
        { status: 400 }
      );
    }

    const [rows] = await db.query("SELECT * FROM customers WHERE id = ? LIMIT 1", [
      customerId,
    ]);

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
  try {
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
      is_blacklisted,
    } = body;

    if (!full_name || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name and phone number are required.",
        },
        { status: 400 }
      );
    }

    const [result] = await db.query(
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
        is_blacklisted = ?
       WHERE id = ?`,
      [
        full_name,
        phone,
        whatsapp || null,
        email || null,
        customer_photo || null,
        address || null,
        date_of_birth || null,
        license_number || null,
        license_expiry || null,
        id_number || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        notes || null,
        is_blacklisted ? 1 : 0,
        customerId,
      ]
    );

    const updateResult = result as { affectedRows?: number };

    if (!updateResult.affectedRows) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update customer." },
      { status: 500 }
    );
  }
}
