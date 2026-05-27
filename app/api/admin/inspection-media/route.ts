import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM vehicle_inspection_media
      WHERE booking_id = ?
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [bookingId]
    );

    return NextResponse.json({
      success: true,
      media: rows,
    });
  } catch (error) {
    console.error("GET INSPECTION MEDIA ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load inspection media." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const bookingId = Number(formData.get("booking_id"));
    const inspectionType = String(formData.get("inspection_type") || "checkout");
    const deleteAfterCompletedRentals = Number(
      formData.get("delete_after_completed_rentals") || 3
    );

    const file = formData.get("file") as File | null;

    if (!bookingId || !file) {
      return NextResponse.json(
        { success: false, message: "Booking and video file are required." },
        { status: 400 }
      );
    }

    if (!["checkout", "return"].includes(inspectionType)) {
      return NextResponse.json(
        { success: false, message: "Invalid inspection type." },
        { status: 400 }
      );
    }

    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only MP4, MOV, and WEBM video files are allowed.",
        },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Video is too large. Maximum allowed size is 100MB.",
        },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      `
      SELECT id, vehicle_id
      FROM bookings
      WHERE id = ?
      LIMIT 1
      `,
      [bookingId]
    );

    const bookings = bookingRows as any[];

    if (bookings.length === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const booking = bookings[0];
    const vehicleId = booking.vehicle_id;

    const [completedRows] = await db.query(
      `
      SELECT COUNT(*) AS completed_count
      FROM bookings
      WHERE vehicle_id = ?
      AND status = 'completed'
      `,
      [vehicleId]
    );

    const completedRentalsAtUpload = Number(
      (completedRows as any[])[0]?.completed_count || 0
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "inspection-videos"
    );

    await mkdir(uploadDir, { recursive: true });

    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const extension = path.extname(originalName) || ".mp4";
    const fileName = `booking-${bookingId}-${inspectionType}-${Date.now()}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/inspection-videos/${fileName}`;

    await db.query(
      `
      INSERT INTO vehicle_inspection_media (
        booking_id,
        vehicle_id,
        inspection_type,
        media_type,
        file_url,
        file_name,
        file_size,
        mime_type,
        delete_after_completed_rentals,
        completed_rentals_at_upload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookingId,
        vehicleId,
        inspectionType,
        "video",
        fileUrl,
        originalName,
        file.size,
        file.type,
        deleteAfterCompletedRentals,
        completedRentalsAtUpload,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Inspection video uploaded successfully.",
      file_url: fileUrl,
    });
  } catch (error) {
    console.error("UPLOAD INSPECTION VIDEO ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to upload inspection video." },
      { status: 500 }
    );
  }
}