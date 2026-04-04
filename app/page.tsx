"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getDistinctPatients,
  getPatientInfo,
  getPatientImages,
  getPatientReports,
  getPatientLatestReview,
  getDistinctBodyParts,
  submitReview,
  Patient,
  ImageMetadata,
  Report,
  Review,
  StorageImage,
} from "@/lib/supabase";
import { PatientInfoPanel } from "@/components/PatientInfoPanel";
import { DicomMetadataPanel } from "@/components/DicomMetadataPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { AutoFlagsPanel } from "@/components/AutoFlagsPanel";
import { ReviewPanel } from "@/components/ReviewPanel";
import { ImageGallery } from "@/components/ImageGallery";
import { Button } from "@/components/ui/button";

interface DataState {
  patient: Patient | null;
  images: ImageMetadata[];
  storageImages: StorageImage[];
  reports: Report[];
  review: Review | null;
}

function normalizePatientKey(value: string) {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? trimmed : String(parsed);
}

function HomeContent() {
  const searchParams = useSearchParams();

  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [patientList, setPatientList] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    searchParams.get("filter") || "ALL"
  );
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(
    searchParams.get("patient") || null
  );
  const [patientSearch, setPatientSearch] = useState<string>(
    searchParams.get("patient") || ""
  );
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const [data, setData] = useState<DataState>({
    patient: null,
    images: [],
    storageImages: [],
    reports: [],
    review: null,
  });

  const [loading, setLoading] = useState({
    bodyParts: true,
    patients: true,
    patient: false,
    images: false,
    storage: false,
    report: false,
    review: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patientOptions = useMemo(
    () => patientList.map((patientId) => ({ patientId, normalized: normalizePatientKey(patientId) })),
    [patientList]
  );

  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const parts = await getDistinctBodyParts();
        setBodyParts(parts);
      } catch (err) {
        console.error("Error loading body parts:", err);
      } finally {
        setLoading((prev) => ({ ...prev, bodyParts: false }));
      }
    };

    loadBodyParts();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading((prev) => ({ ...prev, patients: true }));
      try {
        const patients = await getDistinctPatients(
          selectedFilter === "ALL" ? undefined : selectedFilter
        );
        setPatientList(patients);

        if (patients.length > 0 && (!currentPatientId || !patients.includes(currentPatientId))) {
          setCurrentPatientId(patients[0]);
          setPatientSearch(patients[0]);
          setSelectedImageId(null);
        }
      } catch (err) {
        console.error("Error loading patients:", err);
        setError("Failed to load patient list");
      } finally {
        setLoading((prev) => ({ ...prev, patients: false }));
      }
    };

    loadPatients();
  }, [selectedFilter, currentPatientId]);

  useEffect(() => {
    if (currentPatientId) {
      setPatientSearch(currentPatientId);
    }
  }, [currentPatientId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedFilter !== "ALL") params.set("filter", selectedFilter);
    if (currentPatientId) params.set("patient", currentPatientId);

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";
    window.history.replaceState({}, "", newUrl);
  }, [selectedFilter, currentPatientId]);

  useEffect(() => {
    if (!currentPatientId) return;

    const loadPatientData = async () => {
      setLoading((prev) => ({
        ...prev,
        patient: true,
        images: true,
        storage: true,
        report: true,
        review: true,
      }));
      setError(null);
      setSelectedImageId(null);

      try {
        const [patient, images, reports, review] = await Promise.all([
          getPatientInfo(currentPatientId),
          getPatientImages(currentPatientId),
          getPatientReports(currentPatientId),
          getPatientLatestReview(currentPatientId),
        ]);

        setData({
          patient,
          images: images || [],
          storageImages: [],
          reports,
          review,
        });

        if (images && images.length > 0) {
          setSelectedImageId(images[0].id);
        }

        try {
          const storageResponse = await fetch(`/api/patient-images/${currentPatientId}`);
          const contentType = storageResponse.headers.get("content-type") || "";

          if (!storageResponse.ok || !contentType.includes("application/json")) {
            console.error("Error fetching local images:", {
              status: storageResponse.status,
              contentType,
            });
          } else {
            const storageData = await storageResponse.json();

            if (storageData.images && storageData.images.length > 0) {
              setData((prev) => ({
                ...prev,
                storageImages: storageData.images,
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching local images:", err);
        }

        setLoading((prev) => ({
          ...prev,
          patient: false,
          images: false,
          storage: false,
          report: false,
          review: false,
        }));
      } catch (err) {
        console.error("Error loading patient data:", err);
        setError("Failed to load patient data");
        setLoading((prev) => ({
          ...prev,
          patient: false,
          images: false,
          storage: false,
          report: false,
          review: false,
        }));
      }
    };

    loadPatientData();
  }, [currentPatientId]);

  const handleFilterChange = (newFilter: string) => {
    setSelectedFilter(newFilter);
  };

  const handleFindPatient = () => {
    const target = normalizePatientKey(patientSearch);
    const exactMatch = patientOptions.find((item) => item.patientId === patientSearch.trim());
    const normalizedMatches = patientOptions.filter((item) => item.normalized === target);
    const matchedPatient = exactMatch?.patientId || normalizedMatches[0]?.patientId;

    if (matchedPatient) {
      setCurrentPatientId(matchedPatient);
      setError(null);
    } else {
      setError(`Patient ID not found: ${patientSearch}`);
    }
  };

  const handlePrevPatient = useCallback(() => {
    if (!currentPatientId || patientList.length === 0) return;
    const currentIndex = patientList.indexOf(currentPatientId);
    if (currentIndex > 0) {
      setCurrentPatientId(patientList[currentIndex - 1]);
      return;
    }
    setCurrentPatientId(patientList[patientList.length - 1]);
  }, [currentPatientId, patientList]);

  const handleNextPatient = useCallback(() => {
    if (!currentPatientId || patientList.length === 0) return;
    const currentIndex = patientList.indexOf(currentPatientId);
    if (currentIndex < patientList.length - 1) {
      setCurrentPatientId(patientList[currentIndex + 1]);
      return;
    }
    setCurrentPatientId(patientList[0]);
  }, [currentPatientId, patientList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPatient();
      } else if (e.key === "ArrowRight") {
        handleNextPatient();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPatient, handleNextPatient]);

  const handleSubmitReview = async (
    review: Omit<Review, "id" | "reviewed_at">
  ) => {
    setSubmitting(true);
    try {
      await submitReview(review);
      const latestReview = await getPatientLatestReview(currentPatientId!);
      setData((prev) => ({ ...prev, review: latestReview }));
      const refreshedPatients = await getDistinctPatients(
        selectedFilter === "ALL" ? undefined : selectedFilter
      );
      setPatientList(refreshedPatients);
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = currentPatientId ? patientList.indexOf(currentPatientId) : -1;
  const isSinglePatient = patientList.length <= 1;
  const primaryReport = data.reports[0] || null;

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b bg-gray-50">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Medical Image Report Verification
            </h1>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-blue-200 bg-white text-blue-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
              >
                <Link href="/review-status">Review Status</Link>
              </Button>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                {Math.max(currentIndex + 1, 0)} / {patientList.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px]">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Find by Patient ID
              </label>
              <div className="flex gap-2">
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFindPatient();
                    }
                  }}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Patient ID"
                />
                <Button type="button" onClick={handleFindPatient} size="sm">
                  Find
                </Button>
              </div>
            </div>

            <div className="min-w-[260px] flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Filter by Body Part
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Body Parts</option>
                {bodyParts.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handlePrevPatient}
                disabled={isSinglePatient}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPatient}
                disabled={isSinglePatient}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
              <p className="ml-2 text-xs text-gray-500">Arrow keys: left / right, queue wraps after review</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <PatientInfoPanel patient={data.patient} isLoading={loading.patient} />
            <div className="h-[calc(100vh-280px)] min-h-[520px] overflow-hidden">
              <ImageGallery
                images={data.storageImages}
                imageMetadata={data.images}
                selectedImageId={selectedImageId || undefined}
                onSelectImage={setSelectedImageId}
                isLoading={loading.storage}
              />
            </div>
          </div>

          <div className="space-y-4">
            <DicomMetadataPanel
              images={data.images}
              selectedImageId={selectedImageId || undefined}
              isLoading={loading.images}
            />
            <ReportPanel
              reports={data.reports}
              images={data.images}
              isLoading={loading.report}
            />
            <AutoFlagsPanel
              report={primaryReport}
              images={data.images}
              isLoading={loading.report}
            />
          </div>

          <div className="xl:sticky xl:top-28 xl:h-fit">
            <ReviewPanel
              review={data.review}
              patientId={currentPatientId || ""}
              imageId={selectedImageId}
              onSubmit={handleSubmitReview}
              isLoading={loading.review}
              isSubmitting={submitting}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function HomeFallback() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="h-10 w-80 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 h-[70vh] animate-pulse rounded-xl bg-gray-100" />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
