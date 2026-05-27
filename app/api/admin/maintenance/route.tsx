import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        maintenance_records.*,
        vehicles.vehicle_name,
        vehicles.plate_number,
        vehicles.status AS vehicle_status
      FROM maintenance_records
      JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
      ORDER BY maintenance_records.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      maintenance: rows,
    });
  } catch (error) {
    console.error("GET MAINTENANCE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load maintenance records." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const vehicle_id = Number(body.vehicle_id);
    const service_type = body.service_type;
    const service_date = body.service_date;
    const mileage = body.mileage ? Number(body.mileage) : null;
    const cost = Number(body.cost || 0);
    const vendor = body.vendor || null;
    const next_service_date = body.next_service_date || null;
    const next_service_mileage = body.next_service_mileage
      ? Number(body.next_service_mileage)
      : null;
    const notes = body.notes || null;
    const mark_vehicle_maintenance = body.mark_vehicle_maintenance ? 1 : 0;

    if (!vehicle_id || !service_type || !service_date) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle, service type, and service date are required.",
        },
        { status: 400 }
      );
    }

    const [vehicleRows] = await db.query(
      "SELECT id FROM vehicles WHERE id = ? LIMIT 1",
      [vehicle_id]
    );

    const vehicles = vehicleRows as any[];

    if (vehicles.length === 0) {
      return NextResponse.json(
        { success: false, message: "Selected vehicle was not found." },
        { status: 404 }
      );
    }

    await db.query(
      `
      INSERT INTO maintenance_records (
        vehicle_id,
        service_type,
        service_date,
        mileage,
        cost,
        vendor,
        next_service_date,
        next_service_mileage,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        vehicle_id,
        service_type,
        service_date,
        mileage,
        cost,
        vendor,
        next_service_date,
        next_service_mileage,
        notes,
      ]
    );

    if (mark_vehicle_maintenance) {
      await db.query("UPDATE vehicles SET status = 'maintenance' WHERE id = ?", [
        vehicle_id,
      ]);
    }

    if (next_service_mileage) {
      await db.query(
        "UPDATE vehicles SET next_service_mileage = ? WHERE id = ?",
        [next_service_mileage, vehicle_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance record added successfully.",
    });
  } catch (error) {
    console.error("ADD MAINTENANCE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add maintenance record." },
      { status: 500 }
    );
  }
}