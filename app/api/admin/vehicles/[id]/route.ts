import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = Number(params.id);

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Invalid vehicle ID." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      "SELECT * FROM vehicles WHERE id = ? LIMIT 1",
      [vehicleId]
    );

    const vehicles = rows as any[];

    if (!vehicles[0]) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle: vehicles[0],
    });
  } catch (error) {
    console.error("GET VEHICLE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load vehicle." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = Number(params.id);

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Invalid vehicle ID." },
        { status: 400 }
      );
    }

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

    const [result] = await db.query(
      `UPDATE vehicles
       SET
        vehicle_name = ?,
        make = ?,
        model = ?,
        year = ?,
        plate_number = ?,
        vin = ?,
        color = ?,
        transmission = ?,
        fuel_type = ?,
        category = ?,
        daily_rate = ?,
        weekly_rate = ?,
        monthly_rate = ?,
        deposit_amount = ?,
        current_mileage = ?,
        status = ?,
        insurance_expiry = ?,
        inspection_expiry = ?,
        next_service_mileage = ?,
        vehicle_photo = ?,
        notes = ?
       WHERE id = ?`,
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
        vehicleId,
      ]
    );

    const updateResult = result as { affectedRows?: number };

    if (!updateResult.affectedRows) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully.",
    });
  } catch (error: any) {
    console.error("UPDATE VEHICLE ERROR:", error);

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
      { success: false, message: "Failed to update vehicle." },
      { status: 500 }
    );
  }
}
