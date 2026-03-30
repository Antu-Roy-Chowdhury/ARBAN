import { NextRequest, NextResponse } from "next/server";
import { readdir } from "fs/promises";
import nodePath from "path";

export interface LocalImage {
  name: string;
  url: string;
  path: string;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"]);

function normalizePatientId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const normalizedPatientId = normalizePatientId(patientId);

  if (normalizedPatientId === null) {
    return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
  }

  try {
    const publicImagesRoot = nodePath.join(process.cwd(), "public", "images");
    const directoryEntries = await readdir(publicImagesRoot, { withFileTypes: true });

    const matchingFolder = directoryEntries.find((entry) => {
      if (!entry.isDirectory()) return false;
      return normalizePatientId(entry.name) === normalizedPatientId;
    });

    if (!matchingFolder) {
      return NextResponse.json({
        patient_id: patientId,
        images: [],
        total: 0,
      });
    }

    const patientFolderPath = nodePath.join(publicImagesRoot, matchingFolder.name);
    const files = await readdir(patientFolderPath, { withFileTypes: true });

    const images: LocalImage[] = files
      .filter((file) => file.isFile())
      .filter((file) => IMAGE_EXTENSIONS.has(nodePath.extname(file.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .map((file) => ({
        name: file.name,
        path: `images/${matchingFolder.name}/${file.name}`,
        url: `/images/${encodeURIComponent(matchingFolder.name)}/${encodeURIComponent(file.name)}`,
      }));

    return NextResponse.json({
      patient_id: patientId,
      folder: matchingFolder.name,
      images,
      total: images.length,
    });
  } catch (error) {
    console.error("Error fetching local patient images:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        images: [],
      },
      { status: 200 }
    );
  }
}
