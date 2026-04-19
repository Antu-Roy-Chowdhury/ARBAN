import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Patient {
  patient_id: string;
  patient_name: string | null;
  age: string | null;
  sex: string | null;
}

export interface ImageMetadata {
  id: number;
  patient_id: string;
  file_name: string | null;
  file_path: string | null;
  body_part_clean: string | null;
  body_part_raw: string | null;
  view_position: string | null;
  study_date: string | null;
  modality: string | null;
  series_description: string | null;
  instance_number: number | null;
  rows: number | null;
  columns: number | null;
  age: string | null;
  patient_name: string | null;
  sex: string | null;
  has_missing_body_part: boolean;
}

export interface StorageImage {
  name: string;
  url: string;
  path: string;
}

export interface Report {
  id: number;
  patient_id: string;
  report_title: string | null;
  patient_name: string | null;
  age_raw: string | null;
  findings_text: string | null;
  impression_text: string | null;
  full_report_text: string | null;
  raw_text: string | null;
  has_missing_impression: boolean;
  created_at: string | null;
}

export interface Review {
  id: number;
  patient_id: string | null;
  image_id: number | null;
  status: "matched" | "mismatch" | "unsure";
  label: "normal" | "abnormal";
  final_impression: string | null;
  notes: string | null;
  reviewer_name: string | null;
  reviewed_at: string;
}

export interface SecondPassReview {
  id: number;
  source_review_id: number;
  patient_id: string;
  image_id: number | null;
  review_decision: "approved" | "corrected";
  status: Review["status"];
  label: Review["label"];
  final_impression: string | null;
  notes: string | null;
  reviewer2_name: string;
  reviewed_at: string;
}

export interface ReviewQueueItem {
  patient_id: string;
  patient_name: string | null;
  image_count: number;
  report_count: number;
  body_parts: string[];
  latest_reviewed_at: string | null;
  latest_review_status: Review["status"] | null;
  latest_second_pass_reviewed_at: string | null;
  latest_second_pass_status: Review["status"] | null;
  latest_second_pass_decision: SecondPassReview["review_decision"] | null;
  is_reviewed: boolean;
  is_second_pass_reviewed: boolean;
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function sortPatientsByReviewStatus(
  patientIds: string[],
  firstReviewedSet: Set<string>,
  secondReviewedSet: Set<string>
) {
  return [...patientIds].sort((a, b) => {
    const aNeedsSecondPass = firstReviewedSet.has(a) && !secondReviewedSet.has(a);
    const bNeedsSecondPass = firstReviewedSet.has(b) && !secondReviewedSet.has(b);
    const aFirstPending = !firstReviewedSet.has(a);
    const bFirstPending = !firstReviewedSet.has(b);

    if (aNeedsSecondPass !== bNeedsSecondPass) {
      return aNeedsSecondPass ? -1 : 1;
    }

    if (aFirstPending !== bFirstPending) {
      return aFirstPending ? 1 : -1;
    }

    return naturalCompare(a, b);
  });
}

export async function getDistinctPatients(
  bodyPartFilter?: string,
  reviewStatusFilter: "ALL" | "PENDING_SECOND_PASS" | "COMPLETED_SECOND_PASS" | "FIRST_PASS_PENDING" = "ALL",
  resultFilter: "ALL" | Review["status"] = "ALL"
) {
  try {
    let imagesQuery = supabase.from("images").select("patient_id");

    if (bodyPartFilter && bodyPartFilter !== "ALL") {
      imagesQuery = imagesQuery.eq("body_part_clean", bodyPartFilter);
    }

    const [
      { data: imageRows, error: imagesError },
      { data: reviewRows, error: reviewsError },
      { data: secondPassRows, error: secondPassError },
    ] =
      await Promise.all([
        imagesQuery,
        supabase
          .from("reviews")
          .select("patient_id, status, reviewed_at")
          .not("patient_id", "is", null)
          .order("reviewed_at", { ascending: false }),
        supabase
          .from("reviews_second_pass")
          .select("patient_id")
          .not("patient_id", "is", null),
      ]);

    if (imagesError) throw imagesError;
    if (reviewsError) throw reviewsError;
    if (secondPassError) throw secondPassError;

    const patientIds = Array.from(
      new Set(
        (imageRows || [])
          .map((row: { patient_id: string | null }) => row.patient_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const reviewedSet = new Set(
      (reviewRows || [])
        .map((row: { patient_id: string | null }) => row.patient_id)
        .filter((id): id is string => Boolean(id))
    );

    const secondReviewedSet = new Set(
      (secondPassRows || [])
        .map((row: { patient_id: string | null }) => row.patient_id)
        .filter((id): id is string => Boolean(id))
    );

    const latestStatusByPatient = new Map<string, Review["status"] | null>();
    for (const row of reviewRows || []) {
      const review = row as {
        patient_id: string | null;
        status?: Review["status"] | null;
      };
      if (!review.patient_id || latestStatusByPatient.has(review.patient_id)) continue;
      latestStatusByPatient.set(review.patient_id, review.status || null);
    }

    const filteredPatientIds = patientIds.filter((patientId) => {
      const matchesWorkflow = (() => {
        switch (reviewStatusFilter) {
        case "PENDING_SECOND_PASS":
          return reviewedSet.has(patientId) && !secondReviewedSet.has(patientId);
        case "COMPLETED_SECOND_PASS":
          return secondReviewedSet.has(patientId);
        case "FIRST_PASS_PENDING":
          return !reviewedSet.has(patientId);
        default:
          return true;
        }
      })();

      const matchesResult =
        resultFilter === "ALL" || latestStatusByPatient.get(patientId) === resultFilter;

      return matchesWorkflow && matchesResult;
    });

    return sortPatientsByReviewStatus(filteredPatientIds, reviewedSet, secondReviewedSet);
  } catch (error) {
    console.error("Error fetching distinct patients:", error);
    throw error;
  }
}

export async function getPatientInfo(patientId: string) {
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

export async function getPatientImages(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("patient_id", patientId)
      .order("instance_number", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });

    if (error) throw error;
    return data as ImageMetadata[];
  } catch (error) {
    console.error("Error fetching patient images:", error);
    return [];
  }
}

export async function getPatientReports(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });

    if (error) throw error;
    return (data || []) as Report[];
  } catch (error) {
    console.error("Error fetching patient reports:", error);
    return [];
  }
}

