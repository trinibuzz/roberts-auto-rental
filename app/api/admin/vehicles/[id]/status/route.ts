import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = Number(params.id);
    const body = await request.json();
    const status = body.status;

    const allowedStatuses = [
      "available",
      "reserved",
      "rented",
      "returned",
      "maintenance",
      "out_of_service",
      "overdue",
    ];

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Invalid vehicle ID." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid vehicle status." },
        { status: 400 }
      );
    }

    const [vehicleRows] = await db.query(
      "SELECT id FROM vehicles WHERE id = ? LIMIT 1",
      [vehicleId]
    );

    const vehicles = vehicleRows as any[];

    if (vehicles.length === 0) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 }
      );
    }

    await db.query("UPDATE vehicles SET status = ? WHERE id = ?", [
      status,
      vehicleId,
    ]);

    return NextResponse.json({
      success: true,
      message: "Vehicle status updated successfully.",
    });
  } catch (error) {
    console.error("VEHICLE STATUS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update vehicle status." },
      { status: 500 }
    );
  }
}