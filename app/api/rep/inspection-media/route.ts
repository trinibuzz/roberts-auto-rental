import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

type RepUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const repCookie = cookies.find((cookie) =>
    cookie.startsWith("roberts_rep_token=")
  );

  if (!repCookie) return null;

  return repCookie.split("=")[1];
}

function verifyRep(request: NextRequest) {
  const token = getTokenFromCookie(request.headers.get("cookie"));

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as RepUser;

    const allowedRoles = ["admin", "staff", "rep"];

    if (!allowedRoles.includes(String(decoded.role || "").toLowerCase())) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyRep(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const bookingId = Number(formData.get("booking_id") || 0);
    const vehicleId = Number(formData.get("vehicle_id") || 0);
    const inspectionType = String(formData.get("inspection_type") || "");
    const file = formData.get("file") as File | null;

    if (!bookingId || !vehicleId || !inspectionType || !file) {
      return NextResponse.json(
        { message: "Booking, vehicle, inspection type, and file are required." },
        { status: 400 }
      );
    }

    if (!["checkout", "return"].includes(inspectionType)) {
      return NextResponse.json(
        { message: "Inspection type must be checkout or return." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Only MP4, MOV, WEBM, JPG, PNG, or WEBP files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File is too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "inspection-videos"
    );

    await mkdir(uploadDir, { recursive: true });

    const originalName = cleanFileName(file.name || "inspection-file");
    const extension = path.extname(originalName);
    const fileBaseName = path.basename(originalName, extension);

    const storedFileName = `${Date.now()}-${bookingId}-${fileBaseName}${extension}`;
    const filePath = path.join(uploadDir, storedFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/inspection-videos/${storedFileName}`;
    const mediaType = file.type.startsWith("image/") ? "photo" : "video";

    const pool = createPool();

    await pool.execute(
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3, 0)
      `,
      [
        bookingId,
        vehicleId,
        inspectionType,
        mediaType,
        fileUrl,
        storedFileName,
        file.size,
        file.type,
      ]
    );

    return NextResponse.json({
      message: "File uploaded successfully.",
      file_url: fileUrl,
    });
  } catch (error) {
    console.error("REP INSPECTION MEDIA ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while uploading file." },
      { status: 500 }
    );
  }
}