export async function getPatientLatestReview(patientId: string) {
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

export async function getPatientLatestSecondPassReview(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("reviews_second_pass")
      .select("*")
      .eq("patient_id", patientId)
      .order("reviewed_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] as SecondPassReview | null;
  } catch (error) {
    console.error("Error fetching patient second-pass review:", error);
    return null;
  }
}

export async function getDistinctBodyParts() {
  try {
    const { data, error } = await supabase.from("images").select("body_part_clean");

    if (error) throw error;

    const bodyParts = Array.from(
      new Set(
        (data || [])
          .map((row: { body_part_clean: string | null }) => row.body_part_clean)
          .filter((part): part is string => Boolean(part))
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return bodyParts;
  } catch (error) {
    console.error("Error fetching body parts:", error);
    return [];
  }
}

export async function getReviewQueue() {
  try {
    const [
      { data: imageRows, error: imagesError },
      { data: patientRows, error: patientsError },
      { data: reportRows, error: reportsError },
      { data: reviewRows, error: reviewsError },
      { data: secondPassRows, error: secondPassError },
    ] = await Promise.all([
      supabase.from("images").select("patient_id, body_part_clean"),
      supabase.from("patients").select("patient_id, patient_name"),
      supabase.from("reports").select("patient_id"),
      supabase
        .from("reviews")
        .select("patient_id, reviewed_at, status")
        .order("reviewed_at", { ascending: false }),
      supabase
        .from("reviews_second_pass")
        .select("patient_id, reviewed_at, status, review_decision")
        .order("reviewed_at", { ascending: false }),
    ]);

    if (imagesError) throw imagesError;
    if (patientsError) throw patientsError;
    if (reportsError) throw reportsError;
    if (reviewsError) throw reviewsError;
    if (secondPassError) throw secondPassError;

    const patientNameMap = new Map(
      (patientRows || []).map((row: { patient_id: string; patient_name: string | null }) => [
        row.patient_id,
        row.patient_name,
      ])
    );

    const imageCountMap = new Map<string, number>();
    const bodyPartMap = new Map<string, Set<string>>();
    for (const row of imageRows || []) {
      const image = row as {
        patient_id: string | null;
        body_part_clean?: string | null;
      };
      const patientId = image.patient_id;
      if (!patientId) continue;

      imageCountMap.set(patientId, (imageCountMap.get(patientId) || 0) + 1);

      if (image.body_part_clean) {
        const parts = bodyPartMap.get(patientId) || new Set<string>();
        parts.add(image.body_part_clean);
        bodyPartMap.set(patientId, parts);
      }
    }

    const reportCountMap = new Map<string, number>();
    for (const row of reportRows || []) {
      const patientId = (row as { patient_id: string | null }).patient_id;
      if (!patientId) continue;
      reportCountMap.set(patientId, (reportCountMap.get(patientId) || 0) + 1);
    }

    const latestReviewMap = new Map<
      string,
      { reviewed_at: string | null; status: Review["status"] | null }
    >();
    for (const row of reviewRows || []) {
      const review = row as {
        patient_id: string | null;
        reviewed_at: string | null;
        status: Review["status"] | null;
      };
      if (!review.patient_id || latestReviewMap.has(review.patient_id)) continue;
      latestReviewMap.set(review.patient_id, {
        reviewed_at: review.reviewed_at,
        status: review.status,
      });
    }

    const latestSecondPassMap = new Map<
      string,
      {
        reviewed_at: string | null;
        status: Review["status"] | null;
        review_decision: SecondPassReview["review_decision"] | null;
      }
    >();
    for (const row of secondPassRows || []) {
      const review = row as {
        patient_id: string | null;
        reviewed_at: string | null;
        status: Review["status"] | null;
        review_decision: SecondPassReview["review_decision"] | null;
      };
      if (!review.patient_id || latestSecondPassMap.has(review.patient_id)) continue;
      latestSecondPassMap.set(review.patient_id, {
        reviewed_at: review.reviewed_at,
        status: review.status,
        review_decision: review.review_decision,
      });
    }

    const patientIds = Array.from(imageCountMap.keys());
    const reviewedSet = new Set(latestReviewMap.keys());
    const secondReviewedSet = new Set(latestSecondPassMap.keys());

    return sortPatientsByReviewStatus(patientIds, reviewedSet, secondReviewedSet).map((patientId) => {
      const latestReview = latestReviewMap.get(patientId);
      const latestSecondPass = latestSecondPassMap.get(patientId);
      return {
        patient_id: patientId,
        patient_name: patientNameMap.get(patientId) || null,
        image_count: imageCountMap.get(patientId) || 0,
        report_count: reportCountMap.get(patientId) || 0,
        body_parts: Array.from(bodyPartMap.get(patientId) || []).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        ),
        latest_reviewed_at: latestReview?.reviewed_at || null,
        latest_review_status: latestReview?.status || null,
        latest_second_pass_reviewed_at: latestSecondPass?.reviewed_at || null,
        latest_second_pass_status: latestSecondPass?.status || null,
        latest_second_pass_decision: latestSecondPass?.review_decision || null,
        is_reviewed: reviewedSet.has(patientId),
        is_second_pass_reviewed: secondReviewedSet.has(patientId),
      } satisfies ReviewQueueItem;
    });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return [];
  }
}

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

export async function submitSecondPassReview(
  review: Omit<SecondPassReview, "id" | "reviewed_at">
) {
  try {
    const { data, error } = await supabase
      .from("reviews_second_pass")
      .upsert([{ ...review, reviewed_at: new Date().toISOString() }], {
        onConflict: "source_review_id",
      })
      .select()
      .single();

    if (error) throw error;
    return data as SecondPassReview;
  } catch (error) {
    console.error("Error submitting second-pass review:", error);
    throw error;
  }
}
