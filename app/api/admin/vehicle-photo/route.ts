import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const allowedTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No image file was uploaded." },
        { status: 400 }
      );
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WEBP vehicle images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Vehicle image must be 10MB or smaller." },
        { status: 400 }
      );
    }

    const originalExtension = path.extname(file.name).toLowerCase();
    const extension = allowedExtensions.has(originalExtension)
      ? originalExtension
      : ".jpg";

    const safeName = `vehicle-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "vehicles"
    );

    await mkdir(uploadDirectory, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(path.join(uploadDirectory, safeName), buffer);

    const imageUrl = `/uploads/vehicles/${safeName}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: "Vehicle image uploaded successfully.",
    });
  } catch (error) {
    console.error("Vehicle image upload error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to upload vehicle image." },
      { status: 500 }
    );
  }
}
