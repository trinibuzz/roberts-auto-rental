import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No image file uploaded." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 8 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "Image is too large. Max size is 8MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension =
      path.extname(file.name || "").toLowerCase().replace(/[^a-z0-9.]/g, "") ||
      ".jpg";

    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "customers"
    );

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      imagePath: `/uploads/customers/${fileName}`,
    });
  } catch (error) {
    console.error("CUSTOMER PHOTO UPLOAD ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to upload customer photo." },
      { status: 500 }
    );
  }
}
