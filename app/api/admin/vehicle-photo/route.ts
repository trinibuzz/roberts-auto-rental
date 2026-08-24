import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function getCloudinarySettings() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  return { cloudName, apiKey, apiSecret };
}

async function requireSignedInUser() {
  const token =
    cookies().get("admin_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("token")?.value;

  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await requireSignedInUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in before uploading a photo." },
        { status: 401 }
      );
    }

    const incomingForm = await request.formData();
    const file = incomingForm.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Choose a vehicle image to upload." },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Use a JPG, PNG, WebP, HEIC, or HEIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "The image must be 10 MB or smaller." },
        { status: 400 }
      );
    }

    const { cloudName, apiKey, apiSecret } = getCloudinarySettings();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "roberts-auto-rental/vehicles";
    const signatureSource = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureSource).digest("hex");

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file, file.name || `vehicle-${Date.now()}.jpg`);
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", String(timestamp));
    cloudinaryForm.append("folder", folder);
    cloudinaryForm.append("signature", signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
        cache: "no-store",
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.secure_url) {
      console.error("CLOUDINARY VEHICLE UPLOAD ERROR:", uploadData);

      return NextResponse.json(
        { success: false, message: "The vehicle photo could not be uploaded." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle photo uploaded successfully.",
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
    });
  } catch (error) {
    console.error("VEHICLE PHOTO UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Vehicle photo storage is not configured correctly.",
      },
      { status: 500 }
    );
  }
}
