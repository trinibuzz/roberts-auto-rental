import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM vehicles ORDER BY created_at DESC"
    );

    return NextResponse.json({
      success: true,
      vehicles: rows,
    });
  } catch (error) {
    console.error("GET VEHICLES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load vehicles." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      vehicle_name,
      make,
      model,
      year,
      plate_number,
      vin,
      color,
      transmission,
      fuel_type,
      category,
      daily_rate,
      weekly_rate,
      monthly_rate,
      deposit_amount,
      current_mileage,
      status,
      insurance_expiry,
      inspection_expiry,
      next_service_mileage,
      vehicle_photo,
      notes,
    } = body;

    if (!vehicle_name || !plate_number) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle name and plate number are required.",
        },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO vehicles (
        vehicle_name,
        make,
        model,
        year,
        plate_number,
        vin,
        color,
        transmission,
        fuel_type,
        category,
        daily_rate,
        weekly_rate,
        monthly_rate,
        deposit_amount,
        current_mileage,
        status,
        insurance_expiry,
        inspection_expiry,
        next_service_mileage,
        vehicle_photo,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_name,
        make || null,
        model || null,
        year || null,
        plate_number,
        vin || null,
        color || null,
        transmission || "automatic",
        fuel_type || null,
        category || null,
        daily_rate || 0,
        weekly_rate || 0,
        monthly_rate || 0,
        deposit_amount || 0,
        current_mileage || 0,
        status || "available",
        insurance_expiry || null,
        inspection_expiry || null,
        next_service_mileage || null,
        vehicle_photo || null,
        notes || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Vehicle added successfully.",
    });
  } catch (error: any) {
    console.error("ADD VEHICLE ERROR:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "A vehicle with this plate number already exists.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to add vehicle." },
      { status: 500 }
    );
  }
}