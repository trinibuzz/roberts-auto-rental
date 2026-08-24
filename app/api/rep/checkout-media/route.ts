import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 80 * 1024 * 1024;

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

function getCloudinarySettings() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  return { cloudName, apiKey, apiSecret };
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, message: "Not authorized. Please sign in again." },
        { status: 401 }
      );
    }

    const incomingForm = await request.formData();
    const file = incomingForm.get("file");
    const bookingId = Number(incomingForm.get("booking_id") || 0);
    const note = String(incomingForm.get("note") || "").trim();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid booking ID is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No photo or video was selected." },
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "The file must be 80 MB or smaller." },
        { status: 400 }
      );
    }

    const [bookingRows] = await db.query(
      "SELECT id, status FROM bookings WHERE id = ? LIMIT 1",
      [bookingId]
    );

    const booking = (
      bookingRows as Array<{ id: number; status: string | null }>
    )[0];

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    if (String(booking.status || "").toLowerCase() === "rented") {
      return NextResponse.json(
        {
          success: false,
          message: "This vehicle has already been checked out.",
        },
        { status: 409 }
      );
    }

    const { cloudName, apiKey, apiSecret } = getCloudinarySettings();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `roberts-auto-rental/checkouts/${bookingId}`;
    const signatureSource = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureSource).digest("hex");

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file, file.name || `checkout-${Date.now()}`);
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", String(timestamp));
    cloudinaryForm.append("folder", folder);
    cloudinaryForm.append("signature", signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
        cache: "no-store",
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.secure_url) {
      console.error("CLOUDINARY CHECKOUT UPLOAD ERROR:", uploadData);

      return NextResponse.json(
        {
          success: false,
          message: "The checkout media could not be stored permanently.",
        },
        { status: 502 }
      );
    }

    const mediaType = uploadData.resource_type === "video" ? "video" : "photo";
    const mediaUrl = uploadData.secure_url;

    try {
      await db.query(
        `INSERT INTO booking_checkout_media
          (booking_id, media_type, media_url, note)
         VALUES (?, ?, ?, ?)`,
        [bookingId, mediaType, mediaUrl, note || null]
      );
    } catch (databaseError) {
      console.error("CHECKOUT MEDIA DATABASE ERROR:", databaseError);

      return NextResponse.json(
        {
          success: false,
          message: "Media uploaded, but its booking record could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${mediaType === "video" ? "Video" : "Photo"} saved permanently.`,
      mediaUrl,
      mediaType,
    });
  } catch (error) {
    console.error("REP CHECKOUT MEDIA ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Checkout media storage is not configured correctly.",
      },
      { status: 500 }
    );
  }
}
