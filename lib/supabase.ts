import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export interface Patient {
  patient_id: number;
  patient_name: string;
  age: number;
  sex: string;
}

export interface ImageMetadata {
  id: number;
  patient_id: number;
  file_name: string;
  body_part_clean: string;
  body_part_raw: string;
  view_position: string;
  study_date: string;
  modality: string;
  series_description: string;
  instance_number: number;
  rows: number;
  columns: number;
  age: number;
  patient_name: string;
  sex: string;
  has_missing_body_part: boolean;
}

export interface StorageImage {
  name: string;
  url: string;
  path: string;
}

export interface Report {
  id: number;
  patient_id: number;
  report_title: string;
  findings_text: string;
  impression_text: string;
  full_report_text: string;
  has_missing_impression: boolean;
}

export interface Review {
  id: number;
  patient_id: number;
  image_id: number;
  status: "matched" | "mismatch" | "unsure";
  label: "normal" | "abnormal";
  final_impression: string;
  notes: string;
  reviewer_name: string;
  reviewed_at: string;
}

function buildStorageImageUrl(rootUrl: string, objectPath: string) {
  const cleanRoot = rootUrl.replace(/\/$/, "");
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (cleanRoot.endsWith("/storage/v1/object/public/images")) {
    return `${cleanRoot}/${encodedPath}`;
  }

  if (cleanRoot.endsWith("/storage/v1/object/public")) {
    return `${cleanRoot}/images/${encodedPath}`;
  }

  return `${cleanRoot}/storage/v1/object/public/images/${encodedPath}`;
}

// Fetch distinct patient IDs (for filtering)
export async function getDistinctPatients(bodyPartFilter?: string) {
  try {
    let query = supabase.from("images").select("patient_id");

    if (bodyPartFilter && bodyPartFilter !== "ALL") {
      query = query.eq("body_part_clean", bodyPartFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    const patientIds = data
      ?.map((row: any) => row.patient_id)
      .filter((id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx)
      .sort((a: number, b: number) => a - b) || [];

    return patientIds;
  } catch (error) {
    console.error("Error fetching distinct patients:", error);
    throw error;
  }
}

// Fetch patient info
export async function getPatientInfo(patientId: number) {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("patient_id", patientId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as Patient) || null;
  } catch (error) {
    console.error("Error fetching patient info:", error);
    return null;
  }
}

// Fetch all images for a patient
export async function getPatientImages(patientId: number) {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("patient_id", patientId)
      .order("instance_number", { ascending: true });

    if (error) throw error;
    return data as ImageMetadata[];
  } catch (error) {
    console.error("Error fetching patient images:", error);
    return [];
  }
}


export async function getPatientStorageImages(patientId: number) {
  try {
    const rootUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;

    if (!rootUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_STORAGE_URL environment variable.");
    }

    const folderNames = Array.from(
      new Set([patientId.toString(), patientId.toString().padStart(5, "0")])
    );

    for (const folderName of folderNames) {
      const folderPath = `images/${folderName}`;
      const { data, error } = await supabase.storage
        .from("images")
        .list(folderPath, {
          limit: 500,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        continue;
      }

      const files = (data || [])
        .filter((file) => file.name && !file.name.endsWith("/"))
        .map((file) => {
          const objectPath = `${folderPath}/${file.name}`;
          const publicUrl = supabase.storage.from("images").getPublicUrl(objectPath)
            .data.publicUrl;

          return {
            name: file.name,
            path: objectPath,
            url: buildStorageImageUrl(rootUrl, objectPath) || publicUrl,
          };
        }) as StorageImage[];

      if (files.length > 0) {
        return files;
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching patient storage images:", error);
    return [];
  }
}

// Fetch report for a patient
export async function getPatientReport(patientId: number) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("patient_id", patientId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as Report | null;
  } catch (error) {
    console.error("Error fetching patient report:", error);
    return null;
  }
}

// Fetch latest review for a patient
export async function getPatientLatestReview(patientId: number) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("patient_id", patientId)
      .order("reviewed_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] as Review | null;
  } catch (error) {
    console.error("Error fetching patient review:", error);
    return null;
  }
}

// Get distinct body parts for filtering
export async function getDistinctBodyParts() {
  try {
    const { data, error } = await supabase.from("images").select("body_part_clean");

    if (error) throw error;

    const bodyParts = data
      ?.map((row: any) => row.body_part_clean)
      .filter((part: string | null) => part !== null)
      .filter((part: string, idx: number, arr: string[]) => arr.indexOf(part) === idx)
      .sort() || [];

    return bodyParts as string[];
  } catch (error) {
    console.error("Error fetching body parts:", error);
    return [];
  }
}

// Submit a review
export async function submitReview(review: Omit<Review, "id" | "reviewed_at">) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert([{ ...review, reviewed_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}



