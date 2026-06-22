import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customers ORDER BY created_at DESC"
    );

    return NextResponse.json({
      success: true,
      customers: rows,
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load customers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      full_name,
      phone,
      whatsapp,
      email,
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

    await db.query(
      `INSERT INTO customers (
        full_name,
        phone,
        whatsapp,
        email,
        address,
        date_of_birth,
        license_number,
        license_expiry,
        id_number,
        emergency_contact_name,
        emergency_contact_phone,
        notes,
        is_blacklisted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        phone,
        whatsapp || null,
        email || null,
        address || null,
        date_of_birth || null,
        license_number || null,
        license_expiry || null,
        id_number || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        notes || null,
        is_blacklisted ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Customer added successfully.",
    });
  } catch (error) {
    console.error("ADD CUSTOMER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add customer." },
      { status: 500 }
    );
  }
}
