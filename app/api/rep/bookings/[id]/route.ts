import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isAuthorized() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return false;

  return Boolean(await verifyToken(token));
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authorized. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const bookingId = Number(formData.get("booking_id") || 0);
    const note = String(formData.get("note") || "").trim();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid booking ID is required.",
        },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      `
        SELECT id, status
        FROM bookings
        WHERE id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const booking = (
      bookingRows as Array<{
        id: number;
        status: string | null;
      }>
    )[0];

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    if (String(booking.status || "").toLowerCase() === "rented") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This vehicle has already been checked out. Additional checkout media cannot be added here.",
        },
        { status: 409 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No photo or video was selected.",
        },
        { status: 400 }
      );
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          message: "Only photo or video files are allowed.",
        },
        { status: 400 }
      );
    }

    const maxSize = 80 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "The file is too large. Maximum size is 80 MB.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalExtension = path
      .extname(file.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "");

    const extension =
      originalExtension || (isVideo ? ".mp4" : ".jpg");

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "checkout"
    );

    await mkdir(uploadDirectory, { recursive: true });

    const filePath = path.join(uploadDirectory, fileName);

    await writeFile(filePath, buffer);

    const mediaUrl = `/uploads/checkout/${fileName}`;
    const mediaType = isVideo ? "video" : "photo";

    await db.query(
      `
        INSERT INTO booking_checkout_media (
          booking_id,
          media_type,
          media_url,
          note
        ) VALUES (?, ?, ?, ?)
      `,
      [bookingId, mediaType, mediaUrl, note || null]
    );

    return NextResponse.json({
      success: true,
      message: `${
        mediaType === "video" ? "Video" : "Photo"
      } uploaded successfully.`,
      mediaUrl,
      mediaType,
    });
  } catch (error) {
    console.error("REP CHECKOUT MEDIA ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload check-out media.",
      },
      { status: 500 }
    );
  }
}