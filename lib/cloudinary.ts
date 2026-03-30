// Supabase Storage utility functions for image URL construction

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;

if (!SUPABASE_URL || !SUPABASE_STORAGE_URL) {
  console.warn(
    "Supabase storage environment variables are not set. Images may not load correctly."
  );
}

export interface StorageImage {
  name: string;
  url: string;
  path: string;
}

/**
 * Build a Supabase storage URL for an image
 * Format: https://[SUPABASE_URL]/storage/v1/object/public/images/[patient_id]/[filename]
 */
export function buildStorageUrl(patientId: string, filename: string): string {
  if (!SUPABASE_STORAGE_URL) return "";
  return `${SUPABASE_STORAGE_URL}/object/public/images/${patientId}/${filename}`;
}

/**
 * Build a thumbnail URL for gallery display
 */
export function buildThumbnailUrl(patientId: string, filename: string): string {
  return buildStorageUrl(patientId, filename);
}

/**
 * Build a full-size display URL for modal
 */
export function buildFullImageUrl(patientId: string, filename: string): string {
  return buildStorageUrl(patientId, filename);
}

/**
 * Extract filename from path
 */
export function getFilenameFromPath(path: string): string {
  return path.split("/").pop() || path;
}

/**
 * Format filename for display
 */
export function formatImageName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}
