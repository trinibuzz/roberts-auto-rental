
import { NextResponse } from "next/server";

// Fix: current rep login uses email/password, so this route no longer checks the wrong PIN cookie.
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bookingId = Number(formData.get("booking_id") || 0);
    const note = String(formData.get("note") || "");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No media file uploaded." },
        { status: 400 }
      );
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, message: "Only photo or video files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 80 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File is too large. Max size is 80MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension =
      path.extname(file.name || "").toLowerCase().replace(/[^a-z0-9.]/g, "") ||
      (isVideo ? ".mp4" : ".jpg");

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "checkout");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    const mediaUrl = `/uploads/checkout/${fileName}`;
    const mediaType = isVideo ? "video" : "photo";

    await db.query(
      `INSERT INTO booking_checkout_media (booking_id, media_type, media_url, note)
       VALUES (?, ?, ?, ?)`,
      [bookingId, mediaType, mediaUrl, note || null]
    );

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaType,
    });
  } catch (error) {
    console.error("REP CHECKOUT MEDIA ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to upload check-out media." },
      { status: 500 }
    );
  }
}
